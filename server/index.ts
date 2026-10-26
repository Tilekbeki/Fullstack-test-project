import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { projectRoutes } from './routes/projects';
import { responsibleRoutes } from './routes/responsibles';
import { db } from './db';
import { HttpError } from './lib/http';

export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', async (_req, res, next) => {
  try {
    await db.one('SELECT 1 AS ok');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
app.get('/api/overview', async (_req, res, next) => {
  try {
    const result = await db.one<{
      projects: string;
      tasks: string;
      budget: string;
      done: string;
    }>(`SELECT
      (SELECT COUNT(*) FROM projects) AS projects,
      (SELECT COUNT(*) FROM tasks) AS tasks,
      (SELECT COALESCE(SUM(budget), 0) FROM projects) AS budget,
      (SELECT COUNT(*) FROM tasks WHERE status_code = 3) AS done`);
    res.json({
      projects: Number(result.projects),
      tasks: Number(result.tasks),
      budget: Number(result.budget),
      done: Number(result.done),
    });
  } catch (error) {
    next(error);
  }
});
app.use('/api/projects', projectRoutes);
app.use('/api/responsibles', responsibleRoutes);
app.use((_req, _res, next) => next(new HttpError(404, 'Маршрут не найден')));

const errors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  const code = (error as { code?: string })?.code;
  if ((error as { type?: string })?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некорректный JSON' });
    return;
  }
  if (
    ['23503', '23514', '23502', '22001', '22003', '22007', '22008', '22P02'].includes(
      code ?? '',
    )
  ) {
    res.status(400).json({ error: 'Данные нарушают ограничения базы данных' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
};
app.use(errors);

if (require.main === module) {
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => console.log(`API: http://localhost:${port}`));
}
