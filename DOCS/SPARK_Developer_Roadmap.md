# SPARK Core Developer Roadmap

## Phase 1 – Core Foundation (Immediate)
- [x] Master Plan Service (CRUD, filtering, MDCR template preload)
- [x] Validators Layer (Project, PlanItem)
- [x] Persistence Adapter (JSON-based storage)
- [x] Integration hooks in Master Plan Service for persistence

## Phase 2 – Enhancements
- [ ] Audit Logging System
    - Append change events for every CRUD operation
    - Store logs in separate JSONL file
- [ ] Daily Progress Summary Helper
    - Aggregate progress across all projects
    - Provide metrics for dashboard
- [ ] Unit Test Harness
    - Add `package.json` and minimal test runner
    - Tests for validators, persistence, and service logic

## Phase 3 – Additional Modules
- [ ] Outreach Module
    - Contact management with Purpose → Follow-Up → Outcome flow
    - Integration with Master Plan for follow-up tasks
- [ ] Timeline Module
    - Visualize events across time
    - Export timeline subsets for reports
- [ ] Document Brain
    - Upload, tag, deduplicate documents
    - OCR integration for scanned files
- [ ] Research Brain
    - Continuous memory across modules
    - Detect contradictions and suggest next steps

## Milestones
- **Milestone 1 (Nov 15):** Persistence Adapter + Integration complete
- **Milestone 2 (Nov 17):** Audit Logging + Daily Progress Summary
- **Milestone 3 (Nov 20):** Unit Tests + Outreach Module skeleton
- **Milestone 4 (Nov 25):** Timeline + Document Brain basic features
- **Milestone 5 (Nov 27):** Research Brain + Final MDCR Appeal submission

## Notes
- Roadmap file is source-of-truth for feature progression; update checkboxes as features ship.
- Keep modules framework-agnostic until a UI/host decision is made.
