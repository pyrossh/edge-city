import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { highlight } from "sql-highlight";

const init = async () => {
  const pool = new Pool({
    connectionString: process.env.EDGE_PG_CONN_URL,
  });
  const db = drizzle(pool, {
    logger: {
      logQuery: (query, params) => {
        const sqlString = params.reduce((acc, v, i) => acc.replaceAll("$" + (i + 1), v), query);
        console.log(highlight(sqlString));
      },
    },
  });
  globalThis.db = db;
};

export default init;
