import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const main = async () => {
  console.log("migration started");
  const client = postgres(process.env.EC_PG_CONN_URL + "?sslmode=require", { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: './migrations' });
  console.log("migration complete");
}

main();