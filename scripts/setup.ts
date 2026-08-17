/**
 * One-command database setup: creates the tables if they do not exist, then
 * loads the seed data.
 *
 * This runs automatically as part of `npm run build`, so a deploy brings up its
 * own schema and data with no manual step.
 *
 * It used to skip seeding whenever the database already held any prompts. That
 * was quietly catastrophic: the prompt corpus grew from 138 to 769 and not one
 * of the new rows ever reached production, because production was "already
 * seeded". The site kept serving months-old data while every local check passed
 * against a fresh database.
 *
 * So seeding now runs on every deploy. `seed()` is a full per-school replace and
 * is idempotent, data/schools.json is the source of truth (see AGENTS.md), and
 * at this size the whole load takes seconds. Set SKIP_SEED=1 to bypass it.
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

  const [{ count: before }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sql`prompts`);

  if (process.env.SKIP_SEED === "1") {
    console.log(
      `[setup] SKIP_SEED=1 set. Leaving the existing ${before} prompts alone.`,
    );
    await pool.end();
    return;
  }

  console.log(`[setup] Loading seed data (database currently has ${before})...`);
  await seed(db);

  const [{ count: after }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sql`prompts`);

  // Logged loudly on purpose. The previous failure was invisible precisely
  // because nothing ever printed what the database actually ended up holding.
  console.log(
    `[setup] Done. Prompts: ${before} before, ${after} after.` +
      (before === after ? "" : ` (${after - before >= 0 ? "+" : ""}${after - before})`),
  );
  await pool.end();
}

main().catch((e) => {
  console.error("[setup] Failed:", e);
  process.exit(1);
});
