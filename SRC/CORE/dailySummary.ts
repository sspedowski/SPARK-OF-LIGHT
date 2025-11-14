// Daily Summary Aggregator — combines Master Plan & Outreach metrics
import { MasterPlanData, projectProgress } from '../MODULES/masterPlan/masterPlanService';
import { OutreachData, summaryMetrics, openFollowUps } from '../MODULES/outreach/outreachService';
import { ISODateString } from '../DOMAIN/sparkModels';

export interface ProjectProgressSummary {
  project_id: string;
  name: string;
  done: number;
  total: number;
  percent: number;
  overdue_items: number;
}

export interface OutreachSummary {
  contacts: number;
  open_follow_ups: number;
  waiting_outreach: number;
  outcomes_recorded: number;
  overdue_follow_ups: number;
}

export interface DailySummary {
  date: ISODateString;
  projects: ProjectProgressSummary[];
  outreach: OutreachSummary;
}

export function buildDailySummary(mp: MasterPlanData, outreach: OutreachData, date: ISODateString): DailySummary {
  const projects = mp.projects.map(p => {
    const prog = projectProgress(mp, p.id);
    const overdue_items = mp.planItems.filter(pi => pi.project_id === p.id && pi.due_date && pi.due_date < date && pi.status !== 'Done').length;
    return { project_id: p.id, name: p.name, done: prog.done, total: prog.total, percent: prog.percent, overdue_items };
  });

  const om = summaryMetrics(outreach);
  const overdue_follow_ups = openFollowUps(outreach, date).filter(f => f.due_date < date).length;
  const outreachSummary: OutreachSummary = { ...om, overdue_follow_ups };

  return { date, projects, outreach: outreachSummary };
}
