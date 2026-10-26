import type { Request, Response } from 'express';
import { responsibles } from '../models/responsibles';
import { HttpError, positiveInt, record, text } from '../lib/http';

function nameFromBody(body: unknown): string {
  return text(record(body).name, 'Имя ответственного', 100);
}

function rethrowDuplicate(error: unknown): never {
  if ((error as { code?: string })?.code === '23505') {
    throw new HttpError(409, 'Ответственный с таким именем уже существует');
  }
  throw error;
}

export const responsibleController = {
  async list(_req: Request, res: Response) {
    res.json(await responsibles.list());
  },
  async create(req: Request, res: Response) {
    try {
      res.status(201).json(await responsibles.create(nameFromBody(req.body)));
    } catch (error) {
      rethrowDuplicate(error);
    }
  },
  async update(req: Request, res: Response) {
    try {
      const responsible = await responsibles.update(
        positiveInt(req.params.id, 'id'),
        nameFromBody(req.body),
      );
      if (!responsible) throw new HttpError(404, 'Ответственный не найден');
      res.json(responsible);
    } catch (error) {
      rethrowDuplicate(error);
    }
  },
  async remove(req: Request, res: Response) {
    let result: Awaited<ReturnType<typeof responsibles.remove>>;
    try {
      result = await responsibles.remove(positiveInt(req.params.id, 'id'));
    } catch (error) {
      if ((error as { code?: string })?.code === '23503') {
        throw new HttpError(
          409,
          'Ответственный назначен проектам. Сначала назначьте им другого ответственного',
        );
      }
      throw error;
    }
    if (result === 'not_found') throw new HttpError(404, 'Ответственный не найден');
    if (result === 'in_use')
      throw new HttpError(
        409,
        'Ответственный назначен проектам. Сначала назначьте им другого ответственного',
      );
    res.status(204).end();
  },
};
