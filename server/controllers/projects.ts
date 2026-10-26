import type { Request, Response } from 'express';
import { projects, type ProjectFilters, type ProjectInput } from '../models/projects';
import {
  HttpError,
  decimal,
  isoDate,
  nonNegative,
  paging,
  positiveInt,
  rangeInt,
  record,
  text,
} from '../lib/http';

function parseProject(body: Record<string, unknown>): ProjectInput {
  return {
    name: text(body.name, 'Название', 120),
    owner_id: positiveInt(body.owner_id, 'Ответственный'),
    budget: decimal(body.budget, 'Бюджет', 10, 2),
    start_date: isoDate(body.start_date, 'Дата начала'),
    priority: rangeInt(body.priority, 'Приоритет', 1, 3),
  };
}

export const projectController = {
  async list(req: Request, res: Response) {
    const { limit, offset } = paging(req.query);
    const optionalText = (value: unknown, label: string) => {
      if (value === undefined || value === '') return undefined;
      if (typeof value !== 'string' || value.length > 100)
        throw new HttpError(400, `Некорректное поле: ${label}`);
      return value.trim() || undefined;
    };
    const optionalBudget = (value: unknown, label: string) => {
      if (value === undefined || value === '') return undefined;
      return nonNegative(value, label);
    };
    const optionalDate = (value: unknown, label: string) =>
      value === undefined || value === '' ? undefined : isoDate(value, label);
    const filters: ProjectFilters = {
      search: optionalText(req.query.search, 'Поиск') ?? '',
      owner: optionalText(req.query.owner, 'Ответственный'),
      priority:
        req.query.priority === undefined || req.query.priority === ''
          ? undefined
          : rangeInt(req.query.priority, 'Приоритет', 1, 3),
      budgetMin: optionalBudget(req.query.budgetMin, 'Бюджет от'),
      budgetMax: optionalBudget(req.query.budgetMax, 'Бюджет до'),
      startFrom: optionalDate(req.query.startFrom, 'Дата от'),
      startTo: optionalDate(req.query.startTo, 'Дата до'),
    };
    if (
      filters.budgetMin !== undefined &&
      filters.budgetMax !== undefined &&
      filters.budgetMin > filters.budgetMax
    )
      throw new HttpError(400, 'Бюджет от не может быть больше бюджета до');
    if (filters.startFrom && filters.startTo && filters.startFrom > filters.startTo)
      throw new HttpError(400, 'Дата от не может быть позже даты до');
    res.json(await projects.list(limit, offset, filters));
  },
  async get(req: Request, res: Response) {
    const project = await projects.get(positiveInt(req.params.id, 'id'));
    if (!project) throw new HttpError(404, 'Проект не найден');
    res.json(project);
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await projects.create(parseProject(record(req.body))));
  },
  async update(req: Request, res: Response) {
    const project = await projects.update(
      positiveInt(req.params.id, 'id'),
      parseProject(record(req.body)),
    );
    if (!project) throw new HttpError(404, 'Проект не найден');
    res.json(project);
  },
  async remove(req: Request, res: Response) {
    const deleted = await projects.remove(positiveInt(req.params.id, 'id'));
    if (!deleted) throw new HttpError(404, 'Проект не найден');
    res.status(204).end();
  },
};
