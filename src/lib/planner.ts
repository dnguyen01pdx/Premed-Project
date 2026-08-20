/**
 * The planner store.
 *
 * Phase 3 rewrite: this used to model a single repeating week (a block lived
 * on "day 1", forever). That was simple but wrong for how a real premed year
 * looks — a one-time MCAT test date, a lab rotation that runs September
 * through December, a shift that starts every other Tuesday. The unit is now
 * a real anchor date plus an explicit recurrence rule, so "this repeats" and
 * "this happens once" are both first-class instead of the second one being a
 * workaround.
 *
 * What did NOT change: a category on every block, because that is still what
 * lets the planner total hours-per-week and hand them to Primary. And the
 * week is still the primary way most people will look at this — it is just
 * no longer the only way, or the only thing the data can represent.
 */
import { createId } from "./id";
import type { ExportTable } from "./xlsxExport";

export const PLANNER_STORAGE_KEY = "mda.planner.v1";
const KEY = PLANNER_STORAGE_KEY;

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

const WEEKDAY_SHORT = DAYS.map((d) => d.short);

export const RECURRENCE_TYPES = [
  { key: "none", label: "Does not repeat" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "weekdays", label: "Every weekday (Mon–Fri)" },
  { key: "biweekly", label: "Every 2 weeks" },
  { key: "monthly", label: "Monthly" },
  { key: "custom_days", label: "Custom days of the week" },
] as const;

export type RecurrenceType = (typeof RECURRENCE_TYPES)[number]["key"];

export function recurrenceLabel(key: RecurrenceType): string {
  return RECURRENCE_TYPES.find((r) => r.key === key)?.label ?? key;
}

export type PlannerEvent = {
  id: string;
  title: string;
  category: PlannerCategory;
  location?: string;
  notes?: string;
  /** ISO yyyy-mm-dd. The first occurrence; every recurrence is computed from it. */
  startDate: string;
  /** ISO yyyy-mm-dd, inclusive. Absent means it repeats with no end date. */
  endDate?: string;
  /** Minutes from midnight. Integers only; the UI snaps to 5-minute steps. */
  startTime: number;
  endTime: number;
  recurrence: RecurrenceType;
  /** Only meaningful when recurrence === "custom_days". 0 = Sunday. */
  recurDays?: number[];
};

export type PlannerState = {
  version: 2;
  events: PlannerEvent[];
  /** Visible window of the day grid, in minutes from midnight. */
  dayStart: number;
  dayEnd: number;
};

const EMPTY: PlannerState = {
  version: 2,
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

/* ------------------------------------------------------------------ date -- */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-time ISO date, never UTC — a calendar date should not shift at 8pm. */
export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDaysIso(s: string, n: number): string {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function weekdayOfIso(s: string): number {
  return fromIso(s).getDay();
}

function diffDaysIso(a: string, b: string): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / 86_400_000);
}

export function fmtDateShort(iso: string): string {
  return fromIso(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/** Sunday of the week containing dateIso, matching Date.getDay(). */
export function startOfWeekIso(dateIso: string): string {
  return addDaysIso(dateIso, -weekdayOfIso(dateIso));
}

export function weekDates(anchorIso: string): string[] {
  const start = startOfWeekIso(anchorIso);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
}

/** Every date in the Sun-start grid that fully covers the given month. */
export function monthGridDates(year: number, month: number): string[] {
  const firstIso = toIso(new Date(year, month, 1));
  const lastIso = toIso(new Date(year, month + 1, 0));
  const start = startOfWeekIso(firstIso);
  const end = weekDates(lastIso)[6];
  const out: string[] = [];
  for (let cur = start; cur <= end; cur = addDaysIso(cur, 1)) out.push(cur);
  return out;
}

/* ------------------------------------------------------------- occurrence -- */

/** Whether an event has an occurrence on the given calendar date. */
export function occursOn(event: PlannerEvent, dateIso: string): boolean {
  if (dateIso < event.startDate) return false;
  if (event.endDate && dateIso > event.endDate) return false;

  const dow = weekdayOfIso(dateIso);
  switch (event.recurrence) {
    case "none":
      return dateIso === event.startDate;
    case "daily":
      return true;
    case "weekly":
      return dow === weekdayOfIso(event.startDate);
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "biweekly":
      return (
        dow === weekdayOfIso(event.startDate) &&
        diffDaysIso(event.startDate, dateIso) % 14 === 0
      );
    case "monthly":
      return fromIso(event.startDate).getDate() === fromIso(dateIso).getDate();
    case "custom_days":
      return (event.recurDays ?? []).includes(dow);
    default:
      return false;
  }
}

export function eventsOnDate(state: PlannerState, dateIso: string): PlannerEvent[] {
  return state.events
    .filter((e) => occursOn(e, dateIso))
    .sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);
}

export function duration(e: PlannerEvent): number {
  return Math.max(0, e.endTime - e.startTime);
}

/**
 * A short, human description of when an event happens — the thing you'd say
 * out loud. Used in list rows and the editor's live preview.
 */
export function recurrenceSummary(e: PlannerEvent): string {
  switch (e.recurrence) {
    case "none":
      return `Once: ${fmtDateShort(e.startDate)}`;
    case "daily":
      return "Every day";
    case "weekly":
      return `Weekly on ${WEEKDAY_SHORT[weekdayOfIso(e.startDate)]}`;
    case "weekdays":
      return "Every weekday (Mon–Fri)";
    case "biweekly":
      return `Every 2 weeks on ${WEEKDAY_SHORT[weekdayOfIso(e.startDate)]}`;
    case "monthly":
      return `Monthly on the ${ordinal(fromIso(e.startDate).getDate())}`;
    case "custom_days": {
      const days = [...(e.recurDays ?? [])].sort((a, b) => a - b);
      return days.length
        ? `Every ${days.map((d) => WEEKDAY_SHORT[d]).join(", ")}`
        : "Custom days";
    }
    default:
      return "";
  }
}

/* ----------------------------------------------------------------- derive -- */

/**
 * Lanes for side-by-side rendering of blocks that occur on the same date.
 * Greedy first-fit: a block takes the lowest lane whose last block already
 * ended, so a lone 9-5 block stays full width instead of getting squeezed
 * because something else that day happens to collide.
 */
export function layoutForDate(
  state: PlannerState,
  dateIso: string,
): Array<{ event: PlannerEvent; lane: number; lanes: number }> {
  const list = eventsOnDate(state, dateIso);
  const laneEnds: number[] = [];
  const placed = list.map((event) => {
    let lane = laneEnds.findIndex((end) => end <= event.startTime);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(event.endTime);
    } else {
      laneEnds[lane] = event.endTime;
    }
    return { event, lane };
  });

  return placed.map((p) => {
    const cluster = placed.filter(
      (q) => q.event.endTime > p.event.startTime && p.event.endTime > q.event.startTime,
    );
    return { ...p, lanes: Math.max(1, ...cluster.map((q) => q.lane + 1)) };
  });
}

/** How many days out to look for time collisions. A diagnostic nudge, not a
 *  hard limit, so it only needs to cover "the near future", not forever. */
const CONFLICT_LOOKAHEAD_DAYS = 60;

/**
 * Ids of blocks that collide in time with another block on some real date in
 * the lookahead window. Checking actual occurrences (rather than reasoning
 * about recurrence rules pairwise) is what lets a one-time event, a monthly
 * one, and a weekly one all be compared on equal footing.
 */
export function conflictIds(state: PlannerState, fromDateIso: string = todayIso()): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < CONFLICT_LOOKAHEAD_DAYS; i++) {
    const dateIso = addDaysIso(fromDateIso, i);
    const list = eventsOnDate(state, dateIso);
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        if (list[a].endTime > list[b].startTime && list[b].endTime > list[a].startTime) {
          out.add(list[a].id);
          out.add(list[b].id);
        }
      }
    }
  }
  return out;
}

/** How many times a week an event's recurrence lands, on average. A "does
 *  not repeat" event contributes nothing to a per-week rate — it is a single
 *  occurrence, not a commitment to size a week around. */
function weeklyRate(e: PlannerEvent): number {
  switch (e.recurrence) {
    case "none":
      return 0;
    case "daily":
      return 7;
    case "weekly":
      return 1;
    case "weekdays":
      return 5;
    case "biweekly":
      return 0.5;
    case "monthly":
      return 7 / 30.44;
    case "custom_days":
      return (e.recurDays ?? []).length;
    default:
      return 0;
  }
}

export type WeeklyTotals = {
  /** Average scheduled minutes per week, across every recurring block. */
  total: number;
  byCategory: Map<PlannerCategory, number>;
  reportable: number;
  events: number;
  conflicts: number;
};

/**
 * Average weekly minutes, by category and overall. "Average" because a real
 * calendar mixes weekly, biweekly, and monthly commitments, and there is no
 * longer one single "the week" to sum — this is deliberately the same shape
 * DashboardOverview and HomeSnapshot already read, just computed from real
 * recurrence instead of a single repeating week.
 */
export function weeklyTotals(state: PlannerState): WeeklyTotals {
  const byCategory = new Map<PlannerCategory, number>();
  let total = 0;
  for (const e of state.events) {
    const rate = weeklyRate(e);
    if (rate <= 0) continue;
    const minutesPerWeek = duration(e) * rate;
    total += minutesPerWeek;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + minutesPerWeek);
  }
  const reportable = REPORTABLE.reduce((n, k) => n + (byCategory.get(k) ?? 0), 0);

  return {
    total,
    byCategory,
    reportable,
    events: state.events.length,
    conflicts: conflictIds(state).size,
  };
}

export function categoryLabel(key: PlannerCategory): string {
  return PLANNER_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/* ---------------------------------------------------------------- mutate -- */

export function blankEvent(dateIso: string = todayIso(), start = 9 * 60): PlannerEvent {
  return {
    id: createId(),
    title: "",
    category: "class",
    location: "",
    notes: "",
    startDate: dateIso,
    endDate: undefined,
    startTime: start,
    endTime: start + 60,
    recurrence: "weekly",
    recurDays: undefined,
  };
}

/* --------------------------------------------------------------- storage -- */

const VALID_CATEGORIES = new Set(PLANNER_CATEGORIES.map((c) => c.key as string));
const VALID_RECURRENCE = new Set(RECURRENCE_TYPES.map((r) => r.key as string));

/** Finds the most recent date on/before `ref` that falls on `day` (0-6). Used
 *  only to migrate a pre-Phase-3 weekday block into a real anchor date. */
function mostRecentOrSameWeekday(day: number, ref: string): string {
  const refDow = weekdayOfIso(ref);
  const back = (refDow - day + 7) % 7;
  return addDaysIso(ref, -back);
}

function clampMin(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1440, Math.max(0, n));
}

function normalize(raw: unknown): PlannerState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const rawEvents: unknown[] = Array.isArray(r.events) ? r.events : [];
  const today = todayIso();

  const events: PlannerEvent[] = rawEvents
    .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
    .map((e): PlannerEvent => {
      const id = typeof e.id === "string" && e.id ? e.id : createId();
      const title = typeof e.title === "string" ? e.title : "";
      const category = VALID_CATEGORIES.has(e.category as string)
        ? (e.category as PlannerCategory)
        : "personal";
      const location = typeof e.location === "string" ? e.location : "";
      const notes = typeof e.notes === "string" ? e.notes : "";

      // Current shape already has a real anchor date.
      if (isIsoDate(e.startDate)) {
        return {
          id,
          title,
          category,
          location,
          notes,
          startDate: e.startDate,
          endDate: isIsoDate(e.endDate) ? e.endDate : undefined,
          startTime: clampMin(e.startTime, 9 * 60),
          endTime: clampMin(e.endTime, 10 * 60),
          recurrence: VALID_RECURRENCE.has(e.recurrence as string)
            ? (e.recurrence as RecurrenceType)
            : "none",
          recurDays: Array.isArray(e.recurDays)
            ? e.recurDays.filter(
                (d): d is number => Number.isInteger(d) && d >= 0 && d <= 6,
              )
            : undefined,
        };
      }

      // Pre-Phase-3 shape: a weekday (0-6) plus start/end minutes, implicitly
      // repeating every week forever. Anchoring it at the most recent (or
      // today's) occurrence of that weekday keeps it repeating exactly as
      // before — nothing about a saved week is lost in the upgrade.
      const day =
        Number.isInteger(e.day) && (e.day as number) >= 0 && (e.day as number) <= 6
          ? (e.day as number)
          : 1;
      return {
        id,
        title,
        category,
        location,
        notes,
        startDate: mostRecentOrSameWeekday(day, today),
        endDate: undefined,
        startTime: clampMin(e.start, 9 * 60),
        endTime: clampMin(e.end, 10 * 60),
        recurrence: "weekly",
        recurDays: undefined,
      };
    })
    // A zero or negative-length block can only come from corrupt data, and
    // rendering one produces an invisible, unclickable element.
    .map((e) => (e.endTime <= e.startTime ? { ...e, endTime: e.startTime + 30 } : e));

  return {
    version: 2,
    dayStart: clampMin(r.dayStart, 7 * 60),
    dayEnd: clampMin(r.dayEnd, 22 * 60),
    events,
  };
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

/* --------------------------------------------------------------- export -- */

/**
 * The planner as a plain table, soonest-first. Shared by the CSV export and
 * the .xlsx export so "what a row looks like" is defined exactly once.
 */
export function plannerExportTable(state: PlannerState): ExportTable {
  const headers = [
    "Title",
    "Category",
    "First date",
    "Start time",
    "End time",
    "Duration",
    "Repeats",
    "Ends by",
    "Location",
    "Notes",
  ];
  const rows = [...state.events]
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.startTime - b.startTime)
    .map((e) => [
      e.title,
      categoryLabel(e.category),
      fmtDateShort(e.startDate),
      fmtTime(e.startTime),
      fmtTime(e.endTime),
      `${(duration(e) / 60).toFixed(2)}h`,
      recurrenceSummary(e),
      e.endDate ? fmtDateShort(e.endDate) : "",
      e.location ?? "",
      e.notes ?? "",
    ]);
  return { headers, rows };
}

/**
 * Average weekly hours by category — the "Hours" sheet in the "export
 * everything" workbook. This is the planner's own weekly-totals view
 * ({@link weeklyTotals}) as a table, not a second copy of the raw schedule
 * ({@link plannerExportTable} already covers that at the event level).
 */
export function hoursExportTable(state: PlannerState): ExportTable {
  const headers = ["Category", "Avg hours/week", "Reportable on application"];
  const totals = weeklyTotals(state);
  const rows = PLANNER_CATEGORIES.map((c) => {
    const minutes = totals.byCategory.get(c.key) ?? 0;
    return [
      c.label,
      (minutes / 60).toFixed(2),
      REPORTABLE.includes(c.key) ? "Yes" : "No",
    ];
  }).filter((_, i) => (totals.byCategory.get(PLANNER_CATEGORIES[i].key) ?? 0) > 0);

  rows.push(["Total", (totals.total / 60).toFixed(2), ""]);
  rows.push(["Reportable total", (totals.reportable / 60).toFixed(2), ""]);

  return { headers, rows };
}

/** CSV form of {@link plannerExportTable}, for anyone who wants raw text over
 *  a real workbook (the "Export spreadsheet" button uses .xlsx instead). */
export function plannerToCsv(state: PlannerState): string {
  const { headers, rows } = plannerExportTable(state);
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

/**
 * iCalendar (.ics) export — the honest version of "connect Google Calendar"
 * that does not require an OAuth app we have not registered. Any calendar
 * app (Google, Apple, Outlook) can import this file directly, recurrence
 * rule included. Live two-way syncing is a real future feature, not this one.
 *
 * Times are written as floating local time (no timezone offset or Z suffix),
 * which every mainstream calendar app reads as "the device's local time" —
 * correct for the common case of a single applicant on one timezone, and far
 * simpler than shipping a full VTIMEZONE block for one.
 */
function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function icsDate(dateIso: string, minutes: number): string {
  const [y, m, d] = dateIso.split("-");
  const hh = pad2(Math.floor(minutes / 60));
  const mm = pad2(minutes % 60);
  return `${y}${m}${d}T${hh}${mm}00`;
}

function icsNowStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(
    d.getUTCHours(),
  )}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}

function icsRRule(e: PlannerEvent): string | null {
  const until = e.endDate ? `;UNTIL=${e.endDate.replace(/-/g, "")}T235959` : "";
  switch (e.recurrence) {
    case "none":
      return null;
    case "daily":
      return `RRULE:FREQ=DAILY${until}`;
    case "weekly":
      return `RRULE:FREQ=WEEKLY${until}`;
    case "weekdays":
      return `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR${until}`;
    case "biweekly":
      return `RRULE:FREQ=WEEKLY;INTERVAL=2${until}`;
    case "monthly":
      return `RRULE:FREQ=MONTHLY${until}`;
    case "custom_days": {
      const map = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const days = [...(e.recurDays ?? [])].sort((a, b) => a - b).map((d) => map[d]);
      return days.length ? `RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}${until}` : null;
    }
    default:
      return null;
  }
}

export function icsForEvents(events: PlannerEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MD Atlas//Planner//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@mdatlas.app`,
      `DTSTAMP:${icsNowStamp()}`,
      `DTSTART:${icsDate(e.startDate, e.startTime)}`,
      `DTEND:${icsDate(e.startDate, e.endTime)}`,
    );
    const rrule = icsRRule(e);
    if (rrule) lines.push(rrule);
    lines.push(`SUMMARY:${icsEscape(e.title || "Untitled")}`);
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.notes) lines.push(`DESCRIPTION:${icsEscape(e.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
