import { db } from '../db';
import { HttpError } from '../lib/http';
import type pgPromise from 'pg-promise';

export interface Project {
  id: number;
  name: string;
  owner_id: number;
  owner: string;
  budget: string;
  start_date: string;
  priority: number;
}

export interface ProjectInput {
  name: string;
  owner_id: number;
  budget: string;
  start_date: string;
  priority: number;
}

export interface ProjectFilters {
  search: string;
  owner?: string;
  priority?: number;
  budgetMin?: number;
  budgetMax?: number;
  startFrom?: string;
  startTo?: string;
}

const projectColumns = 'p.id, p.name, p.owner_id, r.name AS owner, p.budget, p.start_date, p.priority';
const projectFrom = 'FROM projects AS p JOIN responsibles AS r ON r.id = p.owner_id';

type Transaction = pgPromise.ITask<{}>;

async function resolveOwnerId(tx: Transaction, input: ProjectInput): Promise<number> {
  const responsible = await tx.oneOrNone<{ id: number }>('SELECT id FROM responsibles WHERE id = $1', [input.owner_id]);
  if (!responsible) throw new HttpError(400, 'Ответственный не найден');
  return responsible.id;
}

export const projects = {
  async list(limit: number, offset: number, filters: ProjectFilters) {
    const values: Array<string | number> = [];
    const clauses: string[] = [];
    const add = (column: string, operator: string, value: string | number) => {
      values.push(value);
      clauses.push(`${column} ${operator} $${values.length}`);
    };
    if (filters.search) add('p.name', 'ILIKE', `%${filters.search}%`);
    if (filters.owner) add('r.name', 'ILIKE', `%${filters.owner}%`);
    if (filters.priority !== undefined) add('p.priority', '=', filters.priority);
    if (filters.budgetMin !== undefined) add('p.budget', '>=', filters.budgetMin);
    if (filters.budgetMax !== undefined) add('p.budget', '<=', filters.budgetMax);
    if (filters.startFrom) add('p.start_date', '>=', filters.startFrom);
    if (filters.startTo) add('p.start_date', '<=', filters.startTo);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await db.any<Project>(
      `SELECT ${projectColumns} ${projectFrom} ${where} ORDER BY p.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );
    const count = await db.one<{ total: string }>(
      `SELECT COUNT(*) AS total ${projectFrom} ${where}`,
      values
    );
    return { rows, total: Number(count.total) };
  },
  get(id: number) {
    return db.oneOrNone<Project>(`SELECT ${projectColumns} ${projectFrom} WHERE p.id = $1`, [id]);
  },
  create(input: ProjectInput) {
    return db.tx(async tx => {
      const ownerId = await resolveOwnerId(tx, input);
      const inserted = await tx.one<{ id: number }>(
        'INSERT INTO projects (name, owner_id, budget, start_date, priority) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [input.name, ownerId, input.budget, input.start_date, input.priority]
      );
      return tx.one<Project>(`SELECT ${projectColumns} ${projectFrom} WHERE p.id = $1`, [inserted.id]);
    });
  },
  update(id: number, input: ProjectInput) {
    return db.tx(async tx => {
      const existing = await tx.oneOrNone<{ id: number }>('SELECT id FROM projects WHERE id = $1 FOR UPDATE', [id]);
      if (!existing) return null;
      const ownerId = await resolveOwnerId(tx, input);
      await tx.none(
        'UPDATE projects SET name=$2, owner_id=$3, budget=$4, start_date=$5, priority=$6 WHERE id=$1',
        [id, input.name, ownerId, input.budget, input.start_date, input.priority]
      );
      return tx.one<Project>(`SELECT ${projectColumns} ${projectFrom} WHERE p.id = $1`, [id]);
    });
  },
  remove(id: number) {
    return db.oneOrNone<{ id: number }>('DELETE FROM projects WHERE id=$1 RETURNING id', [id]);
  },
};
