// Outreach Service — CRUD & workflow helpers for contacts, outreach actions, follow-ups, outcomes
// Framework-agnostic. Optional persistence hook like MasterPlanData.
import { validateContactCategory, validateContact, validateOutreachAction, validateFollowUpItem, validateOutcomeRecord, } from './outreachValidators';
export function createEmptyOutreachData(idGen, clock) {
    return { categories: [], contacts: [], outreachActions: [], followUps: [], outcomes: [], uuid: idGen, now: clock };
}
// ─────────────────────────────────────────────────────────────
// Category CRUD
// ─────────────────────────────────────────────────────────────
export function createCategory(data, name, color, tags = []) {
    const category = {
        id: data.uuid(),
        name: name.trim(),
        color: color.trim(),
        tags: tags.map(t => t.trim()),
        created_at: data.now(),
        updated_at: data.now(),
    };
    data.categories.push(validateContactCategory(category));
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'ContactCategory', change_type: 'Create', entity_id: category.id, after: category });
    return category;
}
export function updateCategory(data, id, changes) {
    const cat = data.categories.find(c => c.id === id);
    if (!cat)
        return null;
    if (changes.name !== undefined)
        cat.name = changes.name.trim();
    if (changes.color !== undefined)
        cat.color = changes.color.trim();
    if (changes.tags !== undefined && Array.isArray(changes.tags))
        cat.tags = changes.tags.map(t => t.trim());
    cat.updated_at = data.now();
    validateContactCategory(cat); // throws if invalid
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'ContactCategory', change_type: 'Update', entity_id: cat.id, after: cat });
    return cat;
}
export function deleteCategory(data, id) {
    const idx = data.categories.findIndex(c => c.id === id);
    if (idx === -1)
        return false;
    // Remove category only if no contacts linked (simple rule to prevent orphaned contacts)
    if (data.contacts.some(ct => ct.category_id === id))
        throw new Error('Cannot delete category with existing contacts');
    data.categories.splice(idx, 1);
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'ContactCategory', change_type: 'Delete', entity_id: id });
    return true;
}
export function createContact(data, input) {
    if (!data.categories.some(c => c.id === input.category_id))
        throw new Error('Category not found');
    const contact = {
        id: data.uuid(),
        category_id: input.category_id,
        organization: input.organization.trim(),
        contact_name: input.contact_name.trim(),
        role: input.role.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        mailing_address: input.mailing_address.trim(),
        website_url: input.website_url.trim(),
        preferred_method: input.preferred_method,
        tags: (input.tags || []).map(t => t.trim()),
        created_at: data.now(),
        updated_at: data.now(),
    };
    data.contacts.push(validateContact(contact));
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'Contact', change_type: 'Create', entity_id: contact.id, after: contact });
    return contact;
}
export function updateContact(data, id, changes) {
    const ct = data.contacts.find(c => c.id === id);
    if (!ct)
        return null;
    if (changes.organization !== undefined)
        ct.organization = changes.organization.trim();
    if (changes.contact_name !== undefined)
        ct.contact_name = changes.contact_name.trim();
    if (changes.role !== undefined)
        ct.role = changes.role.trim();
    if (changes.phone !== undefined)
        ct.phone = changes.phone.trim();
    if (changes.email !== undefined)
        ct.email = changes.email.trim();
    if (changes.mailing_address !== undefined)
        ct.mailing_address = changes.mailing_address.trim();
    if (changes.website_url !== undefined)
        ct.website_url = changes.website_url.trim();
    if (changes.preferred_method !== undefined)
        ct.preferred_method = changes.preferred_method;
    if (changes.tags !== undefined && Array.isArray(changes.tags))
        ct.tags = changes.tags.map(t => t.trim());
    // future optional field 'notes' intentionally omitted until added to Contact model
    ct.updated_at = data.now();
    validateContact(ct);
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'Contact', change_type: 'Update', entity_id: ct.id, after: ct });
    return ct;
}
export function deleteContact(data, id) {
    const idx = data.contacts.findIndex(c => c.id === id);
    if (idx === -1)
        return false;
    // Prevent deletion if follow-ups or outcomes reference it (simple integrity rule)
    if (data.followUps.some(f => f.contact_id === id) || data.outcomes.some(o => o.contact_id === id))
        throw new Error('Cannot delete contact referenced by follow-ups or outcomes');
    data.outreachActions = data.outreachActions.filter(a => a.contact_id !== id);
    data.contacts.splice(idx, 1);
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'Contact', change_type: 'Delete', entity_id: id });
    return true;
}
export function recordOutreachAction(data, input) {
    if (!data.contacts.some(c => c.id === input.contact_id))
        throw new Error('Contact not found');
    const action = {
        id: data.uuid(),
        contact_id: input.contact_id,
        date: data.now(),
        method: input.method,
        summary: input.summary.trim(),
        artifacts_sent: (input.artifacts_sent || []).slice(),
        linked_artifact_version: input.linked_artifact_version ?? null,
        outcome_status: input.outcome_status ?? 'None',
        next_follow_up_date: input.next_follow_up_date ?? null,
        created_at: data.now(),
    };
    data.outreachActions.push(validateOutreachAction(action));
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'OutreachAction', change_type: 'Create', entity_id: action.id, after: action });
    return action;
}
export function updateOutreachAction(data, id, changes) {
    const act = data.outreachActions.find(a => a.id === id);
    if (!act)
        return null;
    if (changes.method !== undefined)
        act.method = changes.method;
    if (changes.summary !== undefined)
        act.summary = changes.summary.trim();
    if (changes.artifacts_sent !== undefined && Array.isArray(changes.artifacts_sent))
        act.artifacts_sent = changes.artifacts_sent;
    if (changes.linked_artifact_version !== undefined)
        act.linked_artifact_version = changes.linked_artifact_version;
    if (changes.outcome_status !== undefined)
        act.outcome_status = changes.outcome_status;
    if (changes.next_follow_up_date !== undefined)
        act.next_follow_up_date = changes.next_follow_up_date;
    validateOutreachAction(act);
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'OutreachAction', change_type: 'Update', entity_id: act.id, after: act });
    return act;
}
// ─────────────────────────────────────────────────────────────
// Follow Ups
// ─────────────────────────────────────────────────────────────
export function createFollowUp(data, contact_id, outreach_action_id, due_date, notes) {
    if (!data.contacts.some(c => c.id === contact_id))
        throw new Error('Contact not found');
    if (outreach_action_id && !data.outreachActions.some(a => a.id === outreach_action_id))
        throw new Error('Outreach action not found');
    const fu = {
        id: data.uuid(),
        contact_id,
        outreach_action_id,
        due_date,
        status: 'Open',
        notes: notes.trim(),
        created_at: data.now(),
    };
    data.followUps.push(validateFollowUpItem(fu));
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'FollowUpItem', change_type: 'Create', entity_id: fu.id, after: fu });
    return fu;
}
export function updateFollowUpStatus(data, id, status) {
    const fu = data.followUps.find(f => f.id === id);
    if (!fu)
        return null;
    fu.status = status;
    validateFollowUpItem(fu);
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'FollowUpItem', change_type: 'Update', entity_id: fu.id, after: fu });
    return fu;
}
export function recordOutcome(data, input) {
    if (!data.contacts.some(c => c.id === input.contact_id))
        throw new Error('Contact not found');
    if (input.referred_contact_id && !data.contacts.some(c => c.id === input.referred_contact_id))
        throw new Error('Referred contact not found');
    const outcome = {
        id: data.uuid(),
        contact_id: input.contact_id,
        final_status: input.final_status,
        date_closed: input.date_closed,
        reason: input.reason.trim(),
        lesson_learned: input.lesson_learned.trim(),
        referred_contact_id: input.referred_contact_id ?? null,
        created_at: data.now(),
    };
    data.outcomes.push(validateOutcomeRecord(outcome));
    if (data.persist)
        void data.persist();
    if (data.audit)
        void data.audit({ entity_type: 'OutcomeRecord', change_type: 'Create', entity_id: outcome.id, after: outcome });
    return outcome;
}
// ─────────────────────────────────────────────────────────────
// Query Helpers & Metrics
// ─────────────────────────────────────────────────────────────
export function listContactsByCategory(data, category_id) {
    return data.contacts.filter(c => c.category_id === category_id);
}
export function openFollowUps(data, asOf) {
    return data.followUps.filter(f => f.status === 'Open' && f.due_date <= asOf);
}
export function contactOutreachHistory(data, contact_id) {
    return data.outreachActions.filter(a => a.contact_id === contact_id).sort((a, b) => a.date.localeCompare(b.date));
}
export function outstandingWaitingResponses(data) {
    return data.outreachActions.filter(a => a.outcome_status === 'Waiting');
}
export function summaryMetrics(data) {
    return {
        contacts: data.contacts.length,
        open_follow_ups: data.followUps.filter(f => f.status === 'Open').length,
        waiting_outreach: data.outreachActions.filter(a => a.outcome_status === 'Waiting').length,
        outcomes_recorded: data.outcomes.length,
    };
}
// Future extensions:
// - Link with MasterPlan to auto-create PlanItems for follow-ups
// - Add audit hooks similar to MasterPlan
// - Add persistence adapter (snapshot) parallel to masterPlanPersistence
