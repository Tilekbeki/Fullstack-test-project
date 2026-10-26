import pgPromise from 'pg-promise';

const pgp = pgPromise();
// PostgreSQL DATE has no timezone; keep it as YYYY-MM-DD in API responses.
pgp.pg.types.setTypeParser(1082, (value) => value);
if (!process.env.DATABASE_URL) throw new Error('Задайте DATABASE_URL в server/.env');
export const db = pgp(process.env.DATABASE_URL);
