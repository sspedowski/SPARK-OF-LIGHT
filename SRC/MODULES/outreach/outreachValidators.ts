// Outreach Validators — runtime checks for ContactCategory, Contact, OutreachAction, FollowUpItem, OutcomeRecord
// No external deps. Align strictly with sparkModels.ts

import {
  ContactCategory,
  Contact,
  OutreachAction,
  FollowUpItem,
  OutcomeRecord,
  PreferredContactMethod,
  OutreachMethod,
  OutreachOutcomeStatus,
  FollowUpStatus,
  OutcomeFinalStatus,
  UUID,
  ISODateString,
  ISODateTimeString,
} from '../../DOMAIN/sparkModels';

function isObj(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v); }
function isUUID(v: unknown): v is UUID { return typeof v === 'string' && v.length > 0; }
function isISODate(v: unknown): v is ISODateString { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }
function isISODateTime(v: unknown): v is ISODateTimeString { return typeof v === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v); }
function enumIncludes<T extends string>(arr: readonly T[], v: unknown): v is T { return typeof v === 'string' && arr.includes(v as T); }

const PREFERRED_METHOD: PreferredContactMethod[] = ['Call','Email','Mail','Form','Combo'];
const OUTREACH_METHOD: OutreachMethod[] = ['Call','Email','Mail','Meeting','Other'];
const OUTREACH_OUTCOME: OutreachOutcomeStatus[] = ['None','Waiting','Positive','Negative','ReferredElsewhere'];
const FOLLOW_UP_STATUS: FollowUpStatus[] = ['Open','Completed','Cancelled'];
const OUTCOME_FINAL: OutcomeFinalStatus[] = ['NoResponse','Declined','NotFit','CompletedHelp','Other'];

function fail(field: string, msg: string): never { throw new Error(`${field}: ${msg}`); }

export function validateContactCategory(input: unknown): ContactCategory {
  if (!isObj(input)) fail('ContactCategory', 'must be object');
  const { id, name, color, tags, created_at, updated_at } = input;
  if (!isUUID(id)) fail('id','invalid UUID');
  if (typeof name !== 'string' || !name.trim()) fail('name','non-empty string');
  if (typeof color !== 'string' || !color.trim()) fail('color','non-empty string');
  if (!Array.isArray(tags) || tags.some(t => typeof t !== 'string')) fail('tags','string[]');
  if (!isISODateTime(created_at)) fail('created_at','ISO datetime');
  if (!isISODateTime(updated_at)) fail('updated_at','ISO datetime');
  return { id, name: (name as string).trim(), color: (color as string).trim(), tags: tags as string[], created_at, updated_at };
}

export function validateContact(input: unknown): Contact {
  if (!isObj(input)) fail('Contact','must be object');
  const { id, category_id, organization, contact_name, role, phone, email, mailing_address, website_url, preferred_method, tags, created_at, updated_at } = input;
  if (!isUUID(id)) fail('id','invalid UUID');
  if (!isUUID(category_id)) fail('category_id','invalid UUID');
  if (typeof organization !== 'string') fail('organization','string');
  if (typeof contact_name !== 'string') fail('contact_name','string');
  if (typeof role !== 'string') fail('role','string');
  if (typeof phone !== 'string') fail('phone','string');
  if (typeof email !== 'string') fail('email','string');
  if (typeof mailing_address !== 'string') fail('mailing_address','string');
  if (typeof website_url !== 'string') fail('website_url','string');
  if (!enumIncludes(PREFERRED_METHOD, preferred_method)) fail('preferred_method',`one of ${PREFERRED_METHOD.join(',')}`);
  if (!Array.isArray(tags) || tags.some(t => typeof t !== 'string')) fail('tags','string[]');
  if (!isISODateTime(created_at)) fail('created_at','ISO datetime');
  if (!isISODateTime(updated_at)) fail('updated_at','ISO datetime');
  return { id, category_id, organization, contact_name, role, phone, email, mailing_address, website_url, preferred_method: preferred_method as PreferredContactMethod, tags: tags as string[], created_at, updated_at };
}

export function validateOutreachAction(input: unknown): OutreachAction {
  if (!isObj(input)) fail('OutreachAction','must be object');
  const { id, contact_id, date, method, summary, artifacts_sent, linked_artifact_version, outcome_status, next_follow_up_date, created_at } = input;
  if (!isUUID(id)) fail('id','invalid UUID');
  if (!isUUID(contact_id)) fail('contact_id','invalid UUID');
  if (!isISODateTime(date)) fail('date','ISO datetime');
  if (!enumIncludes(OUTREACH_METHOD, method)) fail('method',`one of ${OUTREACH_METHOD.join(',')}`);
  if (typeof summary !== 'string') fail('summary','string');
  if (!Array.isArray(artifacts_sent) || artifacts_sent.some(a => !isUUID(a))) fail('artifacts_sent','UUID[]');
  if (!(linked_artifact_version === null || isUUID(linked_artifact_version))) fail('linked_artifact_version','UUID or null');
  if (!enumIncludes(OUTREACH_OUTCOME, outcome_status)) fail('outcome_status',`one of ${OUTREACH_OUTCOME.join(',')}`);
  if (!(next_follow_up_date === null || isISODate(next_follow_up_date))) fail('next_follow_up_date','ISO date or null');
  if (!isISODateTime(created_at)) fail('created_at','ISO datetime');
  return { id, contact_id, date, method: method as OutreachMethod, summary, artifacts_sent: artifacts_sent as UUID[], linked_artifact_version: linked_artifact_version as UUID | null, outcome_status: outcome_status as OutreachOutcomeStatus, next_follow_up_date: next_follow_up_date as ISODateString | null, created_at };
}

export function validateFollowUpItem(input: unknown): FollowUpItem {
  if (!isObj(input)) fail('FollowUpItem','must be object');
  const { id, contact_id, outreach_action_id, due_date, status, notes, created_at } = input;
  if (!isUUID(id)) fail('id','invalid UUID');
  if (!isUUID(contact_id)) fail('contact_id','invalid UUID');
  if (!(outreach_action_id === null || isUUID(outreach_action_id))) fail('outreach_action_id','UUID or null');
  if (!isISODate(due_date)) fail('due_date','ISO date');
  if (!enumIncludes(FOLLOW_UP_STATUS, status)) fail('status',`one of ${FOLLOW_UP_STATUS.join(',')}`);
  if (typeof notes !== 'string') fail('notes','string');
  if (!isISODateTime(created_at)) fail('created_at','ISO datetime');
  return { id, contact_id, outreach_action_id: outreach_action_id as UUID | null, due_date, status: status as FollowUpStatus, notes, created_at };
}

export function validateOutcomeRecord(input: unknown): OutcomeRecord {
  if (!isObj(input)) fail('OutcomeRecord','must be object');
  const { id, contact_id, final_status, date_closed, reason, lesson_learned, referred_contact_id, created_at } = input;
  if (!isUUID(id)) fail('id','invalid UUID');
  if (!isUUID(contact_id)) fail('contact_id','invalid UUID');
  if (!enumIncludes(OUTCOME_FINAL, final_status)) fail('final_status',`one of ${OUTCOME_FINAL.join(',')}`);
  if (!isISODate(date_closed)) fail('date_closed','ISO date');
  if (typeof reason !== 'string') fail('reason','string');
  if (typeof lesson_learned !== 'string') fail('lesson_learned','string');
  if (!(referred_contact_id === null || isUUID(referred_contact_id))) fail('referred_contact_id','UUID or null');
  if (!isISODateTime(created_at)) fail('created_at','ISO datetime');
  return { id, contact_id, final_status: final_status as OutcomeFinalStatus, date_closed, reason, lesson_learned, referred_contact_id: referred_contact_id as UUID | null, created_at };
}
