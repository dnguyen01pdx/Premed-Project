/**
 * One-command database setup: creates the tables if they do not exist, then
 * loads the seed data if the database is empty.
 *
 * This runs automatically as part of `npm run build`, which means a fresh
 * deploy (Vercel, or anywhere else) brings up its own schema and data with no
 * manual step. Safe to run repeatedly: migrations are tracked by Drizzle, and
 * seeding is skipped when prompts already exist.
 *
 * Set FORCE_SEED=1 to re-seed over existing data.
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { seed } from "./seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    // A build without a database configured is a legitimate state (someone
    // checking the code compiles). Warn rather than fail.
    console.warn(
      "[setup] DATABASE_URL is not set. Skipping database setup.\n" +
        "[setup] Set it in .env.local locally, or in your host's environment variables.",
    );
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("[setup] Applying database migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sql`prompts`);

  if (count > 0 && process.env.FORCE_SEED !== "1") {
    console.log(
      `[setup] Database already has ${count} prompts. Skipping seed. ` +
        `(Set FORCE_SEED=1 to reload from data/*.json.)`,
    );
    await pool.end();
    return;
  }

  console.log("[setup] Loading seed data...");
  await seed(db);
  await pool.end();
  console.log("[setup] Done.");
}

main().catch((e) => {
  console.error("[setup] Failed:", e);
  process.exit(1);
});
