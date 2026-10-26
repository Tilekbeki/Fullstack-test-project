import type { Request, Response } from 'express';
import { tasks, type TaskInput } from '../models/tasks';
import { projects } from '../models/projects';
import { HttpError, decimal, isoDate, positiveInt, rangeInt, record, text } from '../lib/http';

function parseTask(body: Record<string, unknown>, projectId: number): TaskInput {
  return {
    project_id: projectId,
    title: text(body.title, 'Название', 160),
    assignee: text(body.assignee, 'Исполнитель', 100),
    estimate: decimal(body.estimate, 'Оценка', 7, 1),
    due_date: isoDate(body.due_date, 'Срок'),
    status_code: rangeInt(body.status_code, 'Статус', 1, 3),
  };
}

async function ensureProject(id: number) {
  if (!(await projects.get(id))) throw new HttpError(404, 'Проект не найден');
}

export const taskController = {
  async list(req: Request, res: Response) {
    const projectId = positiveInt(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    res.json(await tasks.list(projectId));
  },
  async create(req: Request, res: Response) {
    const projectId = positiveInt(req.params.projectId, 'projectId');
    await ensureProject(projectId);
    res.status(201).json(await tasks.create(parseTask(record(req.body), projectId)));
  },
  async update(req: Request, res: Response) {
    const projectId = positiveInt(req.params.projectId, 'projectId');
    const taskId = positiveInt(req.params.id, 'id');
    const updated = await tasks.update(taskId, parseTask(record(req.body), projectId));
    if (!updated) throw new HttpError(404, 'Задача не найдена');
    res.json(updated);
  },
  async remove(req: Request, res: Response) {
    const projectId = positiveInt(req.params.projectId, 'projectId');
    const taskId = positiveInt(req.params.id, 'id');
    const removed = await tasks.remove(taskId, projectId);
    if (!removed) throw new HttpError(404, 'Задача не найдена');
    res.status(204).end();
  },
};
