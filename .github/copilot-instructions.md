# SPARK-OF-LIGHT — Copilot Instructions

Concise guidance for AI coding agents working in this repository. Focus on patterns that already exist here.

## Big picture
- This repo currently contains the SPARK core domain model in TypeScript (`SRC/DOMAIN/sparkModels.ts`) and a module spec doc (`DOCS/SPARK.MODULE. MASTER.PLAN.md`).
- There are no build scripts, tests, or runtime services yet; generate code that is TypeScript-first and imports these domain types without assuming a framework.

## Architecture and data patterns
- Single source of truth for data shapes: `sparkModels.ts` defines entities like `Project`, `PlanItem`, `Document`, `Contact`, `OutreachAction`, `Artifact`, `TimelineEvent`, `Rule`, `Experiment`, and research-related types.
- IDs are simple `UUID` strings; relationships are by foreign-key fields (e.g., `project_id`, `document_ids`, `conversation_id`). Do not embed child objects; reference by ID.
- Dates vs datetimes:
  - Use `ISODateString` for calendar days (e.g., `2025-11-13`).
  - Use `ISODateTimeString` for timestamps (e.g., `2025-11-13T23:15:00Z`).
- Status and category fields are union string types (e.g., `PlanItemStatus`, `ArtifactStatus`, `ConversationHighlightType`). When adding logic, prefer exhaustive `switch` over free-form strings.
- Property naming uses snake_case for many fields (e.g., `start_date`, `updated_at`). Preserve existing casing to avoid inconsistency.

## Module: Master Plan (from DOCS)
- Purpose: manage multi-day projects/tasks (starting with MDCR Appeal) with checklist, status, due_date, and progress bar.
- Behaviors emphasize CRUD for projects and plan items, auto-logging changes, filtering by status/category/priority, and an 11-day MDCR template.
- Align implementation of any services/UI stubs with `Project` and `PlanItem` types from `sparkModels.ts`.

## Conventions to follow here
- Keep domain types under `SRC/DOMAIN/`; place new pure functions (formatters, validators, mappers) nearby unless a new folder is introduced explicitly.
- Prefer small, typed utilities over frameworks (no external deps found). If you must add deps, propose them first in a README update.
- Use arrays of strings for tags and checklist items as defined in models; do not invent new shapes.
- Record timestamps consistently: newly created records should include `created_at` and `updated_at` in `ISODateTimeString`.

## Example usage
```ts
// Import domain types
import { PlanItem, PlanItemStatus, PlanItemPriority, UUID, ISODateString } from "../SRC/DOMAIN/sparkModels";

// Create a new PlanItem following repo conventions
const newPlanItem: PlanItem = {
  id: "uuid-123" as UUID,
  project_id: "uuid-project" as UUID,
  title: "Draft MDCR appeal letter",
  description: "First pass with key citations",
  category: "Drafting",
  status: "InProgress" as PlanItemStatus,
  due_date: "2025-11-20" as ISODateString,
  priority: "High" as PlanItemPriority,
  checklist: [{ id: "uuid-ck1", label: "Outline sections", checked: false }],
  notes: "Use latest Rule library entries",
  created_at: "2025-11-13T12:00:00Z",
  updated_at: "2025-11-13T12:00:00Z",
};
```

## Gotchas
- Casing: paths are capitalized (`SRC/DOMAIN`, `DOCS`). Keep imports consistent with actual on-disk casing.
- Keep relationships by ID only; do not denormalize unless you also update all affected reference fields.
- Respect enum unions exactly; avoid introducing new literal values without updating the type.

If anything above is unclear or missing, ask for confirmation and propose a minimal addition (e.g., add `package.json` or a validation helper) before proceeding.
