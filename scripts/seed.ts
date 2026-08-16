/**
 * Seeds the prompt database from data/prompt-types.json and data/schools.json.
 *
 * Idempotent: re-running updates existing rows rather than duplicating them.
 * The JSON files are the source of truth. To correct a prompt, edit the JSON
 * and re-run `npm run db:seed`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  promptTypes,
  prompts,
  schools,
  type LimitUnit,
} from "../src/db/schema";

type SeedPromptType = {
  key: string;
  label: string;
  description?: string;
  sortOrder?: number;
};

type SeedPrompt = {
  text: string;
  type: string | null;
  limit: number | null;
  unit: LimitUnit;
  optional: boolean;
  notes?: string;
  /** Set true only after verifying the prompt on the school's own materials. */
  confirmed?: boolean;
};

type SeedSchool = {
  slug: string;
  name: string;
  shortName?: string;
  city?: string;
  state?: string;
  degree?: string;
  websiteUrl?: string;
  source?: string;
  cycleYear: string;
  prompts: SeedPrompt[];
};

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), relativePath), "utf8"),
  ) as T;
}

/** Loads data/*.json into the given database. Idempotent. */
export async function seed(db: NodePgDatabase<Record<string, never>>) {
  const typeRows = readJson<SeedPromptType[]>("data/prompt-types.json");
  const { schools: schoolRows } = readJson<{ schools: SeedSchool[] }>(
    "data/schools.json",
  );

  const typeIdByKey = new Map<string, string>();
  for (const t of typeRows) {
    const [row] = await db
      .insert(promptTypes)
      .values({
        key: t.key,
        label: t.label,
        description: t.description,
        sortOrder: t.sortOrder ?? 0,
      })
      .onConflictDoUpdate({
        target: promptTypes.key,
        set: {
          label: t.label,
          description: t.description,
          sortOrder: t.sortOrder ?? 0,
        },
      })
      .returning();
    typeIdByKey.set(t.key, row.id);
  }
  console.log(`Seeded ${typeRows.length} prompt types.`);

  let promptCount = 0;

  for (const s of schoolRows) {
    const [school] = await db
      .insert(schools)
      .values({
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        city: s.city,
        state: s.state,
        degree: s.degree ?? "MD",
        websiteUrl: s.websiteUrl,
      })
      .onConflictDoUpdate({
        target: schools.slug,
        set: {
          name: s.name,
          shortName: s.shortName,
          city: s.city,
          state: s.state,
          degree: s.degree ?? "MD",
          websiteUrl: s.websiteUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Replace this school's prompts for this cycle wholesale. Prompt text is
    // the content, so there is no natural key to diff against; rewriting the
    // cycle is simpler and cannot leave stale rows behind.
    await db
      .delete(prompts)
      .where(
        and(
          eq(prompts.schoolId, school.id),
          eq(prompts.cycleYear, s.cycleYear),
        ),
      );

    const rows = s.prompts.map((p, index) => {
      if (p.type && !typeIdByKey.has(p.type)) {
        throw new Error(
          `Unknown prompt type "${p.type}" on ${s.slug} prompt ${index + 1}. ` +
            `Add it to data/prompt-types.json.`,
        );
      }
      const confirmed = p.confirmed ?? false;
      return {
        schoolId: school.id,
        cycleYear: s.cycleYear,
        text: p.text,
        promptTypeId: p.type ? typeIdByKey.get(p.type)! : null,
        limitValue: p.limit,
        limitUnit: p.unit,
        confirmed,
        confirmedAt: confirmed ? new Date() : null,
        optional: p.optional,
        position: index + 1,
        source: s.source,
        notes: p.notes,
      };
    });

    if (rows.length > 0) await db.insert(prompts).values(rows);
    promptCount += rows.length;
  }

  console.log(`Seeded ${schoolRows.length} schools and ${promptCount} prompts.`);
}

/** CLI entrypoint: `npm run db:seed`. */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await seed(drizzle(pool));
  await pool.end();
}

if (process.argv[1]?.endsWith("seed.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
