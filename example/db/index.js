import { boolean, date, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { highlight } from 'sql-highlight';

export const pool = new Pool({ connectionString: process.env.PG_CONN_URL });
const db = drizzle(pool, {
  logger: {
    logQuery: (query, params) => {
      const sqlString = params.reduce((acc, v, i) => acc.replaceAll("$" + (i + 1), v), query);
      console.log(highlight(sqlString));
    }
  }
});

export default db;

export const migrateAll = async () => {
  await migrate(db, { migrationsFolder: './db/migrations' });
}

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull(),
  createdAt: date('createdAt').notNull(),
  updatedAt: date('updatedAt'),
});
