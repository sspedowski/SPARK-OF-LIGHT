// Outreach Persistence — JSON snapshot (parallel to masterPlanPersistence)
import { promises as fs } from 'fs';
import * as path from 'path';
import { ContactCategory, Contact, OutreachAction, FollowUpItem, OutcomeRecord, UUID, ISODateTimeString } from '../../DOMAIN/sparkModels';
import { validateContactCategory, validateContact, validateOutreachAction, validateFollowUpItem, validateOutcomeRecord } from './outreachValidators';
import { OutreachData } from './outreachService';

export interface OutreachSnapshot {
  version: number;
  updated_at: ISODateTimeString;
  categories: ContactCategory[];
  contacts: Contact[];
  outreach_actions: OutreachAction[];
  follow_ups: FollowUpItem[];
  outcomes: OutcomeRecord[];
}

const DEFAULT_DIR = path.join(process.cwd(), 'DATA');
const DEFAULT_FILE = path.join(DEFAULT_DIR, 'outreach.snapshot.json');

async function ensureDir(dir: string) { await fs.mkdir(dir, { recursive: true }); }

function emptySnapshot(): OutreachSnapshot {
  return { version: 1, updated_at: new Date().toISOString(), categories: [], contacts: [], outreach_actions: [], follow_ups: [], outcomes: [] };
}

export async function loadOutreachSnapshot(filePath: string = DEFAULT_FILE): Promise<OutreachSnapshot> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Snapshot root invalid');
    const version = typeof parsed.version === 'number' ? parsed.version : 1;
    const updated_at = typeof parsed.updated_at === 'string' ? parsed.updated_at : new Date().toISOString();
    const categoriesRaw = Array.isArray(parsed.categories) ? parsed.categories : [];
    const contactsRaw = Array.isArray(parsed.contacts) ? parsed.contacts : [];
    const actionsRaw = Array.isArray(parsed.outreach_actions) ? parsed.outreach_actions : [];
    const followUpsRaw = Array.isArray(parsed.follow_ups) ? parsed.follow_ups : [];
    const outcomesRaw = Array.isArray(parsed.outcomes) ? parsed.outcomes : [];

    return {
      version,
      updated_at,
      categories: categoriesRaw.map((c: unknown, i: number) => { try { return validateContactCategory(c); } catch (e) { throw new Error(`Category[${i}] invalid: ${(e as Error).message}`); } }),
      contacts: contactsRaw.map((c: unknown, i: number) => { try { return validateContact(c); } catch (e) { throw new Error(`Contact[${i}] invalid: ${(e as Error).message}`); } }),
      outreach_actions: actionsRaw.map((a: unknown, i: number) => { try { return validateOutreachAction(a); } catch (e) { throw new Error(`OutreachAction[${i}] invalid: ${(e as Error).message}`); } }),
      follow_ups: followUpsRaw.map((f: unknown, i: number) => { try { return validateFollowUpItem(f); } catch (e) { throw new Error(`FollowUp[${i}] invalid: ${(e as Error).message}`); } }),
      outcomes: outcomesRaw.map((o: unknown, i: number) => { try { return validateOutcomeRecord(o); } catch (e) { throw new Error(`Outcome[${i}] invalid: ${(e as Error).message}`); } }),
    };
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') return emptySnapshot();
    throw new Error(`Failed to load outreach snapshot: ${e.message}`);
  }
}

async function atomicWrite(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath));
  const tmp = filePath + '.' + Date.now() + '.tmp';
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, filePath);
}

export async function saveOutreachSnapshot(snapshot: OutreachSnapshot, filePath: string = DEFAULT_FILE) {
  const toSave: OutreachSnapshot = { ...snapshot, updated_at: new Date().toISOString() };
  await atomicWrite(filePath, JSON.stringify(toSave, null, 2));
}

export function attachOutreachPersistence(data: OutreachData, filePath: string = DEFAULT_FILE) {
  data.persist = async () => {
    const snapshot: OutreachSnapshot = {
      version: 1,
      updated_at: new Date().toISOString(),
      categories: data.categories.map(c => validateContactCategory(c)),
      contacts: data.contacts.map(c => validateContact(c)),
      outreach_actions: data.outreachActions.map(a => validateOutreachAction(a)),
      follow_ups: data.followUps.map(f => validateFollowUpItem(f)),
      outcomes: data.outcomes.map(o => validateOutcomeRecord(o)),
    };
    await saveOutreachSnapshot(snapshot, filePath);
  };
}

export async function loadOutreachData(filePath: string = DEFAULT_FILE, idGen: () => UUID, clock: () => ISODateTimeString): Promise<OutreachData> {
  const snap = await loadOutreachSnapshot(filePath);
  const data: OutreachData = {
    categories: snap.categories,
    contacts: snap.contacts,
    outreachActions: snap.outreach_actions,
    followUps: snap.follow_ups,
    outcomes: snap.outcomes,
    uuid: idGen,
    now: clock,
    persist: async () => {
      const snapshot: OutreachSnapshot = {
        version: snap.version,
        updated_at: new Date().toISOString(),
        categories: data.categories.map(c => validateContactCategory(c)),
        contacts: data.contacts.map(c => validateContact(c)),
        outreach_actions: data.outreachActions.map(a => validateOutreachAction(a)),
        follow_ups: data.followUps.map(f => validateFollowUpItem(f)),
        outcomes: data.outcomes.map(o => validateOutcomeRecord(o)),
      };
      await saveOutreachSnapshot(snapshot, filePath);
    }
  };
  return data;
}
