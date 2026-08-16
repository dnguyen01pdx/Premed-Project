/**
 * Drops every table in the public schema. Destructive by design; used by
 * `npm run db:reset` when the seed data or schema changes shape.
 */
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  console.log("Dropped and recreated the public schema.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
