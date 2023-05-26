import { NeonDatabase } from "drizzle-orm/neon-serverless"

declare global {
  const db: NeonDatabase;
}