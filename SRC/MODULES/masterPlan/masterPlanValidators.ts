// Master Plan Validators — runtime validation utilities
// No external dependencies; keep lightweight and aligned with sparkModels.ts
// Validates Project, PlanItem, PlanItemChecklistItem shapes. Throws aggregated errors.

import {
  Project,
  ProjectStatus,
  PlanItem,
  PlanItemStatus,
  PlanItemPriority,
  PlanItemCategory,
  PlanItemChecklistItem,
  UUID,
  ISODateString,
  ISODateTimeString,
} from "../../DOMAIN/sparkModels";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isUUID(v: unknown): v is UUID {
  return typeof v === 'string' && v.length > 0; // Placeholder; enhance later with regex
}

function isISODateString(v: unknown): v is ISODateString {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isISODateTimeString(v: unknown): v is ISODateTimeString {
  return typeof v === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v);
}

const PROJECT_STATUS: ProjectStatus[] = ['Active', 'OnHold', 'Completed', 'Archived'];
const PLAN_ITEM_STATUS: PlanItemStatus[] = ['NotStarted', 'InProgress', 'Done', 'Dropped'];
const PLAN_ITEM_PRIORITY: PlanItemPriority[] = ['Low', 'Normal', 'High', 'Critical'];
const PLAN_ITEM_CATEGORY: PlanItemCategory[] = ['Research', 'Drafting', 'Outreach', 'Evidence', 'Admin', 'Other'];

function enumIncludes<T extends string>(arr: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && arr.includes(v as T);
}

function pushErr(errors: string[], field: string, msg: string) {
  errors.push(`${field}: ${msg}`);
}

// ─────────────────────────────────────────────────────────────
// Checklist Item
// ─────────────────────────────────────────────────────────────
export function validateChecklistItem(input: unknown, parentField = 'checklist'): PlanItemChecklistItem {
  const errors: string[] = [];
  if (!isObject(input)) throw new Error(`${parentField} item must be an object`);
  const { id, label, checked } = input;
  if (!isUUID(id)) pushErr(errors, `${parentField}.id`, 'invalid UUID');
  if (typeof label !== 'string' || !label.trim()) pushErr(errors, `${parentField}.label`, 'must be non-empty string');
  if (typeof checked !== 'boolean') pushErr(errors, `${parentField}.checked`, 'must be boolean');
  if (errors.length) throw new Error(`ChecklistItem validation failed: ${errors.join('; ')}`);
  return {
    id: id as UUID,
    label: (label as string).trim(),
    checked: checked as boolean,
  };
}

// ─────────────────────────────────────────────────────────────
// Project
// ─────────────────────────────────────────────────────────────
export function validateProject(input: unknown): Project {
  const errors: string[] = [];
  if (!isObject(input)) throw new Error('Project must be an object');
  const {
    id,
    name,
    description,
    status,
    start_date,
    target_end_date,
    color,
    created_at,
    updated_at,
  } = input;

  if (!isUUID(id)) pushErr(errors, 'id', 'invalid UUID');
  if (typeof name !== 'string' || !name.trim()) pushErr(errors, 'name', 'must be non-empty string');
  if (typeof description !== 'string') pushErr(errors, 'description', 'must be string');
  if (!enumIncludes(PROJECT_STATUS, status)) pushErr(errors, 'status', `must be one of ${PROJECT_STATUS.join(', ')}`);
  if (!isISODateString(start_date)) pushErr(errors, 'start_date', 'must be YYYY-MM-DD');
  if (!isISODateString(target_end_date)) pushErr(errors, 'target_end_date', 'must be YYYY-MM-DD');
  if (typeof color !== 'string' || !color.trim()) pushErr(errors, 'color', 'must be non-empty string');
  if (!isISODateTimeString(created_at)) pushErr(errors, 'created_at', 'must be ISO timestamp (Z)');
  if (!isISODateTimeString(updated_at)) pushErr(errors, 'updated_at', 'must be ISO timestamp (Z)');

  if (errors.length) throw new Error(`Project validation failed: ${errors.join('; ')}`);

  return {
    id: id as UUID,
    name: (name as string).trim(),
    description: (description as string).trim(),
    status: status as ProjectStatus,
    start_date: start_date as ISODateString,
    target_end_date: target_end_date as ISODateString,
    color: (color as string).trim(),
    created_at: created_at as ISODateTimeString,
    updated_at: updated_at as ISODateTimeString,
  };
}

// ─────────────────────────────────────────────────────────────
// PlanItem
// ─────────────────────────────────────────────────────────────
export function validatePlanItem(input: unknown): PlanItem {
  const errors: string[] = [];
  if (!isObject(input)) throw new Error('PlanItem must be an object');
  const {
    id,
    project_id,
    title,
    description,
    category,
    status,
    due_date,
    priority,
    checklist,
    notes,
    created_at,
    updated_at,
  } = input;

  if (!isUUID(id)) pushErr(errors, 'id', 'invalid UUID');
  if (!isUUID(project_id)) pushErr(errors, 'project_id', 'invalid UUID');
  if (typeof title !== 'string' || !title.trim()) pushErr(errors, 'title', 'must be non-empty string');
  if (typeof description !== 'string') pushErr(errors, 'description', 'must be string');
  if (!enumIncludes(PLAN_ITEM_CATEGORY, category)) pushErr(errors, 'category', `must be one of ${PLAN_ITEM_CATEGORY.join(', ')}`);
  if (!enumIncludes(PLAN_ITEM_STATUS, status)) pushErr(errors, 'status', `must be one of ${PLAN_ITEM_STATUS.join(', ')}`);
  if (!(due_date === null || isISODateString(due_date))) pushErr(errors, 'due_date', 'must be null or YYYY-MM-DD');
  if (!enumIncludes(PLAN_ITEM_PRIORITY, priority)) pushErr(errors, 'priority', `must be one of ${PLAN_ITEM_PRIORITY.join(', ')}`);
  if (!Array.isArray(checklist)) pushErr(errors, 'checklist', 'must be array');
  if (typeof notes !== 'string') pushErr(errors, 'notes', 'must be string');
  if (!isISODateTimeString(created_at)) pushErr(errors, 'created_at', 'must be ISO timestamp (Z)');
  if (!isISODateTimeString(updated_at)) pushErr(errors, 'updated_at', 'must be ISO timestamp (Z)');

  if (errors.length) throw new Error(`PlanItem validation failed: ${errors.join('; ')}`);

  const validatedChecklist: PlanItemChecklistItem[] = (checklist as unknown[]).map((c, idx) => {
    try {
      return validateChecklistItem(c, `checklist[${idx}]`);
    } catch (e) {
      throw new Error(`PlanItem checklist item ${idx} error: ${(e as Error).message}`);
    }
  });

  return {
    id: id as UUID,
    project_id: project_id as UUID,
    title: (title as string).trim(),
    description: (description as string).trim(),
    category: category as PlanItemCategory,
    status: status as PlanItemStatus,
    due_date: due_date as ISODateString | null,
    priority: priority as PlanItemPriority,
    checklist: validatedChecklist,
    notes: (notes as string).trim(),
    created_at: created_at as ISODateTimeString,
    updated_at: updated_at as ISODateTimeString,
  };
}

// ─────────────────────────────────────────────────────────────
// Bulk convenience
// ─────────────────────────────────────────────────────────────
export function validatePlanItems(list: unknown[]): PlanItem[] {
  if (!Array.isArray(list)) throw new Error('validatePlanItems expects an array');
  return list.map((item, i) => {
    try { return validatePlanItem(item); } catch (e) { throw new Error(`Index ${i}: ${(e as Error).message}`); }
  });
}

// Future extension ideas:
// - introduce richer UUID regex
// - accumulate structured error objects instead of strings
// - optional partial validators for updates
// - switch to schema lib (Zod) if dependency policy changes
