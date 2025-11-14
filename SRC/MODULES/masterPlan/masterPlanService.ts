// Master Plan Service — CRUD and template logic
// Depends only on domain types from SRC/DOMAIN/sparkModels.ts
// Keep pure and framework-agnostic; consumer decides persistence.

import {
  Project,
  ProjectStatus,
  PlanItem,
  PlanItemStatus,
  PlanItemPriority,
  PlanItemCategory,
  UUID,
  ISODateString,
  ISODateTimeString,
} from "../../DOMAIN/sparkModels";

// In-memory stores (replace with adapters later)
export interface MasterPlanData {
  projects: Project[];
  planItems: PlanItem[];
  now: () => ISODateTimeString; // injectable clock for testability
  uuid: () => UUID; // injectable id generator
  // Optional persistence hook injected by adapter. If present, will be invoked
  // after any mutating operation (create/update/delete/template preload/toggle).
  persist?: () => Promise<void>;
  audit?: (event: {
    entity_type: 'Project' | 'PlanItem';
    change_type: 'Create' | 'Update' | 'Delete' | 'TemplateLoad' | 'ChecklistToggle';
    entity_id: UUID;
    project_id?: UUID;
    before?: unknown;
    after?: unknown;
    detail?: string;
  }) => void | Promise<void>; // optional audit hook
}

export function createEmptyData(idGen: () => UUID, clock: () => ISODateTimeString): MasterPlanData {
  return { projects: [], planItems: [], uuid: idGen, now: clock };
}

// ─────────────────────────────────────────────────────────────
// Project CRUD
// ─────────────────────────────────────────────────────────────

export interface CreateProjectInput {
  name: string;
  description: string;
  start_date: ISODateString;
  target_end_date: ISODateString;
  color?: string;
}

export function createProject(data: MasterPlanData, input: CreateProjectInput): Project {
  const project: Project = {
    id: data.uuid(),
    name: input.name.trim(),
    description: input.description.trim(),
    status: 'Active',
    start_date: input.start_date,
    target_end_date: input.target_end_date,
    color: input.color || '#888888',
    created_at: data.now(),
    updated_at: data.now(),
  };
  data.projects.push(project);
  if (data.persist) void data.persist();
  if (data.audit) void data.audit({ entity_type: 'Project', change_type: 'Create', entity_id: project.id, after: project });
  return project;
}

export function updateProject(data: MasterPlanData, id: UUID, changes: Partial<Omit<Project, 'id' | 'created_at'>>): Project | null {
  const p = data.projects.find(p => p.id === id);
  if (!p) return null;
  const before: Project = { ...p };
  if (changes.name !== undefined) p.name = changes.name.trim();
  if (changes.description !== undefined) p.description = changes.description.trim();
  if (changes.status !== undefined) p.status = changes.status as ProjectStatus;
  if (changes.start_date !== undefined) p.start_date = changes.start_date;
  if (changes.target_end_date !== undefined) p.target_end_date = changes.target_end_date;
  if (changes.color !== undefined) p.color = changes.color;
  p.updated_at = data.now();
  // In a future audit log, record before & after diff.
  if (data.persist) void data.persist();
  if (data.audit) void data.audit({ entity_type: 'Project', change_type: 'Update', entity_id: p.id, before, after: p });
  return p;
}

export function deleteProject(data: MasterPlanData, id: UUID): boolean {
  const idx = data.projects.findIndex(p => p.id === id);
  if (idx === -1) return false;
  // Also remove associated plan items
  const removedItems = data.planItems.filter(pi => pi.project_id === id);
  data.planItems = data.planItems.filter(pi => pi.project_id !== id);
  data.projects.splice(idx, 1);
  if (data.persist) void data.persist();
  if (data.audit) {
    void data.audit({ entity_type: 'Project', change_type: 'Delete', entity_id: id });
    for (const pi of removedItems) {
      void data.audit({ entity_type: 'PlanItem', change_type: 'Delete', entity_id: pi.id, project_id: id, before: pi, detail: 'Cascade delete due to project removal' });
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// PlanItem CRUD
// ─────────────────────────────────────────────────────────────

export interface CreatePlanItemInput {
  project_id: UUID;
  title: string;
  description: string;
  category: PlanItemCategory;
  due_date: ISODateString | null;
  priority: PlanItemPriority;
  checklist?: { label: string }[];
  notes?: string;
}

export function createPlanItem(data: MasterPlanData, input: CreatePlanItemInput): PlanItem {
  // Validate project exists
  if (!data.projects.some(p => p.id === input.project_id)) throw new Error('Project not found');
  const planItem: PlanItem = {
    id: data.uuid(),
    project_id: input.project_id,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    status: 'NotStarted',
    due_date: input.due_date,
    priority: input.priority,
    checklist: (input.checklist || []).map(c => ({ id: data.uuid(), label: c.label.trim(), checked: false })),
    notes: input.notes?.trim() || '',
    created_at: data.now(),
    updated_at: data.now(),
  };
  data.planItems.push(planItem);
  if (data.persist) void data.persist();
  if (data.audit) void data.audit({ entity_type: 'PlanItem', change_type: 'Create', entity_id: planItem.id, project_id: planItem.project_id, after: planItem });
  return planItem;
}

export function updatePlanItem(data: MasterPlanData, id: UUID, changes: Partial<Omit<PlanItem, 'id' | 'project_id' | 'created_at' | 'checklist'>> & { checklist?: { id?: UUID; label: string; checked?: boolean }[] }): PlanItem | null {
  const pi = data.planItems.find(pi => pi.id === id);
  if (!pi) return null;
  const before: PlanItem = { ...pi, checklist: pi.checklist.map(c => ({ ...c })) };
  if (changes.title !== undefined) pi.title = changes.title.trim();
  if (changes.description !== undefined) pi.description = changes.description.trim();
  if (changes.category !== undefined) pi.category = changes.category as PlanItemCategory;
  if (changes.status !== undefined) pi.status = changes.status as PlanItemStatus;
  if (changes.due_date !== undefined) pi.due_date = changes.due_date;
  if (changes.priority !== undefined) pi.priority = changes.priority as PlanItemPriority;
  if (changes.notes !== undefined) pi.notes = changes.notes.trim();
  if (changes.checklist !== undefined) {
    // Replace items (future improvement: patch-level updates)
    pi.checklist = changes.checklist.map(item => ({
      id: item.id || data.uuid(),
      label: item.label.trim(),
      checked: item.checked ?? false,
    }));
  }
  pi.updated_at = data.now();
  if (data.persist) void data.persist();
  if (data.audit) void data.audit({ entity_type: 'PlanItem', change_type: 'Update', entity_id: pi.id, project_id: pi.project_id, before, after: pi });
  return pi;
}

export function deletePlanItem(data: MasterPlanData, id: UUID): boolean {
  const idx = data.planItems.findIndex(pi => pi.id === id);
  if (idx === -1) return false;
  const before = data.planItems[idx];
  data.planItems.splice(idx, 1);
  if (data.persist) void data.persist();
  if (data.audit) void data.audit({ entity_type: 'PlanItem', change_type: 'Delete', entity_id: id, project_id: before.project_id, before });
  return true;
}

// ─────────────────────────────────────────────────────────────
// Query & Metrics
// ─────────────────────────────────────────────────────────────

export interface PlanItemFilter {
  project_id?: UUID;
  status?: PlanItemStatus[];
  category?: PlanItemCategory[];
  priority?: PlanItemPriority[];
  due_before?: ISODateString;
  due_after?: ISODateString;
}

export function filterPlanItems(data: MasterPlanData, filter: PlanItemFilter): PlanItem[] {
  return data.planItems.filter(pi => {
    if (filter.project_id && pi.project_id !== filter.project_id) return false;
    if (filter.status && !filter.status.includes(pi.status)) return false;
    if (filter.category && !filter.category.includes(pi.category)) return false;
    if (filter.priority && !filter.priority.includes(pi.priority)) return false;
    if (filter.due_before && pi.due_date && pi.due_date > filter.due_before) return false;
    if (filter.due_after && pi.due_date && pi.due_date < filter.due_after) return false;
    return true;
  });
}

export function projectProgress(data: MasterPlanData, project_id: UUID): { total: number; done: number; percent: number } {
  const items = data.planItems.filter(pi => pi.project_id === project_id);
  const done = items.filter(i => i.status === 'Done').length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

// ─────────────────────────────────────────────────────────────
// MDCR 11-Day Template (Example stub)
// ─────────────────────────────────────────────────────────────

interface MdcrTaskSpec { title: string; description: string; category: PlanItemCategory; priority: PlanItemPriority; dayOffset: number; }

const MDCR_TEMPLATE: MdcrTaskSpec[] = [
  { title: 'Collect core documents', description: 'Gather CPS, medical, police records', category: 'Evidence', priority: 'High', dayOffset: 0 },
  { title: 'Initial timeline draft', description: 'Start chronology of key events', category: 'Drafting', priority: 'Normal', dayOffset: 0 },
  { title: 'Identify misconduct flags', description: 'Scan documents for potential violations', category: 'Research', priority: 'High', dayOffset: 1 },
  { title: 'Draft appeal outline', description: 'High-level structure for MDCR appeal', category: 'Drafting', priority: 'High', dayOffset: 2 },
  { title: 'Refine timeline', description: 'Add details & corroborations', category: 'Drafting', priority: 'Normal', dayOffset: 3 },
  { title: 'Evidence packet assembly', description: 'Compile supporting exhibits', category: 'Evidence', priority: 'High', dayOffset: 4 },
  { title: 'First draft appeal letter', description: 'Write narrative and legal basis', category: 'Drafting', priority: 'Critical', dayOffset: 5 },
  { title: 'Review & edit draft', description: 'Iterate for clarity & impact', category: 'Drafting', priority: 'High', dayOffset: 6 },
  { title: 'Legal rule cross-check', description: 'Validate citations & policies', category: 'Research', priority: 'High', dayOffset: 7 },
  { title: 'Finalize evidence packet', description: 'Ensure completeness & labeling', category: 'Evidence', priority: 'High', dayOffset: 8 },
  { title: 'Finalize appeal letter', description: 'Polish language, ensure accuracy', category: 'Drafting', priority: 'Critical', dayOffset: 9 },
  { title: 'Submission prep', description: 'Confirm submission process & contacts', category: 'Admin', priority: 'Normal', dayOffset: 10 },
];

export function preloadMdcrTemplate(data: MasterPlanData, project_id: UUID, start_date: ISODateString): PlanItem[] {
  const baseDate = new Date(start_date + 'T00:00:00Z');
  const created: PlanItem[] = [];
  for (const spec of MDCR_TEMPLATE) {
    const dueDateObj = new Date(baseDate.getTime() + spec.dayOffset * 24 * 60 * 60 * 1000);
    const yyyy = dueDateObj.getUTCFullYear();
    const mm = String(dueDateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dueDateObj.getUTCDate()).padStart(2, '0');
    const due_date: ISODateString = `${yyyy}-${mm}-${dd}`;
    created.push(
      createPlanItem(data, {
        project_id,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        due_date,
        priority: spec.priority,
        checklist: [],
        notes: '',
      })
    );
  }
  if (data.persist) void data.persist();
  if (data.audit) {
    for (const createdItem of created) {
      void data.audit({ entity_type: 'PlanItem', change_type: 'TemplateLoad', entity_id: createdItem.id, project_id: project_id, after: createdItem, detail: 'MDCR template preload' });
    }
  }
  return created;
}

// ─────────────────────────────────────────────────────────────
// Utility: toggle checklist item
// ─────────────────────────────────────────────────────────────
export function toggleChecklistItem(data: MasterPlanData, planItemId: UUID, checklistItemId: UUID, checked: boolean): boolean {
  const pi = data.planItems.find(p => p.id === planItemId);
  if (!pi) return false;
  const item = pi.checklist.find(c => c.id === checklistItemId);
  if (!item) return false;
  const beforeItem = { ...item };
  item.checked = checked;
  pi.updated_at = data.now();
  if (data.persist) void data.persist();
  if (data.audit) void data.audit({ entity_type: 'PlanItem', change_type: 'ChecklistToggle', entity_id: pi.id, project_id: pi.project_id, before: beforeItem, after: item, detail: 'Checklist item toggled' });
  return true;
}

// ─────────────────────────────────────────────────────────────
// Exhaustive status guard example
// ─────────────────────────────────────────────────────────────
export function isTerminalPlanItemStatus(status: PlanItemStatus): boolean {
  switch (status) {
    case 'NotStarted':
    case 'InProgress':
      return false;
    case 'Done':
    case 'Dropped':
      return true;
    default: {
      const _exhaustive: never = status; // compile-time exhaustiveness
      return _exhaustive;
    }
  }
}

// Future extension points (placeholders):
// - auditLog(data): Record structured change events
// - persist(adapter): Save to disk/db
// - import/export functions for JSON schema compliance
