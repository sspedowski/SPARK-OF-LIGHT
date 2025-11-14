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
import { createProject, preloadMdcrTemplate } from './MODULES/masterPlan/masterPlanService.js';
import { createCategory } from './MODULES/outreach/outreachService.js';
import { buildDailySummary } from './CORE/dailySummary.js';
import { createAuditLogger } from './CORE/auditLogger.js';

function idGen() { return crypto.randomUUID(); }
function clock() { return new Date().toISOString(); }

function parseArgs(argv: string[]): { cmd: string; flags: Record<string,string> } {
  const [,,cmd, ...rest] = argv;
  const flags: Record<string,string> = {};
  for (const token of rest) {
    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      if (eq > 2) {
        const k = token.substring(2, eq);
        const v = token.substring(eq + 1);
        flags[k] = v;
      } else {
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
  outreach:create-category --name= --color=#hex [--tags=a,b]
  outreach:open-followups --date=YYYY-MM-DD
`);
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv);
  if (cmd === 'help' || cmd === undefined) { usage(); return; }

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
        if (!name || !start || !end) { usage(); process.exit(1); }
        const proj = createProject(mp, { name, description, start_date: start, target_end_date: end, color });
        console.log(JSON.stringify(proj, null, 2));
        break;
      }
      case 'mp:preload-mdcr': {
        const project = flags['project'];
        const start = flags['start'];
        if (!project || !start) { usage(); process.exit(1); }
        const items = preloadMdcrTemplate(mp, project, start);
        console.log(JSON.stringify({ created: items.length }, null, 2));
        break;
      }
      case 'mp:summary': {
        const date = flags['date'];
        if (!date) { usage(); process.exit(1); }
        const summary = buildDailySummary(mp, outreach, date);
        console.log(JSON.stringify(summary, null, 2));
        break;
      }
      case 'outreach:create-category': {
        const name = flags['name'];
        const color = flags['color'];
        const tags = (flags['tags'] || '').split(',').filter(Boolean);
        if (!name || !color) { usage(); process.exit(1); }
        const cat = createCategory(outreach, name, color, tags);
        console.log(JSON.stringify(cat, null, 2));
        break;
      }
      case 'outreach:open-followups': {
        const date = flags['date'];
        if (!date) { usage(); process.exit(1); }
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
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }
}

main();
