import "server-only";
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { prompts, promptTypes, schools } from "@/db/schema";
import { CURRENT_CYCLE } from "./config";

export type PromptFilters = {
  /** Free-text search across prompt text and school name. */
  q?: string;
  /** PromptType.key values. Empty means no type filter. */
  types?: string[];
  /** School slug. */
  school?: string;
  /** Two-letter state code. */
  state?: string;
  /** Only prompts whose limit is at or below this many words. */
  maxWords?: number;
  /** Only prompts whose limit is at or below this many characters. */
  maxChars?: number;
  /** Only prompts confirmed for the current cycle. */
  confirmedOnly?: boolean;
  /** Hide administrative and other non-essay items. */
  essaysOnly?: boolean;
};

export type PromptRow = {
  id: string;
  text: string;
  cycleYear: string;
  limitValue: number | null;
  limitUnit: "words" | "characters" | "none";
  confirmed: boolean;
  optional: boolean;
  position: number;
  notes: string | null;
  source: string | null;
  typeKey: string | null;
  typeLabel: string | null;
  schoolSlug: string;
  schoolName: string;
  schoolShortName: string | null;
  schoolState: string | null;
};

const BASE_SELECT = {
  id: prompts.id,
  text: prompts.text,
  cycleYear: prompts.cycleYear,
  limitValue: prompts.limitValue,
  limitUnit: prompts.limitUnit,
  confirmed: prompts.confirmed,
  optional: prompts.optional,
  position: prompts.position,
  notes: prompts.notes,
  source: prompts.source,
  typeKey: promptTypes.key,
  typeLabel: promptTypes.label,
  schoolSlug: schools.slug,
  schoolName: schools.name,
  schoolShortName: schools.shortName,
  schoolState: schools.state,
};

function buildWhere(filters: PromptFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    const needle = `%${filters.q}%`;
    const match = or(ilike(prompts.text, needle), ilike(schools.name, needle));
    if (match) clauses.push(match);
  }

  if (filters.types?.length) {
    clauses.push(inArray(promptTypes.key, filters.types));
  }

  if (filters.school) clauses.push(eq(schools.slug, filters.school));
  if (filters.state) clauses.push(eq(schools.state, filters.state));
  if (filters.confirmedOnly) {
    clauses.push(eq(prompts.confirmed, true));
    clauses.push(eq(prompts.cycleYear, CURRENT_CYCLE));
  }
  if (filters.essaysOnly) {
    clauses.push(
      sql`(${promptTypes.key} is null or ${promptTypes.key} <> 'administrative')`,
    );
  }

  // Length filters only apply to prompts measured in that unit. A prompt with
  // no stated limit is excluded rather than assumed to fit, so results never
  // overstate what is known.
  if (filters.maxWords !== undefined) {
    clauses.push(
      sql`${prompts.limitUnit} = 'words' and ${prompts.limitValue} <= ${filters.maxWords}`,
    );
  }
  if (filters.maxChars !== undefined) {
    clauses.push(
      sql`${prompts.limitUnit} = 'characters' and ${prompts.limitValue} <= ${filters.maxChars}`,
    );
  }

  return clauses.length ? and(...clauses) : undefined;
}

export async function searchPrompts(
  filters: PromptFilters,
  { limit = 200 }: { limit?: number } = {},
): Promise<PromptRow[]> {
  return db
    .select(BASE_SELECT)
    .from(prompts)
    .innerJoin(schools, eq(prompts.schoolId, schools.id))
    .leftJoin(promptTypes, eq(prompts.promptTypeId, promptTypes.id))
    .where(buildWhere(filters))
    .orderBy(asc(schools.name), asc(prompts.position))
    .limit(limit);
}

export async function countPrompts(filters: PromptFilters): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(prompts)
    .innerJoin(schools, eq(prompts.schoolId, schools.id))
    .leftJoin(promptTypes, eq(prompts.promptTypeId, promptTypes.id))
    .where(buildWhere(filters));
  return row?.n ?? 0;
}

export async function listPromptTypes() {
  return db
    .select()
    .from(promptTypes)
    .orderBy(asc(promptTypes.sortOrder), asc(promptTypes.label));
}

export async function listSchools() {
  return db
    .select({
      slug: schools.slug,
      name: schools.name,
      shortName: schools.shortName,
      city: schools.city,
      state: schools.state,
      promptCount: sql<number>`count(${prompts.id})::int`,
    })
    .from(schools)
    .leftJoin(prompts, eq(prompts.schoolId, schools.id))
    .groupBy(schools.id)
    .orderBy(asc(schools.name));
}

export async function getSchoolBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getSchoolPrompts(slug: string): Promise<PromptRow[]> {
  return db
    .select(BASE_SELECT)
    .from(prompts)
    .innerJoin(schools, eq(prompts.schoolId, schools.id))
    .leftJoin(promptTypes, eq(prompts.promptTypeId, promptTypes.id))
    .where(eq(schools.slug, slug))
    .orderBy(asc(prompts.cycleYear), asc(prompts.position));
}

export async function listStates() {
  const rows = await db
    .selectDistinct({ state: schools.state })
    .from(schools)
    .orderBy(asc(schools.state));
  return rows.map((r) => r.state).filter((s): s is string => Boolean(s));
}

export async function getStats() {
  const [row] = await db
    .select({
      schools: sql<number>`count(distinct ${prompts.schoolId})::int`,
      prompts: sql<number>`count(*)::int`,
    })
    .from(prompts);
  return row ?? { schools: 0, prompts: 0 };
}
