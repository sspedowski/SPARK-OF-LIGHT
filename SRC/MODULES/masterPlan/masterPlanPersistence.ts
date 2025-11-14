// Master Plan Persistence — JSON Snapshot Adapter
// Stores projects and planItems in a single JSON file.
// Pure Node fs usage; no external dependencies.

import { promises as fs } from 'fs';
import * as path from 'path';
import { Project, PlanItem, UUID, ISODateTimeString } from '../../DOMAIN/sparkModels.ts';
import { validateProject, validatePlanItem } from './masterPlanValidators.ts';
import { MasterPlanData } from './masterPlanService.ts';

export interface MasterPlanSnapshot {
  version: number; // increment when schema evolves
  updated_at: ISODateTimeString; // last write time
  projects: Project[];
  plan_items: PlanItem[];
}

const DEFAULT_DIR = path.join(process.cwd(), 'DATA');
const DEFAULT_FILE = path.join(DEFAULT_DIR, 'masterPlan.snapshot.json');

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function createEmptySnapshot(): MasterPlanSnapshot {
  return {
    version: 1,
    updated_at: new Date().toISOString(),
    projects: [],
    plan_items: [],
  };
}

export async function loadSnapshot(filePath: string = DEFAULT_FILE): Promise<MasterPlanSnapshot> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Snapshot root not an object');
    const version = typeof parsed.version === 'number' ? parsed.version : 1;
    const updated_at = typeof parsed.updated_at === 'string' ? parsed.updated_at : new Date().toISOString();
    const projectsRaw = Array.isArray(parsed.projects) ? parsed.projects : [];
    const planItemsRaw = Array.isArray(parsed.plan_items) ? parsed.plan_items : [];

    const projects: Project[] = projectsRaw.map((p: unknown, idx: number) => {
      try { return validateProject(p); } catch (e) { throw new Error(`Project[${idx}] invalid: ${(e as Error).message}`); }
    });
    const plan_items: PlanItem[] = planItemsRaw.map((pi: unknown, idx: number) => {
      try { return validatePlanItem(pi); } catch (e) { throw new Error(`PlanItem[${idx}] invalid: ${(e as Error).message}`); }
    });

    return { version, updated_at, projects, plan_items };
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return createEmptySnapshot();
    throw new Error(`Failed to load snapshot: ${e.message}`);
  }
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tmp = filePath + '.' + Date.now() + '.tmp';
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, filePath);
}

export async function saveSnapshot(snapshot: MasterPlanSnapshot, filePath: string = DEFAULT_FILE): Promise<void> {
  const toSave: MasterPlanSnapshot = { ...snapshot, updated_at: new Date().toISOString() };
  const json = JSON.stringify(toSave, null, 2);
  await atomicWrite(filePath, json);
}

// Attach persistence to an existing MasterPlanData instance.
// Adds a persist() method which validates current memory state and writes snapshot.
export function attachPersistence(data: MasterPlanData, filePath: string = DEFAULT_FILE): void {
  data.persist = async () => {
    // validate all before writing to avoid partial corruption
    const projects = data.projects.map(p => validateProject(p));
    const plan_items = data.planItems.map(pi => validatePlanItem(pi));
    const snapshot: MasterPlanSnapshot = {
      version: 1,
      updated_at: new Date().toISOString(),
      projects,
      plan_items,
    };
    await saveSnapshot(snapshot, filePath);
  };
}

// Convenience loader that returns a MasterPlanData hydrated from disk.
export async function loadMasterPlanData(
  filePath: string = DEFAULT_FILE,
  idGen: () => UUID,
  clock: () => ISODateTimeString,
): Promise<MasterPlanData> {
  const snap = await loadSnapshot(filePath);
  const data: MasterPlanData = {
    projects: snap.projects,
    planItems: snap.plan_items,
    uuid: idGen,
    now: clock,
    persist: async () => {
      const projects = data.projects.map(p => validateProject(p));
      const plan_items = data.planItems.map(pi => validatePlanItem(pi));
      const snapshot: MasterPlanSnapshot = {
        version: snap.version, // keep existing version
        updated_at: new Date().toISOString(),
        projects,
        plan_items,
      };
      await saveSnapshot(snapshot, filePath);
    },
  };
  return data;
}
