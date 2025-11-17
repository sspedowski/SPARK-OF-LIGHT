import { openFollowUps } from '../MODULES/outreach/outreachService.js';
import { loadMasterPlanData } from '../MODULES/masterPlan/masterPlanPersistence.js';
import { loadOutreachData } from '../MODULES/outreach/outreachPersistence.js';
import { createAuditLogger } from '../CORE/auditLogger.js';
import { buildDailySummary } from '../CORE/dailySummary.js';
export class SparkCore {
    idGen;
    clock;
    cfg;
    masterPlan;
    outreach;
    audit;
    flaggedOverduePlanItems = new Set();
    flaggedOverdueFollowUps = new Set();
    constructor(idGen, clock, cfg = {}) {
        this.idGen = idGen;
        this.clock = clock;
        this.cfg = cfg;
    }
    async init() {
        const auditLogPath = this.cfg.auditLogPath || 'DATA/audit.log.jsonl';
        this.audit = createAuditLogger({ filePath: auditLogPath, idGen: this.idGen, clock: this.clock });
        this.masterPlan = await loadMasterPlanData(this.cfg.masterPlanPath, this.idGen, this.clock);
        this.outreach = await loadOutreachData(this.cfg.outreachPath, this.idGen, this.clock);
        // Attach audit to data objects so existing services emit events
        this.masterPlan.audit = this.audit;
        this.outreach.audit = this.audit;
    }
    // Perform one runtime tick. currentDateIso should be an ISO date string (YYYY-MM-DD) extracted from clock.
    tick(currentDateIso) {
        const summary = buildDailySummary(this.masterPlan, this.outreach, currentDateIso);
        // Detect newly overdue plan items
        for (const pi of this.masterPlan.planItems) {
            if (pi.due_date && pi.due_date < currentDateIso && pi.status !== 'Done') {
                if (!this.flaggedOverduePlanItems.has(pi.id)) {
                    this.flaggedOverduePlanItems.add(pi.id);
                    void this.audit({ entity_type: 'PlanItem', change_type: 'Update', entity_id: pi.id, project_id: pi.project_id, after: pi, detail: 'Overdue detected (first tick flag)' });
                }
            }
        }
        // Detect newly overdue follow ups
        const open = openFollowUps(this.outreach, currentDateIso).filter(f => f.due_date < currentDateIso);
        for (const fu of open) {
            if (!this.flaggedOverdueFollowUps.has(fu.id)) {
                this.flaggedOverdueFollowUps.add(fu.id);
                void this.audit({ entity_type: 'FollowUpItem', change_type: 'Update', entity_id: fu.id, after: fu, detail: 'Follow-up overdue detected (first tick flag)' });
            }
        }
        return summary;
    }
    async shutdown() {
        if (this.masterPlan.persist)
            await this.masterPlan.persist();
        if (this.outreach.persist)
            await this.outreach.persist();
    }
}
