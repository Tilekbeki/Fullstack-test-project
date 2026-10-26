import type { Overview } from '../models/dashboard.type';
import { DashboardIcon } from './DashboardIcon';
import { money } from '../utils/presentation';

export interface PortfolioStatsProps { overview: Overview | null }

export function PortfolioStats({ overview }: PortfolioStatsProps) {
  return <div className="stats-grid">
    <div className="stat-card"><span className="stat-icon"><DashboardIcon name="projects" /></span><span className="stat-label">Всего проектов</span><strong>{overview?.projects ?? '—'}</strong><small>Активный портфель</small></div>
    <div className="stat-card"><span className="stat-icon"><DashboardIcon name="tasks" /></span><span className="stat-label">Всего задач</span><strong>{overview?.tasks ?? '—'}</strong><small>По всем проектам</small></div>
    <div className="stat-card"><span className="stat-icon"><DashboardIcon name="done" /></span><span className="stat-label">Завершено</span><strong>{overview?.done ?? '—'}</strong><small>Выполненных задач</small></div>
    <div className="stat-card"><span className="stat-icon"><DashboardIcon name="budget" /></span><span className="stat-label">Общий бюджет</span><strong className="budget-value">{overview ? money(overview.budget) : '—'}</strong><small>По всем проектам</small></div>
  </div>;
}
