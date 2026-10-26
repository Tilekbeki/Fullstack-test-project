import { db } from '../db';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  assignee: string;
  estimate: string;
  due_date: string;
  status_code: number;
}
export type TaskInput = Omit<Task, 'id'>;

export const tasks = {
  list(projectId: number) {
    return db.any<Task>('SELECT * FROM tasks WHERE project_id=$1 ORDER BY id', [projectId]);
  },
  create(input: TaskInput) {
    return db.one<Task>(
      'INSERT INTO tasks (project_id, title, assignee, estimate, due_date, status_code) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [input.project_id, input.title, input.assignee, input.estimate, input.due_date, input.status_code]
    );
  },
  update(id: number, input: TaskInput) {
    return db.oneOrNone<Task>(
      'UPDATE tasks SET title=$3, assignee=$4, estimate=$5, due_date=$6, status_code=$7 WHERE id=$1 AND project_id=$2 RETURNING *',
      [id, input.project_id, input.title, input.assignee, input.estimate, input.due_date, input.status_code]
    );
  },
  remove(id: number, projectId: number) {
    return db.oneOrNone<{ id: number }>('DELETE FROM tasks WHERE id=$1 AND project_id=$2 RETURNING id', [id, projectId]);
  },
};
