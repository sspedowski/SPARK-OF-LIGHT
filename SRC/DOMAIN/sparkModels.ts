Build the SPARK core data model file first.

Create a TypeScript file at:
  src/domain/sparkModels.ts

Use SPARK Core Specifications v1.1, Section 17 (Core Data Model) as the ONLY source of truth.

In that file:

1. Define TypeScript types or interfaces for:
   - Project
   - PlanItem
   - DailyLog
   - Conversation
   - ConversationHighlight
   - Document
   - MisconductFlag
   - DuplicateLink
   - TimelineEvent
   - ContactCategory
   - Contact
   - OutreachAction (must include linked_artifact_version)
   - FollowUpItem
   - OutcomeRecord
   - Artifact
   - ArtifactVersion
   - Rule
   - Deadline
   - Experiment
   - ResearchInsight
   - CrossReference
   - ResearchThread
   - MemoryLink

2. Field names and shapes must match the spec EXACTLY.
   - Do NOT add, rename, or remove fields.
   - Use union string types for enums (e.g. 'Draft' | 'Ready' | 'Production' | 'Archived').

3. Export all types so other modules can import them.

Do not create any functions yet. Just the data model types, exactly matching SPARK v1.1.