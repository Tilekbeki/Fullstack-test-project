import { db } from '../db';

export interface Responsible {
  id: number;
  name: string;
}

export const responsibles = {
  list() {
    return db.any<Responsible>('SELECT id, name FROM responsibles ORDER BY name, id');
  },
  get(id: number) {
    return db.oneOrNone<Responsible>('SELECT id, name FROM responsibles WHERE id = $1', [
      id,
    ]);
  },
  create(name: string) {
    return db.one<Responsible>(
      'INSERT INTO responsibles (name) VALUES ($1) RETURNING id, name',
      [name],
    );
  },
  update(id: number, name: string) {
    return db.oneOrNone<Responsible>(
      'UPDATE responsibles SET name = $2 WHERE id = $1 RETURNING id, name',
      [id, name],
    );
  },
  remove(id: number): Promise<'deleted' | 'not_found' | 'in_use'> {
    return db.tx(async (tx) => {
      const existing = await tx.oneOrNone<{ id: number }>(
        'SELECT id FROM responsibles WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (!existing) return 'not_found';
      const inUse = await tx.one<{ used: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM projects WHERE owner_id = $1) AS used',
        [id],
      );
      if (inUse.used) return 'in_use';
      await tx.none('DELETE FROM responsibles WHERE id = $1', [id]);
      return 'deleted';
    });
  },
};
