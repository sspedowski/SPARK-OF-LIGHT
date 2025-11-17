// Audit logger implementation — appends JSON lines to file.
import { promises as fs } from 'fs';
import * as path from 'path';
async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }
export function createAuditLogger(cfg) {
    const dir = path.dirname(cfg.filePath);
    return async function log(event) {
        await ensureDir(dir);
        const full = {
            id: event.id || cfg.idGen(),
            at: event.at || cfg.clock(),
            entity_type: event.entity_type,
            change_type: event.change_type,
            entity_id: event.entity_id,
            project_id: event.project_id,
            before: event.before,
            after: event.after,
            detail: event.detail,
        };
        const line = JSON.stringify(full);
        await fs.appendFile(cfg.filePath, line + '\n', 'utf8');
    };
}
