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
};

export type TrackerState = {
  version: 1;
  updatedAt: string;
  schools: TrackedSchool[];
};

export function emptyTracker(): TrackerState {
  return { version: 1, updatedAt: new Date().toISOString(), schools: [] };
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
    });
  }

  return {
    version: 1,
    updatedAt:
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    schools,
  };
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
  for (const s of schools) counts[s.status]++;
  return counts;
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

export function toCsv(schools: TrackedSchool[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["School", "Status", "Secondary received", "Deadline", "Notes"];
  const lines = [header.join(",")];
  for (const s of schools) {
    lines.push(
      [
        esc(s.name),
        esc(STATUS_META[s.status].label),
        esc(s.receivedOn ?? ""),
        esc(s.dueOn ?? ""),
        esc(s.notes ?? ""),
      ].join(","),
    );
  }
  return lines.join("\n");
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

const EMPTY: TrackerState = { version: 1, updatedAt: "", schools: [] };

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
  return ok;
}

/** Subscribe/snapshot pair used purely to detect that hydration finished. */
export function subscribeNever(): () => void {
  return () => {};
}
