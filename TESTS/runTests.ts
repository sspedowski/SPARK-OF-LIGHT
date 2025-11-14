// Simple test harness (no Jest) using Node assertions
import assert from 'assert';
import { createEmptyData, createProject, createPlanItem, projectProgress, toggleChecklistItem, filterPlanItems, updatePlanItem, deletePlanItem } from '../SRC/MODULES/masterPlan/masterPlanService.ts';
import { createEmptyOutreachData, createCategory, createContact, recordOutreachAction, summaryMetrics } from '../SRC/MODULES/outreach/outreachService.ts';
import { buildDailySummary } from '../SRC/CORE/dailySummary.ts';

function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

function testMasterPlanBasics() {
  const data = createEmptyData(uuid, now);
  const proj = createProject(data, { name: 'Test', description: 'Desc', start_date: '2025-11-13', target_end_date: '2025-11-20' });
  assert.ok(proj.id, 'Project should have id');
  const item = createPlanItem(data, { project_id: proj.id, title: 'Task', description: 'Do', category: 'Drafting', due_date: '2025-11-14', priority: 'Normal', checklist: [{ label: 'Step A' }] });
  assert.equal(data.planItems.length, 1, 'PlanItem stored');
  toggleChecklistItem(data, item.id, item.checklist[0].id, true);
  assert.equal(data.planItems[0].checklist[0].checked, true, 'Checklist toggled');
  const prog = projectProgress(data, proj.id);
  assert.equal(prog.total, 1);

  // Filtering
  const filtered = filterPlanItems(data, { project_id: proj.id, category: ['Drafting'] });
  assert.equal(filtered.length, 1, 'Filter by category returns item');

  // Update & Delete
  const updated = updatePlanItem(data, item.id, { status: 'Done' });
  assert.ok(updated && updated.status === 'Done', 'PlanItem updated to Done');
  const del = deletePlanItem(data, item.id);
  assert.ok(del, 'PlanItem deleted');
  assert.equal(data.planItems.length, 0, 'PlanItem array empty after delete');
}

function testOutreachBasics() {
  const data = createEmptyOutreachData(uuid, now);
  const cat = createCategory(data, 'Media', '#ff0000');
  const contact = createContact(data, { category_id: cat.id, organization: 'Org', contact_name: 'Alice', role: 'Reporter', phone: '000', email: 'a@b.com', mailing_address: 'Street', website_url: 'http://x', preferred_method: 'Email' });
  const action = recordOutreachAction(data, { contact_id: contact.id, method: 'Email', summary: 'Intro email' });
  assert.equal(data.outreachActions.length, 1);
  const metrics = summaryMetrics(data);
  assert.equal(metrics.contacts, 1);
}

function testDailySummary() {
  const mp = createEmptyData(uuid, now);
  const proj = createProject(mp, { name: 'Daily', description: 'D', start_date: '2025-11-13', target_end_date: '2025-11-15' });
  createPlanItem(mp, { project_id: proj.id, title: 'A', description: 'A', category: 'Drafting', due_date: '2025-11-13', priority: 'Low', checklist: [] });
  const outreach = createEmptyOutreachData(uuid, now);
  const cat = createCategory(outreach, 'Advocates', '#22aa22');
  createContact(outreach, { category_id: cat.id, organization: 'Group', contact_name: 'Bob', role: 'Advocate', phone: '111', email: 'b@c.com', mailing_address: 'Lane', website_url: 'http://y', preferred_method: 'Call' });
  const summary = buildDailySummary(mp, outreach, '2025-11-13');
  assert.equal(summary.projects.length, 1);
  assert.equal(summary.outreach.contacts, 1);
}

function run() {
  const tests = [
    ['MasterPlan basics', testMasterPlanBasics],
    ['Outreach basics', testOutreachBasics],
    ['Daily summary', testDailySummary],
  ];
  let passed = 0;
  for (const [name, fn] of tests) {
    try { fn(); console.log('PASS', name); passed++; } catch (e) { console.error('FAIL', name, e); }
  }
  console.log(`${passed}/${tests.length} tests passed`);
  if (passed !== tests.length) process.exit(1);
}

run();
