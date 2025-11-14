# SPARK OF LIGHT — Core

TypeScript-first core for SPARK. Framework-agnostic services, JSON snapshot persistence, and a minimal CLI.

## Quick start

```pwsh
# From repo root
npm install
npm run cli -- mp:list-projects
```

Create a project:

```pwsh
npm run cli -- mp:create-project --name="MDCR Appeal" --description="Appeal buildout" --start=2025-11-13 --end=2025-11-24 --color=#3366ff
```

Preload MDCR template tasks:

```pwsh
npm run cli -- mp:preload-mdcr --project=<project_uuid> --start=2025-11-13
```

Daily summary:

```pwsh
npm run cli -- mp:summary --date=2025-11-13
```

### Plan item commands

```pwsh
# List plan items with optional filters
npm run cli -- mp:list-items --project=<uuid> --status=NotStarted,InProgress --category=Drafting --priority=High --due_before=2025-11-20

# Create a plan item
npm run cli -- mp:create-item --project=<uuid> --title="Draft letter" --description="First pass" --category=Drafting --priority=High --due=2025-11-15 --checklist="Outline;Citations"

# Update a plan item
npm run cli -- mp:update-item --id=<item_uuid> --status=Done --replace-checklist="Outline;Body;Review"

# Delete a plan item
npm run cli -- mp:delete-item --id=<item_uuid>

# Toggle a checklist item
npm run cli -- mp:toggle-check --item=<item_uuid> --check=<check_uuid> --checked=true
```

## Data locations

- Master Plan snapshot: `DATA/masterPlan.snapshot.json`
- Outreach snapshot: `DATA/outreach.snapshot.json`
- Audit log (JSONL): `DATA/audit.log.jsonl`

## Tests

Run the lightweight test harness:

```pwsh
npm test
```

## Conventions

- Domain model: `SRC/DOMAIN/sparkModels.ts`
- Keep IDs as UUID strings; relationships reference by ID only
- Dates use ISO date strings (`YYYY-MM-DD`), timestamps use `YYYY-MM-DDTHH:mm:ssZ`
