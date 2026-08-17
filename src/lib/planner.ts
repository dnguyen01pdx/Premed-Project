/**
 * The weekly planner store.
 *
 * Why a *weekly* planner and not a date calendar: a premed's life is a repeating
 * week. Orgo lecture is Monday/Wednesday/Friday at 10 for fifteen weeks. The
 * clinic shift is every Tuesday afternoon. Asking someone to enter that on 45
 * separate dates is the reason planner apps go unused by the second week.
 *
 * So the unit here is a recurring weekday block, and the payoff is the part
 * nobody else does: because every block carries an activity category, the
 * planner can total the hours you actually commit each week and hand them
 * straight to the Primary application log. The planner is not a side feature —
 * it is where the hours in Work & Activities come from.
 */
import { createId } from "./id";

const KEY = "mda.planner.v1";

/**
 * Categories deliberately mirror the shape of AMCAS activity types rather than
 * generic calendar colors, so a week's blocks can be totalled into something an
 * application actually asks for.
 */
export const PLANNER_CATEGORIES = [
  { key: "class", label: "Class", hint: "Lecture, lab, discussion section" },
  { key: "study", label: "Study", hint: "Coursework, MCAT, review" },
  { key: "clinical", label: "Clinical", hint: "Scribing, EMT, shadowing, MA" },
  { key: "research", label: "Research", hint: "Lab hours, data, writing" },
  { key: "volunteer", label: "Volunteering", hint: "Clinical or non-clinical service" },
  { key: "work", label: "Work", hint: "Paid employment" },
  { key: "leadership", label: "Leadership", hint: "Club, org, teaching, tutoring" },
  { key: "application", label: "Application", hint: "Essays, secondaries, interviews" },
  { key: "personal", label: "Personal", hint: "Gym, family, rest, everything else" },
] as const;

export type PlannerCategory = (typeof PLANNER_CATEGORIES)[number]["key"];

/** Categories whose hours are worth reporting on an application. */
export const REPORTABLE: PlannerCategory[] = [
  "clinical",
  "research",
  "volunteer",
  "work",
  "leadership",
];

export const DAYS = [
  { key: 0, short: "Sun", long: "Sunday" },
  { key: 1, short: "Mon", long: "Monday" },
  { key: 2, short: "Tue", long: "Tuesday" },
  { key: 3, short: "Wed", long: "Wednesday" },
  { key: 4, short: "Thu", long: "Thursday" },
  { key: 5, short: "Fri", long: "Friday" },
  { key: 6, short: "Sat", long: "Saturday" },
] as const;

export type PlannerEvent = {
  id: string;
  title: string;
  /** 0 = Sunday, matching Date.getDay() so nothing needs translating later. */
  day: number;
  /** Minutes from midnight. Integers only; the UI snaps to 5-minute steps. */
  start: number;
  end: number;
  category: PlannerCategory;
  location?: string;
  notes?: string;
};

export type PlannerState = {
  version: 1;
  events: PlannerEvent[];
  /** Visible window of the grid, in minutes from midnight. */
  dayStart: number;
  dayEnd: number;
};

const EMPTY: PlannerState = {
  version: 1,
  events: [],
  dayStart: 7 * 60,
  dayEnd: 22 * 60,
};

/* ------------------------------------------------------------------ time -- */

/** 570 -> "9:30 AM". */
export function fmtTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
}

/** 570 -> "09:30", for <input type="time">. */
export function toTimeInput(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "09:30" -> 570. Returns null on anything unparseable. */
export function fromTimeInput(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** "1h 30m", "45m", "2h". Empty string for zero. */
export function fmtDuration(mins: number): string {
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/* ----------------------------------------------------------------- derive -- */

export function eventsForDay(state: PlannerState, day: number): PlannerEvent[] {
  return state.events
    .filter((e) => e.day === day)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

export function duration(e: PlannerEvent): number {
  return Math.max(0, e.end - e.start);
}

/**
 * Blocks that collide in time on the same day.
 *
 * Returned as a Set of ids rather than pairs because the only consumer is the
 * UI, which needs to know "does this one need a warning badge" and nothing more.
 */
export function conflictIds(state: PlannerState): Set<string> {
  const out = new Set<string>();
  for (const d of DAYS) {
    const list = eventsForDay(state, d.key);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[i].end > list[j].start && list[j].end > list[i].start) {
          out.add(list[i].id);
          out.add(list[j].id);
        }
      }
    }
  }
  return out;
}

/**
 * Lanes for side-by-side rendering of overlapping blocks.
 *
 * Greedy first-fit per day: a block takes the lowest lane whose last block has
 * already ended. Good enough visually, and it keeps a single 9-5 block full
 * width instead of squeezing it because something else that day overlapped.
 */
export function layoutDay(
  state: PlannerState,
  day: number,
): Array<{ event: PlannerEvent; lane: number; lanes: number }> {
  const list = eventsForDay(state, day);
  const laneEnds: number[] = [];
  const placed = list.map((event) => {
    let lane = laneEnds.findIndex((end) => end <= event.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(event.end);
    } else {
      laneEnds[lane] = event.end;
    }
    return { event, lane };
  });

  // Every block in a colliding cluster must agree on the lane count, or they
  // render at different widths and look broken.
  return placed.map((p) => {
    const cluster = placed.filter(
      (q) => q.event.end > p.event.start && p.event.end > q.event.start,
    );
    return {
      ...p,
      lanes: Math.max(1, ...cluster.map((q) => q.lane + 1)),
    };
  });
}

export function weeklyTotals(state: PlannerState) {
  const byCategory = new Map<PlannerCategory, number>();
  let total = 0;
  for (const e of state.events) {
    const d = duration(e);
    total += d;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + d);
  }
  const reportable = REPORTABLE.reduce(
    (n, k) => n + (byCategory.get(k) ?? 0),
    0,
  );
  const busiest = DAYS.map((d) => ({
    day: d.key,
    minutes: eventsForDay(state, d.key).reduce((n, e) => n + duration(e), 0),
  })).sort((a, b) => b.minutes - a.minutes)[0];

  return {
    total,
    byCategory,
    reportable,
    events: state.events.length,
    busiest,
    conflicts: conflictIds(state).size,
  };
}

export function categoryLabel(key: PlannerCategory): string {
  return PLANNER_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/* ---------------------------------------------------------------- mutate -- */

export function blankEvent(day = 1, start = 9 * 60): PlannerEvent {
  return {
    id: createId(),
    title: "",
    day,
    start,
    end: start + 60,
    category: "class",
    location: "",
    notes: "",
  };
}

/* --------------------------------------------------------------- storage -- */

function normalize(raw: unknown): PlannerState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Partial<PlannerState>;
  const events = Array.isArray(r.events) ? r.events : [];
  const valid = new Set(PLANNER_CATEGORIES.map((c) => c.key as string));

  return {
    version: 1,
    dayStart: clampMin(r.dayStart, 7 * 60),
    dayEnd: clampMin(r.dayEnd, 22 * 60),
    events: events
      .filter((e): e is PlannerEvent => !!e && typeof e === "object")
      .map((e) => ({
        id: typeof e.id === "string" && e.id ? e.id : createId(),
        title: typeof e.title === "string" ? e.title : "",
        day: Number.isInteger(e.day) && e.day >= 0 && e.day <= 6 ? e.day : 1,
        start: clampMin(e.start, 9 * 60),
        end: clampMin(e.end, 10 * 60),
        category: valid.has(e.category as string)
          ? (e.category as PlannerCategory)
          : "personal",
        location: typeof e.location === "string" ? e.location : "",
        notes: typeof e.notes === "string" ? e.notes : "",
      }))
      // A zero or negative-length block can only come from corrupt data, and
      // rendering one produces an invisible, unclickable div.
      .map((e) => (e.end <= e.start ? { ...e, end: e.start + 30 } : e)),
  };
}

function clampMin(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1440, Math.max(0, n));
}

let cache: PlannerState = EMPTY;
let cacheRaw: string | null = null;

export function getPlannerSnapshot(): PlannerState {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  if (!raw) {
    cache = EMPTY;
    return cache;
  }
  try {
    cache = normalize(JSON.parse(raw));
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export function getPlannerServerSnapshot(): PlannerState {
  return EMPTY;
}

const listeners = new Set<() => void>();

export function subscribeToPlanner(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function writePlanner(next: PlannerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode. The in-memory copy below still keeps the tab
    // usable for this session, which beats losing the interaction entirely.
  }
  cacheRaw = null;
  cache = next;
  for (const l of listeners) l();
  window.dispatchEvent(new CustomEvent("mda:local-change"));
}

export function updatePlanner(fn: (s: PlannerState) => PlannerState): void {
  writePlanner(fn(getPlannerSnapshot()));
}

/** Exposed for SyncPanel, which round-trips the raw shape without reading it. */
export function replacePlanner(raw: unknown): void {
  writePlanner(normalize(raw));
}

export function plannerToCsv(state: PlannerState): string {
  const head = ["Day", "Start", "End", "Hours", "Category", "Title", "Location", "Notes"];
  const rows = DAYS.flatMap((d) =>
    eventsForDay(state, d.key).map((e) => [
      d.long,
      fmtTime(e.start),
      fmtTime(e.end),
      (duration(e) / 60).toFixed(2),
      categoryLabel(e.category),
      e.title,
      e.location ?? "",
      e.notes ?? "",
    ]),
  );
  return [head, ...rows]
    .map((r) =>
      r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
