# SPARK Module: Master Plan
# Purpose: Manage multi-day projects and tasks (starting with MDCR Appeal).
# Fields:
# - id (UUID)
# - title (String)
# - project_category (Enum: MDCR_APPEAL, FEDERAL_1983, RESEARCH, SPARK_DEV)
# - status (Enum: NOT_STARTED, IN_PROGRESS, DONE, DROPPED)
# - due_date (Date)
# - checklist (Array<String>)
# - is_critical (Boolean)
# Behaviors:
# - Create/edit/delete projects and plan items
# - Auto-log changes with timestamps and reasons
# - Filter by status, category, priority
# - Include template for 11-Day MDCR Appeal Plan
# Acceptance Criteria:
# - Must allow adding tasks with checklist and notes
# - Must display progress bar (X/Y tasks completed)