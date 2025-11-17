// Daily Summary Aggregator — combines Master Plan & Outreach metrics
import { projectProgress } from '../MODULES/masterPlan/masterPlanService';
import { summaryMetrics, openFollowUps } from '../MODULES/outreach/outreachService';
export function buildDailySummary(mp, outreach, date) {
    const projects = mp.projects.map(p => {
        const prog = projectProgress(mp, p.id);
        const overdue_items = mp.planItems.filter(pi => pi.project_id === p.id && pi.due_date && pi.due_date < date && pi.status !== 'Done').length;
        return { project_id: p.id, name: p.name, done: prog.done, total: prog.total, percent: prog.percent, overdue_items };
    });
    const om = summaryMetrics(outreach);
    const overdue_follow_ups = openFollowUps(outreach, date).filter(f => f.due_date < date).length;
    const outreachSummary = { ...om, overdue_follow_ups };
    return { date, projects, outreach: outreachSummary };
}
