// Outreach Persistence — JSON snapshot (parallel to masterPlanPersistence)
import { promises as fs } from 'fs';
import * as path from 'path';
import { validateContactCategory, validateContact, validateOutreachAction, validateFollowUpItem, validateOutcomeRecord } from './outreachValidators';
const DEFAULT_DIR = path.join(process.cwd(), 'DATA');
const DEFAULT_FILE = path.join(DEFAULT_DIR, 'outreach.snapshot.json');
async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }
function emptySnapshot() {
    return { version: 1, updated_at: new Date().toISOString(), categories: [], contacts: [], outreach_actions: [], follow_ups: [], outcomes: [] };
}
export async function loadOutreachSnapshot(filePath = DEFAULT_FILE) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            throw new Error('Snapshot root invalid');
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
            categories: categoriesRaw.map((c, i) => { try {
                return validateContactCategory(c);
            }
            catch (e) {
                throw new Error(`Category[${i}] invalid: ${e.message}`);
            } }),
            contacts: contactsRaw.map((c, i) => { try {
                return validateContact(c);
            }
            catch (e) {
                throw new Error(`Contact[${i}] invalid: ${e.message}`);
            } }),
            outreach_actions: actionsRaw.map((a, i) => { try {
                return validateOutreachAction(a);
            }
            catch (e) {
                throw new Error(`OutreachAction[${i}] invalid: ${e.message}`);
            } }),
            follow_ups: followUpsRaw.map((f, i) => { try {
                return validateFollowUpItem(f);
            }
            catch (e) {
                throw new Error(`FollowUp[${i}] invalid: ${e.message}`);
            } }),
            outcomes: outcomesRaw.map((o, i) => { try {
                return validateOutcomeRecord(o);
            }
            catch (e) {
                throw new Error(`Outcome[${i}] invalid: ${e.message}`);
            } }),
        };
    }
    catch (err) {
        const e = err;
        if (e.code === 'ENOENT')
            return emptySnapshot();
        throw new Error(`Failed to load outreach snapshot: ${e.message}`);
    }
}
async function atomicWrite(filePath, content) {
    await ensureDir(path.dirname(filePath));
    const tmp = filePath + '.' + Date.now() + '.tmp';
    await fs.writeFile(tmp, content, 'utf8');
    await fs.rename(tmp, filePath);
}
export async function saveOutreachSnapshot(snapshot, filePath = DEFAULT_FILE) {
    const toSave = { ...snapshot, updated_at: new Date().toISOString() };
    await atomicWrite(filePath, JSON.stringify(toSave, null, 2));
}
export function attachOutreachPersistence(data, filePath = DEFAULT_FILE) {
    data.persist = async () => {
        const snapshot = {
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
export async function loadOutreachData(filePath = DEFAULT_FILE, idGen, clock) {
    const snap = await loadOutreachSnapshot(filePath);
    const data = {
        categories: snap.categories,
        contacts: snap.contacts,
        outreachActions: snap.outreach_actions,
        followUps: snap.follow_ups,
        outcomes: snap.outcomes,
        uuid: idGen,
        now: clock,
        persist: async () => {
            const snapshot = {
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
