// src/domain/sparkModels.ts
// SPARK Core Data Model — aligned with SPARK Core Specifications v1.1 (Section 17)

export type UUID = string;
export type ISODateString = string;        // e.g. '2025-11-13'
export type ISODateTimeString = string;    // e.g. '2025-11-13T23:15:00Z'

// ─────────────────────────────────────────────────────────────
// Project & Planning
// ─────────────────────────────────────────────────────────────

export type ProjectStatus = 'Active' | 'OnHold' | 'Completed' | 'Archived';

export interface Project {
   id: UUID;
   name: string;
   description: string;
   status: ProjectStatus;
   start_date: ISODateString;
   target_end_date: ISODateString;
   color: string; // UI token
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

export type PlanItemCategory = 'Research' | 'Drafting' | 'Outreach' | 'Evidence' | 'Admin' | 'Other';
export type PlanItemStatus = 'NotStarted' | 'InProgress' | 'Done' | 'Dropped';
export type PlanItemPriority = 'Low' | 'Normal' | 'High' | 'Critical';

export interface PlanItemChecklistItem {
   id: UUID;
   label: string;
   checked: boolean;
}

export interface PlanItem {
   id: UUID;
   project_id: UUID;
   title: string;
   description: string;
   category: PlanItemCategory;
   status: PlanItemStatus;
   due_date: ISODateString | null;
   priority: PlanItemPriority;
   checklist: PlanItemChecklistItem[];
   notes: string;
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Daily Log
// ─────────────────────────────────────────────────────────────

export interface DailyLog {
   id: UUID;
   date: ISODateString;
   goals_for_today: (string | UUID)[];
   completed_today: (string | UUID)[];
   what_i_learned: (string | UUID)[];
   questions_for_tomorrow: string[];
   emotion_check: string; // or enum if you want to constrain later
   conversation_refs: UUID[]; // Conversation.id[]
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Conversations & Highlights
// ─────────────────────────────────────────────────────────────

export type ConversationSource = 'ChatGPT' | 'Claude' | 'Gemini' | 'Manual' | 'Other';

export interface Conversation {
   id: UUID;
   source: ConversationSource;
   date_imported: ISODateTimeString;
   title: string;
   raw_text_ref: string; // path/id to text blob
   tags: string[];
}

export type ConversationHighlightType =
   | 'Task'
   | 'Insight'
   | 'Rule'
   | 'Decision'
   | 'Definition'
   | 'Precedent'
   | 'Question';

export type ConversationHighlightImportance = 'Low' | 'Normal' | 'High';

export interface ConversationHighlight {
   id: UUID;
   conversation_id: UUID;
   type: ConversationHighlightType;
   text: string;
   linked_project_id: UUID | null;
   linked_plan_item_id: UUID | null;
   linked_rule_id: UUID | null;
   importance: ConversationHighlightImportance;
   created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Documents & Misconduct
// ─────────────────────────────────────────────────────────────

export type DocumentType =
   | 'CPSComplaint'
   | 'PoliceReport'
   | 'MedicalRecord'
   | 'CourtOrder'
   | 'OversightLetter'
   | 'Email'
   | 'Timeline'
   | 'Other';

export type AllegationType =
   | 'PhysicalAbuse'
   | 'SexualAbuse'
   | 'Neglect'
   | 'EvidenceSuppression'
   | 'Retaliation'
   | 'Other';

export type OcrStatus = 'NotRun' | 'Success' | 'Failed';
export type PrimaryRelevance = 'Primary' | 'Supporting' | 'External';

export type DocumentRoute = 'MDCR' | 'DOJ' | 'AG' | 'Media' | 'MasterFile' | 'Other';

export interface Document {
   id: UUID;
   original_filename: string;
   storage_path: string;
   title: string;
   doc_type: DocumentType;
   date_of_event: ISODateString | null;
   date_document_created: ISODateString | null;
   children_involved: string[]; // e.g. ['Jace', 'Josh']
   agencies_involved: string[]; // e.g. ['CPS', 'MSP']
   people_involved: string[];
   allegation_types: AllegationType[];
   summary: string;
   misconduct_flags: UUID[]; // MisconductFlag.id[]
   scanned: boolean;
   ocr_status: OcrStatus;
   primary_relevance: PrimaryRelevance;
   routes: DocumentRoute[];
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

export type MisconductSeverity = 'Low' | 'Medium' | 'High' | 'Extreme';

export interface MisconductFlag {
   id: UUID;
   document_id: UUID;
   law_or_policy: string;
   description: string;
   severity: MisconductSeverity;
   page_ref: string | null;
   paragraph_ref: string | null;
   created_at: ISODateTimeString;
}

export interface DuplicateLink {
   id: UUID;
   primary_document_id: UUID;
   duplicate_document_id: UUID;
   reason: string;
}

// ─────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────

export type TimelineEventType =
   | 'Document'
   | 'Outreach'
   | 'CourtAction'
   | 'AgencyDecision'
   | 'PersonalMilestone'
   | 'Other';

export type TimelineSeverity = 'Informational' | 'Important' | 'Critical';

export interface TimelineEvent {
   id: UUID;
   date: ISODateString;
   title: string;
   description: string;
   event_type: TimelineEventType;
   document_ids: UUID[]; // Document.id[]
   outreach_ids: UUID[]; // OutreachAction.id[]
   children_involved: string[];
   agencies_involved: string[];
   severity: TimelineSeverity;
   created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Outreach & Contacts
// ─────────────────────────────────────────────────────────────

export interface ContactCategory {
   id: UUID;
   name: string;
   color: string; // UI token
   tags: string[];
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

export type PreferredContactMethod = 'Call' | 'Email' | 'Mail' | 'Form' | 'Combo';

export interface Contact {
   id: UUID;
   category_id: UUID;
   organization: string;
   contact_name: string;
   role: string;
   phone: string;
   email: string;
   mailing_address: string;
   website_url: string;
   preferred_method: PreferredContactMethod;
   tags: string[];
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

export type OutreachMethod = 'Call' | 'Email' | 'Mail' | 'Meeting' | 'Other';
export type OutreachOutcomeStatus = 'None' | 'Waiting' | 'Positive' | 'Negative' | 'ReferredElsewhere';

export interface OutreachAction {
   id: UUID;
   contact_id: UUID;
   date: ISODateTimeString;
   method: OutreachMethod;
   summary: string;
   artifacts_sent: UUID[]; // Artifact.id[]
   linked_artifact_version: UUID | null; // ArtifactVersion.id
   outcome_status: OutreachOutcomeStatus;
   next_follow_up_date: ISODateString | null;
   created_at: ISODateTimeString;
}

export type FollowUpStatus = 'Open' | 'Completed' | 'Cancelled';

export interface FollowUpItem {
   id: UUID;
   contact_id: UUID;
   outreach_action_id: UUID | null;
   due_date: ISODateString;
   status: FollowUpStatus;
   notes: string;
   created_at: ISODateTimeString;
}

export type OutcomeFinalStatus = 'NoResponse' | 'Declined' | 'NotFit' | 'CompletedHelp' | 'Other';

export interface OutcomeRecord {
   id: UUID;
   contact_id: UUID;
   final_status: OutcomeFinalStatus;
   date_closed: ISODateString;
   reason: string;
   lesson_learned: string;
   referred_contact_id: UUID | null;
   created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Artifacts & Versioning
// ─────────────────────────────────────────────────────────────

export type ArtifactType = 'AppealLetter' | 'Timeline' | 'SummaryPacket' | 'OnePager' | 'Script' | 'Other';
export type ArtifactStatus = 'Draft' | 'Ready' | 'Production' | 'Archived';

export interface Artifact {
   id: UUID;
   project_id: UUID;
   type: ArtifactType;
   name: string;
   status: ArtifactStatus;
   color_by_status: string; // UI token
   current_file_path: string;
   production_published_date: ISODateTimeString | null;
   previous_production_artifact_id: UUID | null;
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

export interface ArtifactVersion {
   id: UUID;
   artifact_id: UUID;
   version_label: string; // e.g. 'v0.1', 'v1.0'
   status_at_time: ArtifactStatus;
   file_path: string;
   notes: string;
   created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Rule Library & Legal Knowledge
// ─────────────────────────────────────────────────────────────

export type RuleCategory = 'Law' | 'Policy' | 'InternalGuideline' | 'Precedent' | 'Strategy';

export interface Rule {
   id: UUID;
   category: RuleCategory;
   title: string;
   description: string;
   jurisdiction: string;
   citation: string | null;
   tags: string[];
   created_from_conversation_id: UUID | null;
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Deadlines
// ─────────────────────────────────────────────────────────────

export type DeadlineRelatedEntityType = 'Project' | 'PlanItem' | 'Outreach' | 'Document' | 'Artifact' | 'Other';
export type DeadlineSeverity = 'Normal' | 'Important' | 'Critical';
export type DeadlineStatus = 'Open' | 'Completed' | 'Snoozed' | 'Cancelled';

export interface Deadline {
   id: UUID;
   related_entity_type: DeadlineRelatedEntityType;
   related_entity_id: UUID;
   label: string;
   due_date: ISODateString;
   severity: DeadlineSeverity;
   status: DeadlineStatus;
   created_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Experiments
// ─────────────────────────────────────────────────────────────

export type ExperimentResultStatus = 'Unknown' | 'Success' | 'Partial' | 'Fail';

export interface Experiment {
   id: UUID;
   project_id: UUID;
   title: string;
   hypothesis: string;
   action_taken: string | UUID; // or PlanItem/OutreachAction id
   result_status: ExperimentResultStatus;
   result_notes: string;
   follow_up_action: UUID | null; // PlanItem.id
   created_at: ISODateTimeString;
   updated_at: ISODateTimeString;
}

// ─────────────────────────────────────────────────────────────
// Research Brain
// ─────────────────────────────────────────────────────────────

export type ResearchSourceType =
   | 'Conversation'
   | 'Document'
   | 'DailyLog'
   | 'Outreach'
   | 'Rule'
   | 'TimelineEvent'
   | 'Other';

export type ResearchImportance = 'Low' | 'Normal' | 'High' | 'Critical';

export interface ResearchInsight {
   id: UUID;
   source_type: ResearchSourceType;
   source_id: UUID;
   text: string;
   tags: string[];
   importance: ResearchImportance;
   created_at: ISODateTimeString;
}

export type CrossRelationshipType =
   | 'Supports'
   | 'Contradicts'
   | 'Expands'
   | 'Refines'
   | 'RequiresAction';

export interface CrossReference {
   id: UUID;
   insight_id: UUID;
   related_entity_type: 'Document' | 'Rule' | 'Contact' | 'TimelineEvent' | 'Artifact' | 'PlanItem';
   related_entity_id: UUID;
   relationship_type: CrossRelationshipType;
   notes: string;
   created_at: ISODateTimeString;
}

export type ResearchThreadStatus = 'Active' | 'Dormant' | 'Completed';

export interface ResearchThread {
   id: UUID;
   title: string;
   description: string;
   insight_ids: UUID[];
   status: ResearchThreadStatus;
   created_at: ISODateTimeString;
}

export interface MemoryLink {
   id: UUID;
   from_entity_type: string;
   from_entity_id: UUID;
   to_entity_type: string;
   to_entity_id: UUID;
   description: string;
   created_at: ISODateTimeString;
}