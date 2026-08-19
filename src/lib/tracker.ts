/**
 * Client-side tracker storage.
 *
 * Everything a student tracks lives in their own browser. No account, no
 * server, nothing about their school list ever reaches us. That is a real
 * privacy property, not a limitation to apologize for, and it is stated
 * plainly on the page.
 *
 * The tradeoff is equally real: clearing site data or switching devices loses
 * it. Hence the export/import buttons, which are not optional polish.
 */

import type { ExportTable } from "./xlsxExport";

export const TRACKER_STORAGE_KEY = "spl.tracker.v1";

export const STATUSES = [
  "not_started",
  "drafting",
  "done",
  "submitted",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_META: Record<
  Status,
  { label: string; short: string; tone: "neutral" | "warn" | "info" | "ok" }
> = {
  not_started: { label: "Not started", short: "Not started", tone: "neutral" },
  drafting: { label: "Drafting", short: "Drafting", tone: "warn" },
  done: { label: "Draft done", short: "Done", tone: "info" },
  submitted: { label: "Submitted", short: "Submitted", tone: "ok" },
};

/** One essay inside a school's secondary. */
export type TrackedEssay = {
  /** Stable local id. Never sent anywhere. */
  id: string;
  /** The prompt text, or whatever the user typed for a manual entry. */
  label: string;
  status: Status;
  /** Set when the essay was imported from our prompt database. */
  promptId?: string;
  /** Question type, which is what makes cross-school overlap possible. */
  typeKey?: string;
  typeLabel?: string;
  /** "auto" when we guessed the category, "manual" once the user picks it themselves. */
  typeSource?: "auto" | "manual";
  limitValue?: number | null;
  limitUnit?: LimitUnit;
  /** Per-essay deadline, for custom prompts that don't share the school's date. */
  dueOn?: string;
  /** Optional notes the user leaves themselves about this prompt. */
  notes?: string;

  /**
   * The user's own draft answer, pasted in voluntarily. Never generated,
   * never required. Existing only so the reuse tools (Master Essay Map,
   * school-name safety check) have real text to work with instead of just a
   * status flag.
   */
  draftText?: string;
  /**
   * Points at another essay's id when this prompt is being answered with
   * that essay's draft, possibly adapted. The linked-to essay is the "master"
   * for that group; this essay defers to its draftText for the safety check
   * and coverage, but is scored on its OWN school for name-mixups.
   */
  linkedToId?: string;
  /** Free-text tags for which activities/stories this essay draws on. */
  experienceTags?: string[];
};

export type LimitUnit = "words" | "characters" | "none";

/** Where a school sits in the interview pipeline. */
export const INTERVIEW_STAGES = [
  "none",
  "invited",
  "scheduled",
  "completed",
  "decision",
] as const;

export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

export const INTERVIEW_STAGE_META: Record<
  InterviewStage,
  { label: string; tone: "neutral" | "warn" | "info" | "ok" }
> = {
  none: { label: "No invite yet", tone: "neutral" },
  invited: { label: "Invited", tone: "info" },
  scheduled: { label: "Scheduled", tone: "warn" },
  completed: { label: "Interviewed", tone: "ok" },
  decision: { label: "Decision in", tone: "ok" },
};

export const INTERVIEW_FORMATS = [
  "unknown",
  "traditional",
  "mmi",
  "panel",
  "hybrid",
] as const;

export type InterviewFormat = (typeof INTERVIEW_FORMATS)[number];

export const INTERVIEW_FORMAT_LABEL: Record<InterviewFormat, string> = {
  unknown: "Not sure yet",
  traditional: "Traditional (one-on-one)",
  mmi: "MMI (multiple mini)",
  panel: "Panel",
  hybrid: "Mixed format",
};

export const DECISIONS = [
  "pending",
  "accepted",
  "waitlisted",
  "rejected",
  "withdrew",
] as const;

export type Decision = (typeof DECISIONS)[number];

export const DECISION_META: Record<
  Decision,
  { label: string; tone: "neutral" | "warn" | "info" | "ok" | "danger" }
> = {
  pending: { label: "Waiting to hear", tone: "neutral" },
  accepted: { label: "Accepted", tone: "ok" },
  waitlisted: { label: "Waitlisted", tone: "warn" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrew: { label: "Withdrew", tone: "neutral" },
};

export type TrackedInterview = {
  stage: InterviewStage;
  format: InterviewFormat;
  /** ISO dates (yyyy-mm-dd). */
  invitedOn?: string;
  interviewOn?: string;
  /** Virtual link or address, whatever they need on the day. */
  location?: string;
  thankYouSent: boolean;
  decision: Decision;
  notes?: string;
};

export function emptyInterview(): TrackedInterview {
  return {
    stage: "none",
    format: "unknown",
    thankYouSent: false,
    decision: "pending",
  };
}

export type TrackedSchool = {
  slug: string;
  /** Denormalized so the tracker still renders if a slug is later renamed. */
  name: string;
  status: Status;
  /** ISO date (yyyy-mm-dd) the secondary arrived. */
  receivedOn?: string;
  /** ISO date (yyyy-mm-dd) the school's deadline. */
  dueOn?: string;
  notes?: string;
  /** Individual essays. Empty is normal: not everyone breaks it down. */
  essays: TrackedEssay[];
  /** Interview pipeline. Absent until the school reaches that stage. */
  interview?: TrackedInterview;
};

export type TrackerState = {
  version: 2;
  updatedAt: string;
  schools: TrackedSchool[];
};

export function emptyTracker(): TrackerState {
  return { version: 2, updatedAt: new Date().toISOString(), schools: [] };
}

/** Local id generator. crypto.randomUUID is not guaranteed on http origins. */
export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * A school's status derived from its essays. Once a user breaks a school into
 * essays, the school-level status stops being something they should have to
 * maintain by hand: it is whatever the essays say it is.
 *
 * Rules, in order: nothing tracked -> use the stored status. All submitted ->
 * submitted. All done or better -> done. Anything started -> drafting.
 */
export function rollUpStatus(school: TrackedSchool): Status {
  const essays = school.essays ?? [];
  if (essays.length === 0) return school.status;

  const rank: Record<Status, number> = {
    not_started: 0,
    drafting: 1,
    done: 2,
    submitted: 3,
  };
  const min = Math.min(...essays.map((e) => rank[e.status]));
  const max = Math.max(...essays.map((e) => rank[e.status]));

  if (min === 3) return "submitted";
  if (min >= 2) return "done";
  if (max >= 1) return "drafting";
  return "not_started";
}

function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/**
 * Parses whatever is in storage (or an imported file) into a valid tracker.
 * Anything malformed is dropped rather than thrown, because a corrupted entry
 * should never blank out the rest of someone's list.
 */
export function parseTracker(raw: unknown): TrackerState {
  if (!raw || typeof raw !== "object") return emptyTracker();
  const obj = raw as Record<string, unknown>;
  const list = Array.isArray(obj.schools) ? obj.schools : [];

  const schools: TrackedSchool[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (typeof s.slug !== "string" || !s.slug) continue;
    if (seen.has(s.slug)) continue;
    seen.add(s.slug);

    schools.push({
      slug: s.slug,
      name: typeof s.name === "string" && s.name ? s.name : s.slug,
      status: isStatus(s.status) ? s.status : "not_started",
      receivedOn: isIsoDate(s.receivedOn) ? s.receivedOn : undefined,
      dueOn: isIsoDate(s.dueOn) ? s.dueOn : undefined,
      notes: typeof s.notes === "string" ? s.notes.slice(0, 2000) : undefined,
      // v1 saves have no essays field. An empty list is exactly right: the
      // school keeps the status the user already set.
      essays: parseEssays(s.essays),
      interview: parseInterview(s.interview),
    });
  }

  // linkedToId can point at an essay on a different school, which is the
  // whole point of cross-school reuse — so dangling references can only be
  // caught once every school's essays are in hand, not inside parseEssays.
  const allIds = new Set(schools.flatMap((s) => s.essays.map((e) => e.id)));
  for (const s of schools) {
    for (const e of s.essays) {
      if (e.linkedToId && !allIds.has(e.linkedToId)) e.linkedToId = undefined;
    }
  }

  return {
    version: 2,
    updatedAt:
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    schools,
  };
}

function parseInterview(raw: unknown): TrackedInterview | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const i = raw as Record<string, unknown>;
  const stage = (INTERVIEW_STAGES as readonly string[]).includes(
    i.stage as string,
  )
    ? (i.stage as InterviewStage)
    : "none";
  const format = (INTERVIEW_FORMATS as readonly string[]).includes(
    i.format as string,
  )
    ? (i.format as InterviewFormat)
    : "unknown";
  const decision = (DECISIONS as readonly string[]).includes(
    i.decision as string,
  )
    ? (i.decision as Decision)
    : "pending";

  return {
    stage,
    format,
    decision,
    invitedOn: isIsoDate(i.invitedOn) ? i.invitedOn : undefined,
    interviewOn: isIsoDate(i.interviewOn) ? i.interviewOn : undefined,
    location: typeof i.location === "string" ? i.location.slice(0, 500) : undefined,
    thankYouSent: i.thankYouSent === true,
    notes: typeof i.notes === "string" ? i.notes.slice(0, 2000) : undefined,
  };
}

function isLimitUnit(v: unknown): v is LimitUnit {
  return v === "words" || v === "characters" || v === "none";
}

function parseEssays(raw: unknown): TrackedEssay[] {
  if (!Array.isArray(raw)) return [];
  const out: TrackedEssay[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const label = typeof e.label === "string" ? e.label.trim() : "";
    if (!label) continue;
    const id = typeof e.id === "string" && e.id ? e.id : newId();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      label: label.slice(0, 4000),
      status: isStatus(e.status) ? e.status : "not_started",
      promptId: typeof e.promptId === "string" ? e.promptId : undefined,
      typeKey: typeof e.typeKey === "string" ? e.typeKey : undefined,
      typeLabel: typeof e.typeLabel === "string" ? e.typeLabel : undefined,
      typeSource: e.typeSource === "auto" || e.typeSource === "manual" ? e.typeSource : undefined,
      limitValue:
        typeof e.limitValue === "number" ? e.limitValue : undefined,
      limitUnit: isLimitUnit(e.limitUnit) ? e.limitUnit : undefined,
      dueOn: isIsoDate(e.dueOn) ? e.dueOn : undefined,
      notes: typeof e.notes === "string" ? e.notes.slice(0, 4000) : undefined,
      draftText:
        typeof e.draftText === "string" ? e.draftText.slice(0, 20000) : undefined,
      linkedToId: typeof e.linkedToId === "string" ? e.linkedToId : undefined,
      experienceTags: Array.isArray(e.experienceTags)
        ? e.experienceTags
            .filter((t): t is string => typeof t === "string" && t.trim() !== "")
            .map((t) => t.trim().slice(0, 80))
            .slice(0, 20)
        : undefined,
    });
  }
  return out;
}

export function loadTracker(): TrackerState {
  if (typeof window === "undefined") return emptyTracker();
  try {
    const raw = window.localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return emptyTracker();
    return parseTracker(JSON.parse(raw));
  } catch {
    // Private browsing, disabled storage, or garbage JSON. Degrade to empty
    // rather than crashing the page.
    return emptyTracker();
  }
}

/** Returns false when storage is unavailable, so the UI can warn honestly. */
export function saveTracker(state: TrackerState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      TRACKER_STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
    return true;
  } catch {
    return false;
  }
}

export function countByStatus(schools: TrackedSchool[]): Record<Status, number> {
  const counts = {
    not_started: 0,
    drafting: 0,
    done: 0,
    submitted: 0,
  } as Record<Status, number>;
  for (const s of schools) counts[rollUpStatus(s)]++;
  return counts;
}

/** Essay-level totals, which is the number that actually reflects workload. */
export function countEssays(schools: TrackedSchool[]) {
  let total = 0;
  let done = 0;
  for (const s of schools) {
    for (const e of s.essays ?? []) {
      total++;
      if (e.status === "done" || e.status === "submitted") done++;
    }
  }
  return { total, done, remaining: total - done };
}

/** Interview pipeline counts, for the dashboard header. */
export function interviewTotals(schools: TrackedSchool[]) {
  let invited = 0;
  let scheduled = 0;
  let completed = 0;
  let accepted = 0;
  let thankYouOwed = 0;

  for (const s of schools) {
    const i = s.interview;
    if (!i || i.stage === "none") continue;
    if (i.stage === "invited") invited++;
    if (i.stage === "scheduled") scheduled++;
    if (i.stage === "completed" || i.stage === "decision") completed++;
    if (i.decision === "accepted") accepted++;
    if (i.stage === "completed" && !i.thankYouSent) thankYouOwed++;
  }
  return {
    invited,
    scheduled,
    completed,
    accepted,
    thankYouOwed,
    total: invited + scheduled + completed,
  };
}

export type OverlapCluster = {
  typeKey: string;
  typeLabel: string;
  /** One entry per essay, across all of the user's schools. */
  essays: Array<{
    schoolSlug: string;
    schoolName: string;
    essay: TrackedEssay;
  }>;
  schoolCount: number;
  /** Tightest limits in the cluster, which is what to write to first. */
  minWords: number | null;
  minChars: number | null;
};

/**
 * Groups the user's own tracked essays by question type.
 *
 * This is the thing the whole tracker exists for: not "which schools ask a
 * diversity essay" in the abstract, but "which of MY schools do, and what is
 * the shortest one I have to fit".
 *
 * Only clusters with two or more schools are returned; a "cluster" of one is
 * just an essay.
 */
export function overlapClusters(schools: TrackedSchool[]): OverlapCluster[] {
  const byType = new Map<string, OverlapCluster>();

  for (const school of schools) {
    for (const essay of school.essays ?? []) {
      if (!essay.typeKey) continue;
      const existing = byType.get(essay.typeKey);
      const entry = {
        schoolSlug: school.slug,
        schoolName: school.name,
        essay,
      };
      if (existing) {
        existing.essays.push(entry);
      } else {
        byType.set(essay.typeKey, {
          typeKey: essay.typeKey,
          typeLabel: essay.typeLabel ?? essay.typeKey,
          essays: [entry],
          schoolCount: 0,
          minWords: null,
          minChars: null,
        });
      }
    }
  }

  const out: OverlapCluster[] = [];
  for (const cluster of byType.values()) {
    cluster.schoolCount = new Set(cluster.essays.map((e) => e.schoolSlug)).size;
    if (cluster.schoolCount < 2) continue;

    const words = cluster.essays
      .map((e) => e.essay)
      .filter((e) => e.limitUnit === "words" && typeof e.limitValue === "number")
      .map((e) => e.limitValue as number);
    const chars = cluster.essays
      .map((e) => e.essay)
      .filter(
        (e) => e.limitUnit === "characters" && typeof e.limitValue === "number",
      )
      .map((e) => e.limitValue as number);

    cluster.minWords = words.length ? Math.min(...words) : null;
    cluster.minChars = chars.length ? Math.min(...chars) : null;
    out.push(cluster);
  }

  return out.sort((a, b) => b.schoolCount - a.schoolCount);
}

/**
 * Days until a deadline, or null when there is no deadline. Compared on
 * calendar dates in local time so "due today" means today, not 0.4 days.
 */
export function daysUntil(dueOn: string | undefined, today: Date): number | null {
  if (!dueOn) return null;
  const [y, m, d] = dueOn.split("-").map(Number);
  if (!y || !m || !d) return null;
  const due = new Date(y, m - 1, d);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

/**
 * The tracker as a plain table: one row per essay, or one row per school when
 * it has none broken out yet. Shared by the CSV export and the .xlsx export
 * so "what a row looks like" is defined exactly once.
 */
export function trackerExportTable(schools: TrackedSchool[]): ExportTable {
  const headers = [
    "School",
    "School status",
    "Secondary received",
    "Deadline",
    "Essay",
    "Essay status",
    "Limit",
    "Question type",
    "Notes",
  ];
  const rows: string[][] = [];

  for (const s of schools) {
    const base = [
      s.name,
      STATUS_META[rollUpStatus(s)].label,
      s.receivedOn ?? "",
      s.dueOn ?? "",
    ];
    const essays = s.essays ?? [];

    if (essays.length === 0) {
      // One row per essay, so the export opens in a spreadsheet as a work
      // list — a school with nothing broken out yet still gets a row.
      rows.push([...base, "", "", "", "", s.notes ?? ""]);
      continue;
    }
    for (const e of essays) {
      const limit =
        e.limitUnit && e.limitUnit !== "none" && typeof e.limitValue === "number"
          ? `${e.limitValue} ${e.limitUnit}`
          : "";
      rows.push([
        ...base,
        e.label,
        STATUS_META[e.status].label,
        limit,
        e.typeLabel ?? "",
        s.notes ?? "",
      ]);
    }
  }
  return { headers, rows };
}

/**
 * One row per school — the summary view, as opposed to {@link
 * trackerExportTable}'s one-row-per-essay detail. Used by the "export
 * everything" workbook's "Schools" sheet.
 */
export function schoolsExportTable(schools: TrackedSchool[]): ExportTable {
  const headers = [
    "School",
    "Status",
    "Secondary received",
    "Deadline",
    "Essays tracked",
    "Essays done",
    "Notes",
  ];
  const rows = schools.map((s) => {
    const essays = s.essays ?? [];
    const done = essays.filter(
      (e) => e.status === "done" || e.status === "submitted",
    ).length;
    return [
      s.name,
      STATUS_META[rollUpStatus(s)].label,
      s.receivedOn ?? "",
      s.dueOn ?? "",
      String(essays.length),
      String(done),
      s.notes ?? "",
    ];
  });
  return { headers, rows };
}

/**
 * One row per school that has reached the interview pipeline. Schools with
 * no interview activity yet are left out rather than padded with blanks.
 */
export function interviewsExportTable(schools: TrackedSchool[]): ExportTable {
  const headers = [
    "School",
    "Stage",
    "Format",
    "Invited",
    "Interview date",
    "Location",
    "Thank-you sent",
    "Decision",
    "Notes",
  ];
  const rows = schools
    .filter((s) => s.interview && s.interview.stage !== "none")
    .map((s) => {
      const i = s.interview as TrackedInterview;
      return [
        s.name,
        INTERVIEW_STAGE_META[i.stage].label,
        INTERVIEW_FORMAT_LABEL[i.format],
        i.invitedOn ?? "",
        i.interviewOn ?? "",
        i.location ?? "",
        i.thankYouSent ? "Yes" : "No",
        DECISION_META[i.decision].label,
        i.notes ?? "",
      ];
    });
  return { headers, rows };
}

/** CSV form of {@link trackerExportTable}, for anyone who wants raw text over
 *  a real workbook (the "Export spreadsheet" button uses .xlsx instead). */
export function toCsv(schools: TrackedSchool[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const { headers, rows } = trackerExportTable(schools);
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

/* ---------------------------------------------------------------------------
 * External store plumbing.
 *
 * localStorage is an external mutable source, so the component subscribes to
 * it with useSyncExternalStore rather than copying it into state inside an
 * effect. Two benefits beyond correctness: edits in one tab show up in another,
 * and there is no cascading render on mount.
 *
 * getSnapshot must return a referentially stable value or React will loop, so
 * the parsed object is cached and only rebuilt when the raw string changes.
 * ------------------------------------------------------------------------ */

const EMPTY: TrackerState = { version: 2, updatedAt: "", schools: [] };

let cachedRaw: string | null = null;
let cachedState: TrackerState = EMPTY;

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeToTracker(onChange: () => void): () => void {
  listeners.add(onChange);
  // Fires when another tab writes to the same key.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === TRACKER_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getTrackerSnapshot(): TrackerState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(TRACKER_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? parseTracker(JSON.parse(raw)) : EMPTY;
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

/** Stable empty value for SSR and the hydration pass. */
export function getTrackerServerSnapshot(): TrackerState {
  return EMPTY;
}

/** Writes, updates the cache, and notifies subscribers. Returns false if
 *  storage is unavailable so the UI can say so honestly. */
export function commitTracker(next: TrackerState): boolean {
  const withStamp = { ...next, updatedAt: new Date().toISOString() };
  let ok = true;
  try {
    window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(withStamp));
    cachedRaw = window.localStorage.getItem(TRACKER_STORAGE_KEY);
    cachedState = parseTracker(withStamp);
  } catch {
    ok = false;
    // Keep the in-memory view usable even when persistence fails.
    cachedRaw = null;
    cachedState = parseTracker(withStamp);
  }
  emit();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mda:local-change"));
  }
  return ok;
}

/** Subscribe/snapshot pair used purely to detect that hydration finished. */
export function subscribeNever(): () => void {
  return () => {};
}
