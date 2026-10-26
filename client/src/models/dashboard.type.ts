export interface Project {
  id: number;
  name: string;
  owner: string;
  owner_id: number;
  budget: string;
  start_date: string;
  priority: number;
}
export type ProjectInput = Pick<
  Project,
  'name' | 'budget' | 'start_date' | 'priority' | 'owner_id'
>;
export interface Responsible {
  id: number;
  name: string;
}
export interface Task {
  id: number;
  project_id: number;
  title: string;
  assignee: string;
  estimate: string;
  due_date: string;
  status_code: number;
}
export type TaskInput = Omit<Task, 'id' | 'project_id'>;
export interface Overview {
  projects: number;
  tasks: number;
  budget: number;
  done: number;
}
export type DashboardSection = 'overview' | 'projects' | 'responsibles';

export interface ProjectQuery {
  search: string;
  owner?: string;
  priority?: string;
  budgetMin?: string;
  budgetMax?: string;
  startFrom?: string;
  startTo?: string;
}

export type FilterKey = Exclude<keyof ProjectQuery, 'search'>;
