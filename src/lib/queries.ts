import "server-only";
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { prompts, promptTypes, schools } from "@/db/schema";
import { CURRENT_CYCLE } from "./config";

/**
 * Keeps only each school's most recent cycle of prompts.
 *
 * Most schools do not publish their secondary until they send it to you, so our
 * newest text for a given school is often a cycle or two old. Filtering on
 * CURRENT_CYCLE — which is what this used to do — silently hid every one of
 * those schools: the tracker's import button offered nothing and the overlap
 * view saw a fraction of the corpus.
 *
 * So each school contributes its newest text, and the UI says which cycle that
 * is. `PromptCard` renders the cycle badge loudly, which is the honest version
 * of this: never relabel an old prompt as current (AGENTS.md).
 *
 * Done in JS rather than as a correlated subquery because the whole corpus is
 * under a thousand rows, and a wrong answer here is invisible — it looks like
 * "we just don't have that school" rather than like a bug.
 *
 * Lexicographic comparison is correct for the "YYYY-YYYY" format these use.
 */
function onlyLatestCycle<T extends { cycleYear: string; schoolSlug: string }>(
  rows: T[],
): T[] {
  const newest = new Map<string, string>();
  for (const r of rows) {
    const seen = newest.get(r.schoolSlug);
    if (seen === undefined || r.cycleYear > seen) {
      newest.set(r.schoolSlug, r.cycleYear);
    }
  }
  return rows.filter((r) => r.cycleYear === newest.get(r.schoolSlug));
}

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

export type OverlapGroup = {
  typeKey: string;
  typeLabel: string;
  description: string | null;
  prompts: PromptRow[];
  schoolCount: number;
};

/**
 * Groups current-cycle prompts by type so an applicant can see, in one place,
 * every school asking essentially the same question and how long each wants
 * the answer. This is the "write it once, adapt it" view.
 *
 * Administrative items are excluded: nobody reuses an answer to "list your
 * course numbers".
 */
export async function getOverlapGroups(): Promise<OverlapGroup[]> {
  const allRows = await db
    .select(BASE_SELECT)
    .from(prompts)
    .innerJoin(schools, eq(prompts.schoolId, schools.id))
    .innerJoin(promptTypes, eq(prompts.promptTypeId, promptTypes.id))
    .where(sql`${promptTypes.key} <> 'administrative'`)
    .orderBy(asc(promptTypes.sortOrder), asc(schools.name));

  const rows = onlyLatestCycle(allRows);

  const types = await listPromptTypes();
  const meta = new Map(types.map((t) => [t.key, t]));

  const grouped = new Map<string, PromptRow[]>();
  for (const r of rows) {
    if (!r.typeKey) continue;
    const list = grouped.get(r.typeKey) ?? [];
    list.push(r);
    grouped.set(r.typeKey, list);
  }

  return [...grouped.entries()]
    .map(([typeKey, list]) => ({
      typeKey,
      typeLabel: meta.get(typeKey)?.label ?? typeKey,
      description: meta.get(typeKey)?.description ?? null,
      prompts: list,
      schoolCount: new Set(list.map((p) => p.schoolSlug)).size,
    }))
    .sort((a, b) => b.schoolCount - a.schoolCount);
}

/** Minimal school list for the client-side tracker. */
export async function listSchoolsForTracker() {
  const rows = await listSchools();
  return rows.map((s) => ({
    slug: s.slug,
    name: s.name,
    shortName: s.shortName,
    state: s.state,
    promptCount: s.promptCount,
  }));
}

/**
 * Prompts we hold, keyed by school slug, for the tracker's import button.
 *
 * Sent to the client in full. That is fine at the current size (a few hundred
 * prompts) and keeps the tracker working offline once loaded. If this grows
 * past a few hundred KB, switch to fetching per school on demand.
 */
export async function getPromptsBySchool(): Promise<
  Record<
    string,
    Array<{
      id: string;
      text: string;
      typeKey: string | null;
      typeLabel: string | null;
      limitValue: number | null;
      limitUnit: "words" | "characters" | "none";
    }>
  >
> {
  const allRows = await db
    .select({
      id: prompts.id,
      text: prompts.text,
      cycleYear: prompts.cycleYear,
      typeKey: promptTypes.key,
      typeLabel: promptTypes.label,
      limitValue: prompts.limitValue,
      limitUnit: prompts.limitUnit,
      schoolSlug: schools.slug,
    })
    .from(prompts)
    .innerJoin(schools, eq(prompts.schoolId, schools.id))
    .leftJoin(promptTypes, eq(prompts.promptTypeId, promptTypes.id))
    .orderBy(asc(schools.name), asc(prompts.position));

  const rows = onlyLatestCycle(allRows);

  const out: Record<string, Array<Omit<(typeof rows)[number], "schoolSlug">>> =
    {};
  for (const { schoolSlug, ...rest } of rows) {
    (out[schoolSlug] ??= []).push(rest);
  }
  return out;
}
