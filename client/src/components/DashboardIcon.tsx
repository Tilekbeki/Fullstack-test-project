export interface DashboardIconProps { name: 'projects' | 'overview' | 'responsibles' | 'tasks' | 'done' | 'budget' }

export function DashboardIcon({ name }: DashboardIconProps) {
  const paths = {
    projects: <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 9h18M9 9v11" /></>,
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    responsibles: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2H3.5Zm13-14a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5" /></>,
    tasks: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2" /></>,
    done: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    budget: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 9h18M7 15h4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

