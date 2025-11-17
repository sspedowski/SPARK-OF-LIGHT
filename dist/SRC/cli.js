// SPARK CLI — minimal demo runner for Master Plan & Outreach
// Usage examples:
//   npm run cli -- mp:list-projects
//   npm run cli -- mp:create-project --name="MDCR Appeal" --description="Buildout" --start=2025-11-13 --end=2025-11-24 --color=#3366ff
//   npm run cli -- mp:preload-mdcr --project=<uuid> --start=2025-11-13
//   npm run cli -- mp:summary --date=2025-11-13
//   npm run cli -- outreach:create-category --name=Media --color=#ff0000 --tags=press,investigative
//   npm run cli -- outreach:open-followups --date=2025-11-13
import { loadMasterPlanData } from './MODULES/masterPlan/masterPlanPersistence.js';
import { loadOutreachData } from './MODULES/outreach/outreachPersistence.js';
import { createProject, preloadMdcrTemplate, filterPlanItems, createPlanItem, updatePlanItem, deletePlanItem, toggleChecklistItem } from './MODULES/masterPlan/masterPlanService.js';
import { createCategory } from './MODULES/outreach/outreachService.js';
import { buildDailySummary } from './CORE/dailySummary.js';
import { createAuditLogger } from './CORE/auditLogger.js';
function idGen() { return crypto.randomUUID(); }
function clock() { return new Date().toISOString(); }
function parseArgs(argv) {
    const [, , cmd, ...rest] = argv;
    const flags = {};
    for (const token of rest) {
        if (token.startsWith('--')) {
            const eq = token.indexOf('=');
            if (eq > 2) {
                const k = token.substring(2, eq);
                const v = token.substring(eq + 1);
                flags[k] = v;
            }
            else {
                const k = token.substring(2);
                flags[k] = 'true';
            }
        }
    }
    return { cmd: cmd || 'help', flags };
}
function usage() {
    console.log(`SPARK CLI commands:
  mp:list-projects
  mp:create-project --name= --description= --start=YYYY-MM-DD --end=YYYY-MM-DD [--color=#hex]
  mp:preload-mdcr --project=<uuid> --start=YYYY-MM-DD
  mp:summary --date=YYYY-MM-DD
  mp:list-items [--project=<uuid>] [--status=NotStarted,InProgress,Done,Dropped] [--category=Research,Drafting,Outreach,Evidence,Admin,Other] [--priority=Low,Normal,High,Critical] [--due_before=YYYY-MM-DD] [--due_after=YYYY-MM-DD]
  mp:create-item --project=<uuid> --title= --description= --category=Research|Drafting|Outreach|Evidence|Admin|Other --priority=Low|Normal|High|Critical [--due=YYYY-MM-DD|null] [--notes=] [--checklist="Label1;Label2;..."]
  mp:update-item --id=<uuid> [--title=] [--description=] [--category=...] [--status=NotStarted|InProgress|Done|Dropped] [--priority=Low|Normal|High|Critical] [--due=YYYY-MM-DD|null] [--notes=] [--replace-checklist="Label1;Label2;..."]
  mp:delete-item --id=<uuid>
  mp:toggle-check --item=<planItemUuid> --check=<checklistUuid> --checked=true|false
  outreach:create-category --name= --color=#hex [--tags=a,b]
  outreach:open-followups --date=YYYY-MM-DD
`);
}
async function main() {
    const { cmd, flags } = parseArgs(process.argv);
    if (cmd === 'help' || cmd === undefined) {
        usage();
        return;
    }
    const audit = createAuditLogger({ filePath: 'DATA/audit.log.jsonl', idGen, clock });
    const mp = await loadMasterPlanData(undefined, idGen, clock);
    mp.audit = audit;
    const outreach = await loadOutreachData(undefined, idGen, clock);
    outreach.audit = audit;
    try {
        switch (cmd) {
            case 'mp:list-projects': {
                console.log(JSON.stringify(mp.projects, null, 2));
                break;
            }
            case 'mp:create-project': {
                const name = flags['name'];
                const description = flags['description'] || '';
                const start = flags['start'];
                const end = flags['end'];
                const color = flags['color'];
                if (!name || !start || !end) {
                    usage();
                    process.exit(1);
                }
                const proj = createProject(mp, { name, description, start_date: start, target_end_date: end, color });
                console.log(JSON.stringify(proj, null, 2));
                break;
            }
            case 'mp:preload-mdcr': {
                const project = flags['project'];
                const start = flags['start'];
                if (!project || !start) {
                    usage();
                    process.exit(1);
                }
                const items = preloadMdcrTemplate(mp, project, start);
                console.log(JSON.stringify({ created: items.length }, null, 2));
                break;
            }
            case 'mp:list-items': {
                const status = flags['status'] ? flags['status'].split(',').filter(Boolean) : undefined;
                const category = flags['category'] ? flags['category'].split(',').filter(Boolean) : undefined;
                const priority = flags['priority'] ? flags['priority'].split(',').filter(Boolean) : undefined;
                const due_before = flags['due_before'];
                const due_after = flags['due_after'];
                const project_id = flags['project'];
                const items = filterPlanItems(mp, { project_id, status: status, category: category, priority: priority, due_before, due_after });
                console.log(JSON.stringify(items, null, 2));
                break;
            }
            case 'mp:create-item': {
                const project_id = flags['project'];
                const title = flags['title'];
                const description = flags['description'] || '';
                const category = flags['category'];
                const priority = flags['priority'];
                const dueRaw = flags['due'];
                const due_date = dueRaw === undefined ? null : (dueRaw === 'null' ? null : dueRaw);
                const notes = flags['notes'] || '';
                const checklist = (flags['checklist'] || '').split(';').filter(s => s.trim().length > 0).map(label => ({ label: label.trim() }));
                if (!project_id || !title || !category || !priority) {
                    usage();
                    process.exit(1);
                }
                const item = createPlanItem(mp, { project_id, title, description, category, due_date, priority, checklist, notes });
                console.log(JSON.stringify(item, null, 2));
                break;
            }
            case 'mp:update-item': {
                const id = flags['id'];
                if (!id) {
                    usage();
                    process.exit(1);
                }
                const changes = {};
                if (flags['title'] !== undefined)
                    changes.title = flags['title'];
                if (flags['description'] !== undefined)
                    changes.description = flags['description'];
                if (flags['category'] !== undefined)
                    changes.category = flags['category'];
                if (flags['status'] !== undefined)
                    changes.status = flags['status'];
                if (flags['priority'] !== undefined)
                    changes.priority = flags['priority'];
                if (flags['due'] !== undefined)
                    changes.due_date = flags['due'] === 'null' ? null : flags['due'];
                if (flags['notes'] !== undefined)
                    changes.notes = flags['notes'];
                if (flags['replace-checklist'] !== undefined) {
                    const labels = flags['replace-checklist'].split(';').filter(s => s.trim().length > 0).map(label => ({ label: label.trim() }));
                    changes.checklist = labels;
                }
                const updated = updatePlanItem(mp, id, changes);
                if (!updated) {
                    console.error('PlanItem not found');
                    process.exit(1);
                }
                console.log(JSON.stringify(updated, null, 2));
                break;
            }
            case 'mp:delete-item': {
                const id = flags['id'];
                if (!id) {
                    usage();
                    process.exit(1);
                }
                const ok = deletePlanItem(mp, id);
                console.log(JSON.stringify({ deleted: ok, id }, null, 2));
                break;
            }
            case 'mp:toggle-check': {
                const itemId = flags['item'];
                const checkId = flags['check'];
                const checkedStr = flags['checked'];
                if (!itemId || !checkId || (checkedStr !== 'true' && checkedStr !== 'false')) {
                    usage();
                    process.exit(1);
                }
                const ok = toggleChecklistItem(mp, itemId, checkId, checkedStr === 'true');
                if (!ok) {
                    console.error('Toggle failed: item or checklist id not found');
                    process.exit(1);
                }
                console.log(JSON.stringify({ toggled: true, item: itemId, check: checkId, value: checkedStr === 'true' }, null, 2));
                break;
            }
            case 'mp:summary': {
                const date = flags['date'];
                if (!date) {
                    usage();
                    process.exit(1);
                }
                const summary = buildDailySummary(mp, outreach, date);
                console.log(JSON.stringify(summary, null, 2));
                break;
            }
            case 'outreach:create-category': {
                const name = flags['name'];
                const color = flags['color'];
                const tags = (flags['tags'] || '').split(',').filter(Boolean);
                if (!name || !color) {
                    usage();
                    process.exit(1);
                }
                const cat = createCategory(outreach, name, color, tags);
                console.log(JSON.stringify(cat, null, 2));
                break;
            }
            case 'outreach:open-followups': {
                const date = flags['date'];
                if (!date) {
                    usage();
                    process.exit(1);
                }
                // Lazy import to keep CLI lean
                const mod = await import('./MODULES/outreach/outreachService.js');
                const open = mod.openFollowUps(outreach, date);
                console.log(JSON.stringify(open, null, 2));
                break;
            }
            default:
                usage();
                process.exit(1);
        }
    }
    catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}
main();
