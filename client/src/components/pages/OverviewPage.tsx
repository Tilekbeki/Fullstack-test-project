import type { Overview } from '../../models/dashboard.type';

export interface OverviewPageProps { overview: Overview | null }

export function OverviewPage({ overview }: OverviewPageProps) {
  const donePercent = overview?.tasks ? Math.round(overview.done / overview.tasks * 100) : 0;

  return <div className="overview-panel">
    <div className="panel-title"><div><h2>Состояние задач</h2><p>Доля завершённых задач во всём портфеле</p></div></div>
    <div className="progress-track"><div style={{ width: `${donePercent}%` }} /></div>
    <strong>{donePercent}% завершено</strong>
    <p>Перейдите в «Проекты и задачи», чтобы просмотреть или изменить записи.</p>
  </div>;
}
