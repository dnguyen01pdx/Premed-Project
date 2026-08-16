import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { promptSubmissions, schools } from "@/db/schema";

export const MAX_PROMPT_LENGTH = 4000;
export const MAX_NOTE_LENGTH = 1000;
/** Per submitter, per hour. Generous for a real person, useless for a script. */
export const RATE_LIMIT = 15;

export type SubmissionInput = {
  schoolSlug?: string | null;
  schoolNameRaw: string;
  cycleYear: string;
  promptText: string;
  limitValue?: number | null;
  limitUnit: "words" | "characters" | "none";
  note?: string | null;
  contactEmail?: string | null;
};

export type ValidationResult =
  | { ok: true; value: SubmissionInput }
  | { ok: false; errors: Record<string, string> };

/**
 * Validates a submission.
 *
 * Deliberately strict about length and shape and deliberately permissive about
 * content: a prompt someone actually received can look like anything, and
 * rejecting a real submission is worse than accepting one that needs editing.
 */
export function validateSubmission(raw: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const f = (raw ?? {}) as Record<string, unknown>;

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const schoolNameRaw = str(f.schoolNameRaw);
  if (!schoolNameRaw) errors.schoolNameRaw = "Tell us which school this is for.";
  if (schoolNameRaw.length > 200) errors.schoolNameRaw = "That name is too long.";

  const promptText = str(f.promptText);
  if (!promptText) {
    errors.promptText = "Paste the prompt text.";
  } else if (promptText.length < 15) {
    errors.promptText = "That looks too short to be a full prompt.";
  } else if (promptText.length > MAX_PROMPT_LENGTH) {
    errors.promptText = `Keep it under ${MAX_PROMPT_LENGTH} characters.`;
  }

  const cycleYear = str(f.cycleYear);
  if (!/^\d{4}-\d{4}$/.test(cycleYear)) {
    errors.cycleYear = "Pick a cycle.";
  }

  const unitRaw = str(f.limitUnit) || "none";
  if (!["words", "characters", "none"].includes(unitRaw)) {
    errors.limitUnit = "Pick a unit.";
  }
  const limitUnit = unitRaw as SubmissionInput["limitUnit"];

  let limitValue: number | null = null;
  if (limitUnit !== "none") {
    const n = Number.parseInt(str(f.limitValue), 10);
    if (!Number.isFinite(n) || n <= 0 || n > 100_000) {
      errors.limitValue = "Enter the number the school gave.";
    } else {
      limitValue = n;
    }
  }

  const note = str(f.note).slice(0, MAX_NOTE_LENGTH) || null;

  const contactEmail = str(f.contactEmail) || null;
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.contactEmail = "That email does not look right.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      schoolSlug: str(f.schoolSlug) || null,
      schoolNameRaw,
      cycleYear,
      promptText,
      limitValue,
      limitUnit,
      note,
      contactEmail,
    },
  };
}

/**
 * Hashes an IP with a server-side salt. Stored so we can rate limit without
 * keeping anyone's address: the hash is one-way and useless on its own.
 */
export function hashSubmitter(ip: string): string {
  const salt = process.env.SUBMISSION_SALT ?? "md-atlas-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function isRateLimited(submitterHash: string): Promise<boolean> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(promptSubmissions)
    .where(
      and(
        eq(promptSubmissions.submitterHash, submitterHash),
        gte(promptSubmissions.createdAt, hourAgo),
      ),
    );
  return (row?.n ?? 0) >= RATE_LIMIT;
}

export async function insertSubmission(
  value: SubmissionInput,
  submitterHash: string,
) {
  await db.insert(promptSubmissions).values({ ...value, submitterHash });
}

export async function listSubmissions(
  status: "pending" | "approved" | "rejected" | "all" = "pending",
) {
  const base = db
    .select({
      id: promptSubmissions.id,
      schoolSlug: promptSubmissions.schoolSlug,
      schoolNameRaw: promptSubmissions.schoolNameRaw,
      cycleYear: promptSubmissions.cycleYear,
      promptText: promptSubmissions.promptText,
      limitValue: promptSubmissions.limitValue,
      limitUnit: promptSubmissions.limitUnit,
      note: promptSubmissions.note,
      contactEmail: promptSubmissions.contactEmail,
      status: promptSubmissions.status,
      createdAt: promptSubmissions.createdAt,
      knownSchoolName: schools.name,
    })
    .from(promptSubmissions)
    .leftJoin(schools, eq(promptSubmissions.schoolSlug, schools.slug))
    .orderBy(desc(promptSubmissions.createdAt))
    .limit(300);

  if (status === "all") return base;
  return base.where(eq(promptSubmissions.status, status));
}

export async function setSubmissionStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
) {
  await db
    .update(promptSubmissions)
    .set({ status, reviewedAt: new Date() })
    .where(eq(promptSubmissions.id, id));
}

export async function countPendingSubmissions(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(promptSubmissions)
    .where(eq(promptSubmissions.status, "pending"));
  return row?.n ?? 0;
}
