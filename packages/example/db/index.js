import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { highlight } from 'sql-highlight';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, {
  logger: {
    logQuery: (query, params) => {
      console.log("\033[38;2;0;0;255mSQL:\033[0m", highlight(query));
      console.log("\033[38;2;225;225;0mVAL:\033[0m", params);
    }
  }
});

// await migrate(db, { migrationsFolder: './migrations' });

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
});
