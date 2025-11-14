// Audit event types for SPARK Core
// Keep minimal and framework-agnostic.

import { UUID, ISODateTimeString } from '../DOMAIN/sparkModels';

export type AuditEntityType =
  | 'Project'
  | 'PlanItem'
  | 'ContactCategory'
  | 'Contact'
  | 'OutreachAction'
  | 'FollowUpItem'
  | 'OutcomeRecord';

export type AuditChangeType = 'Create' | 'Update' | 'Delete' | 'TemplateLoad' | 'ChecklistToggle';

export interface AuditEvent {
  id: UUID;
  at: ISODateTimeString;
  entity_type: AuditEntityType;
  change_type: AuditChangeType;
  entity_id: UUID;
  project_id?: UUID; // for PlanItem relation
  before?: unknown;
  after?: unknown;
  detail?: string; // optional free-form note
}

export interface AuditLoggerConfig {
  filePath: string; // JSONL file
  clock: () => ISODateTimeString;
  idGen: () => UUID;
}
