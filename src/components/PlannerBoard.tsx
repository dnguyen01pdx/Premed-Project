"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  DAYS,
  PLANNER_CATEGORIES,
  RECURRENCE_TYPES,
  REPORTABLE,
  addDaysIso,
  blankEvent,
  categoryLabel,
  conflictIds,
  duration,
  eventsOnDate,
  fmtDateShort,
  fmtDuration,
  fmtTime,
  fromIso,
  fromTimeInput,
  getPlannerServerSnapshot,
  getPlannerSnapshot,
  icsForEvents,
  layoutForDate,
  monthGridDates,
  plannerExportTable,
  recurrenceSummary,
  todayIso,
  toTimeInput,
  updatePlanner,
  weekDates,
  weekdayOfIso,
  weeklyTotals,
  type PlannerCategory,
  type PlannerEvent,
  type RecurrenceType,
} from "@/lib/planner";
import { subscribeToPlanner } from "@/lib/planner";
import { subscribeNever } from "@/lib/tracker";
import { downloadXlsx } from "@/lib/xlsxExport";

/** One hour of grid height, in pixels. Everything else is derived from this. */
const HOUR = 56;
const PPM = HOUR / 60;

const CAT_CLASS: Record<PlannerCategory, string> = {
  class: "bg-cat-class-soft text-cat-class border-cat-class/25",
  study: "bg-cat-study-soft text-cat-study border-cat-study/25",
  clinical: "bg-cat-clinical-soft text-cat-clinical border-cat-clinical/25",
  research: "bg-cat-research-soft text-cat-research border-cat-research/25",
  volunteer: "bg-cat-volunteer-soft text-cat-volunteer border-cat-volunteer/25",
  work: "bg-cat-work-soft text-cat-work border-cat-work/25",
  leadership:
    "bg-cat-leadership-soft text-cat-leadership border-cat-leadership/25",
  application:
    "bg-cat-application-soft text-cat-application border-cat-application/25",
  personal: "bg-cat-personal-soft text-cat-personal border-cat-personal/25",
};

const CAT_DOT: Record<PlannerCategory, string> = {
  class: "bg-cat-class",
  study: "bg-cat-study",
  clinical: "bg-cat-clinical",
  research: "bg-cat-research",
  volunteer: "bg-cat-volunteer",
  work: "bg-cat-work",
  leadership: "bg-cat-leadership",
  application: "bg-cat-application",
  personal: "bg-cat-personal",
};

function hoursLabel(mins: number) {
  const h = mins / 60;
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

function downloadFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ViewMode = "week" | "month" | "year";

/**
 * Planner and Primary stay usable with no account at all, unlike Secondaries
 * and Interviews — but "no account, no limit, ever" also means someone can
 * build out a real semester's worth of blocks in a browser that backs up to
 * nothing. Six is enough to actually feel the product work (a full day's
 * categories, easily) before it asks for an email. Existing blocks are never
 * touched by this — the cap only stops a signed-out visitor from adding a
 * seventh, and editing or deleting what is already there always works.
 */
const ANON_EVENT_LIMIT = 6;

export function PlannerBoard({ signedIn = false }: { signedIn?: boolean }) {
  const state = useSyncExternalStore(
    subscribeToPlanner,
    getPlannerSnapshot,
    getPlannerServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(todayIso);
  const [draft, setDraft] = useState<PlannerEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportFailed, setExportFailed] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const totals = useMemo(() => weeklyTotals(state), [state]);
  const conflicts = useMemo(() => conflictIds(state), [state]);
  const thisWeekMinutes = useMemo(() => {
    return weekDates(todayIso()).reduce(
      (sum, d) => sum + eventsOnDate(state, d).reduce((n, e) => n + duration(e), 0),
      0,
    );
  }, [state]);

  const openNew = useCallback(
    (dateIso: string, start: number) => {
      if (!signedIn && state.events.length >= ANON_EVENT_LIMIT) {
        setLimitHit(true);
        return;
      }
      setLimitHit(false);
      const snapped = Math.round(start / 15) * 15;
      setDraft(blankEvent(dateIso, Math.max(0, Math.min(23 * 60, snapped))));
      setIsNew(true);
    },
    [signedIn, state.events.length],
  );

  const openExisting = useCallback((e: PlannerEvent) => {
    setDraft({ ...e });
    setIsNew(false);
  }, []);

  const save = useCallback(() => {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) return;
    const clean: PlannerEvent = {
      ...draft,
      title,
      endTime: draft.endTime > draft.startTime ? draft.endTime : draft.startTime + 30,
      recurDays:
        draft.recurrence === "custom_days" ? draft.recurDays ?? [] : undefined,
      endDate: draft.recurrence === "none" ? undefined : draft.endDate,
    };
    updatePlanner((s) => ({
      ...s,
      events: s.events.some((e) => e.id === clean.id)
        ? s.events.map((e) => (e.id === clean.id ? clean : e))
        : [...s.events, clean],
      dayStart: Math.min(s.dayStart, Math.floor(clean.startTime / 60) * 60),
      dayEnd: Math.max(s.dayEnd, Math.ceil(clean.endTime / 60) * 60),
    }));
    setDraft(null);
  }, [draft]);

  const remove = useCallback((id: string) => {
    updatePlanner((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    setSelected((s) => {
      if (!s.has(id)) return s;
      const next = new Set(s);
      next.delete(id);
      return next;
    });
    setDraft(null);
  }, []);

  const exportSpreadsheet = useCallback(() => {
    const { headers, rows } = plannerExportTable(state);
    setExportFailed(false);
    downloadXlsx(
      "md-atlas-planner.xlsx",
      "Planner",
      headers.map((header) => ({ header })),
      rows,
    ).catch(() => setExportFailed(true));
  }, [state]);

  const exportAllIcs = useCallback(() => {
    downloadFile("md-atlas-planner.ics", icsForEvents(state.events), "text/calendar");
  }, [state]);

  const exportSelectedIcs = useCallback(() => {
    const events = state.events.filter((e) => selected.has(e.id));
    if (!events.length) return;
    downloadFile(
      events.length === 1
        ? `md-atlas-${events[0].title.trim().slice(0, 40) || "event"}.ics`
        : "md-atlas-selected.ics",
      icsForEvents(events),
      "text/calendar",
    );
  }, [state, selected]);

  const toggleSelected = useCallback((id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const goToday = useCallback(() => setAnchor(todayIso()), []);
  const goBy = useCallback(
    (dir: 1 | -1) => {
      setAnchor((a) => {
        if (view === "week") return addDaysIso(a, dir * 7);
        if (view === "year") {
          return `${Number(a.slice(0, 4)) + dir}${a.slice(4)}`;
        }
        // month
        const [y, m, day] = a.split("-").map(Number);
        const d = new Date(y, m - 1 + dir, Math.min(day, 28));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`;
      });
    },
    [view],
  );

  if (!hydrated) {
    return (
      <div
        className="rounded-2xl border border-line bg-surface p-8 text-center text-muted"
        aria-live="polite"
      >
        Loading your calendar…
      </div>
    );
  }

  const empty = state.events.length === 0;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- summary bar -- */}
      <section
        aria-label="Planner at a glance"
        className="anim-rise grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat
          label="Scheduled (avg/wk)"
          value={hoursLabel(totals.total)}
          detail={`${totals.events} saved block${totals.events === 1 ? "" : "s"}`}
        />
        <Stat
          label="This week"
          value={hoursLabel(thisWeekMinutes)}
          detail="Actually on the calendar"
        />
        <Stat
          label="Application hours (avg/wk)"
          value={hoursLabel(totals.reportable)}
          detail="Clinical, research, service, work, leadership"
          accent
        />
        <Stat
          label="Double-booked"
          value={String(totals.conflicts)}
          detail={totals.conflicts > 0 ? "Blocks that overlap" : "Nothing collides"}
          warn={totals.conflicts > 0}
        />
      </section>

      {/* ------------------------------------------------------- controls -- */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openNew(anchor, 9 * 60)}
          className="lift rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          + Add to my calendar
        </button>
        <button
          type="button"
          onClick={exportAllIcs}
          disabled={empty}
          className="rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          Export all to calendar (.ics)
        </button>
        <button
          type="button"
          onClick={exportSpreadsheet}
          disabled={empty}
          className="rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          Export spreadsheet
        </button>
      </div>
      {exportFailed && (
        <p className="text-sm text-danger">
          Could not build the spreadsheet. Try again in a moment.
        </p>
      )}

      {limitHit && !signedIn && (
        <section className="anim-pop flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-accent-soft px-5 py-3.5">
          <p className="text-sm leading-relaxed">
            You&apos;ve saved {ANON_EVENT_LIMIT} blocks in this browser, the
            free limit before signing in. Everything you&apos;ve already
            added is safe and still yours to edit.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="whitespace-nowrap rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              Sign in to add more
            </Link>
            <button
              type="button"
              onClick={() => setLimitHit(false)}
              className="text-sm text-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {empty && (
        <section className="anim-pop rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            Your calendar is empty.
          </h2>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted">
            Add your commitments, recurring or just once. Lectures, shifts,
            lab hours, a one-time MCAT date. The planner totals them, and
            those totals are the hours your application asks for later.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {(["class", "clinical", "research", "volunteer"] as const).map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const e = blankEvent(anchor, 9 * 60);
                    setDraft({ ...e, category: c });
                    setIsNew(true);
                  }}
                  className={`lift rounded-lg border px-3.5 py-2 text-sm font-medium ${CAT_CLASS[c]}`}
                >
                  Add {categoryLabel(c).toLowerCase()}
                </button>
              ),
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ view tabs -- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Calendar view"
          className="flex gap-1 rounded-xl border border-line bg-surface p-1"
        >
          {(
            [
              ["week", "Week"],
              ["month", "Month"],
              ["year", "Year"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                view === key
                  ? "bg-navy-900 text-white"
                  : "text-muted hover:bg-accent-soft hover:text-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goBy(-1)}
            aria-label="Previous"
            className="rounded-lg border border-line-strong px-2.5 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goBy(1)}
            aria-label="Next"
            className="rounded-lg border border-line-strong px-2.5 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            &rarr;
          </button>
        </div>
      </div>

      {view === "week" && (
        <WeekView
          state={state}
          anchor={anchor}
          conflicts={conflicts}
          onEmptyClick={openNew}
          onEventClick={openExisting}
        />
      )}
      {view === "month" && (
        <MonthView
          state={state}
          anchor={anchor}
          conflicts={conflicts}
          onDayClick={(d) => openNew(d, 9 * 60)}
          onEventClick={openExisting}
        />
      )}
      {view === "year" && (
        <YearView
          state={state}
          anchor={anchor}
          onPickMonth={(dateIso) => {
            setAnchor(dateIso);
            setView("month");
          }}
        />
      )}

      {/* ------------------------------------------------- hours breakdown -- */}
      {!empty && (
        <section
          aria-labelledby="breakdown-heading"
          className="anim-rise rounded-2xl border border-line bg-surface p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="breakdown-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Where your time goes
              </h2>
              <p className="mt-1 text-sm text-muted">
                Average hours per week, accounting for how often each block
                repeats.
              </p>
            </div>
            <Link
              href="/primary"
              className="link-sweep text-sm font-medium text-accent"
            >
              Log these hours on your application &rarr;
            </Link>
          </div>

          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-sunken">
            {PLANNER_CATEGORIES.map((c) => {
              const m = totals.byCategory.get(c.key) ?? 0;
              if (!m) return null;
              return (
                <div
                  key={c.key}
                  className={CAT_DOT[c.key]}
                  style={{ width: `${(m / totals.total) * 100}%` }}
                  title={`${c.label}: ${hoursLabel(m)}`}
                />
              );
            })}
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLANNER_CATEGORIES.map((c) => {
              const m = totals.byCategory.get(c.key) ?? 0;
              if (!m) return null;
              return (
                <div key={c.key} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${CAT_DOT[c.key]}`}
                  />
                  <dt className="flex-1 text-sm">
                    {c.label}
                    {REPORTABLE.includes(c.key) && (
                      <span className="ml-1.5 text-xs text-muted">
                        · counts on AMCAS
                      </span>
                    )}
                  </dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {hoursLabel(m)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {/* --------------------------------------------- export to calendar -- */}
      {!empty && (
        <CalendarExportPanel
          events={state.events}
          selected={selected}
          onToggle={toggleSelected}
          onSelectAll={() => setSelected(new Set(state.events.map((e) => e.id)))}
          onSelectNone={() => setSelected(new Set())}
          onExportSelected={exportSelectedIcs}
        />
      )}

      {/* ----------------------------------------------------------- editor */}
      {draft && (
        <EventEditor
          draft={draft}
          isNew={isNew}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setDraft(null)}
          onDelete={() => remove(draft.id)}
          onExportIcs={() => downloadFile(
            `md-atlas-${draft.title.trim().slice(0, 40) || "event"}.ics`,
            icsForEvents([draft]),
            "text/calendar",
          )}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ bits -- */

function Stat({
  label,
  value,
  detail,
  accent,
  warn,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        warn
          ? "border-warn/30 bg-warn-soft"
          : accent
            ? "border-navy-100 bg-accent-soft"
            : "border-line bg-surface"
      }`}
    >
      <p
        className={`text-xs font-semibold tracking-widest uppercase ${warn ? "text-warn" : "text-muted"}`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 text-3xl font-semibold tracking-tight tabular-nums ${warn ? "text-warn" : ""}`}
      >
        {value}
      </p>
      <p className={`mt-0.5 text-sm ${warn ? "text-warn" : "text-muted"}`}>
        {detail}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- week view -- */

function WeekView({
  state,
  anchor,
  conflicts,
  onEmptyClick,
  onEventClick,
}: {
  state: ReturnType<typeof getPlannerSnapshot>;
  anchor: string;
  conflicts: Set<string>;
  onEmptyClick: (dateIso: string, startMin: number) => void;
  onEventClick: (e: PlannerEvent) => void;
}) {
  const dates = useMemo(() => weekDates(anchor), [anchor]);
  const today = todayIso();

  const firstHour = Math.floor(state.dayStart / 60);
  const lastHour = Math.ceil(state.dayEnd / 60);
  const hours = useMemo(
    () => Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i),
    [firstHour, lastHour],
  );
  const gridHeight = (lastHour - firstHour) * HOUR;

  const onColumnClick = (dateIso: string) => (ev: React.MouseEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const mins = firstHour * 60 + (ev.clientY - rect.top) / PPM;
    onEmptyClick(dateIso, mins);
  };

  return (
    <>
      <p className="text-sm font-medium text-muted">
        {fmtDateShort(dates[0])} – {fmtDateShort(dates[6])}
      </p>

      {/* desktop */}
      <section
        aria-label="Weekly calendar"
        className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block"
      >
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-sunken">
          <div />
          {dates.map((dateIso) => {
            const mins = eventsOnDate(state, dateIso).reduce(
              (n, e) => n + duration(e),
              0,
            );
            const isToday = dateIso === today;
            return (
              <div
                key={dateIso}
                className={`border-l border-line px-2 py-2.5 text-center ${isToday ? "bg-accent-soft" : ""}`}
              >
                <span className="block text-sm font-semibold tracking-tight">
                  {DAYS[weekdayOfIso(dateIso)].short} {fromIsoDate(dateIso)}
                </span>
                <span className="block text-xs tabular-nums text-muted">
                  {mins > 0 ? hoursLabel(mins) : "0h"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className={`absolute right-2 text-xs tabular-nums text-muted ${
                  i === 0 ? "translate-y-0.5" : "-translate-y-1/2"
                }`}
                style={{ top: i * HOUR }}
              >
                {fmtTime(h * 60).replace(":00", "")}
              </div>
            ))}
          </div>

          {dates.map((dateIso) => {
            const laid = layoutForDate(state, dateIso);
            return (
              <div
                key={dateIso}
                onClick={onColumnClick(dateIso)}
                className="relative border-l border-line"
                style={{ height: gridHeight }}
              >
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-line/70"
                    style={{ top: i * HOUR }}
                  />
                ))}

                {laid.map(({ event, lane, lanes }, idx) => {
                  const top = (event.startTime - firstHour * 60) * PPM;
                  const h = Math.max(18, duration(event) * PPM - 2);
                  const clash = conflicts.has(event.id);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      style={{
                        top,
                        height: h,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                        animationDelay: `${Math.min(idx, 12) * 30}ms`,
                      }}
                      className={`anim-pop lift absolute overflow-hidden rounded-lg border px-2 py-1 text-left ${CAT_CLASS[event.category]} ${clash ? "ring-2 ring-danger/60" : ""}`}
                    >
                      <span className="block truncate text-xs font-semibold leading-tight">
                        {event.title}
                      </span>
                      {h > 34 && (
                        <span className="block truncate text-[11px] leading-tight opacity-80">
                          {fmtTime(event.startTime)}
                          {event.location ? ` · ${event.location}` : ""}
                        </span>
                      )}
                      {clash && <span className="sr-only">Overlaps another block.</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* mobile */}
      <section aria-label="Weekly schedule by day" className="space-y-3 md:hidden">
        {dates.map((dateIso, i) => {
          const list = eventsOnDate(state, dateIso);
          const mins = list.reduce((n, e) => n + duration(e), 0);
          const isToday = dateIso === today;
          return (
            <div
              key={dateIso}
              className="anim-rise overflow-hidden rounded-2xl border border-line bg-surface"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div
                className={`flex items-center justify-between border-b border-line px-4 py-2.5 ${isToday ? "bg-accent-soft" : "bg-sunken"}`}
              >
                <h3 className="text-sm font-semibold tracking-tight">
                  {DAYS[weekdayOfIso(dateIso)].long}, {fmtDateShort(dateIso)}
                </h3>
                <span className="text-xs tabular-nums text-muted">
                  {mins > 0 ? hoursLabel(mins) : "Free"}
                </span>
              </div>
              {list.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onEmptyClick(dateIso, 9 * 60)}
                  className="w-full px-4 py-3 text-left text-sm text-muted"
                >
                  + Add something
                </button>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onEventClick(e)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left"
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CAT_DOT[e.category]}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {e.title}
                          </span>
                          <span className="block text-sm text-muted">
                            {fmtTime(e.startTime)} – {fmtTime(e.endTime)} ·{" "}
                            {categoryLabel(e.category)}
                            {conflicts.has(e.id) ? " · overlaps" : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-muted">
                          {fmtDuration(duration(e))}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}

function fromIsoDate(iso: string): number {
  return Number(iso.slice(8, 10));
}

/* ------------------------------------------------------------ month view -- */

function MonthView({
  state,
  anchor,
  conflicts,
  onDayClick,
  onEventClick,
}: {
  state: ReturnType<typeof getPlannerSnapshot>;
  anchor: string;
  conflicts: Set<string>;
  onDayClick: (dateIso: string) => void;
  onEventClick: (e: PlannerEvent) => void;
}) {
  const [y, m] = anchor.split("-").map(Number);
  const dates = useMemo(() => monthGridDates(y, m - 1), [y, m]);
  const today = todayIso();
  const monthLabel = fromIso(anchor).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const MAX_CHIPS = 3;

  return (
    <section aria-label="Monthly calendar" className="space-y-2">
      <p className="text-sm font-medium text-muted">{monthLabel}</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-sunken">
          {DAYS.map((d) => (
            <div
              key={d.key}
              className="px-2 py-2 text-center text-xs font-semibold tracking-widest text-muted uppercase"
            >
              {d.short}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dates.map((dateIso) => {
            const inMonth = Number(dateIso.slice(5, 7)) === m;
            const list = eventsOnDate(state, dateIso);
            const isToday = dateIso === today;
            return (
              <div
                key={dateIso}
                className={`min-h-[92px] border-b border-l border-line p-1.5 first:border-l-0 sm:min-h-[110px] ${
                  inMonth ? "bg-surface" : "bg-sunken/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onDayClick(dateIso)}
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-navy-900 text-white"
                      : inMonth
                        ? "text-foreground hover:bg-accent-soft hover:text-accent"
                        : "text-muted"
                  }`}
                >
                  {fromIsoDate(dateIso)}
                </button>
                <div className="space-y-1">
                  {list.slice(0, MAX_CHIPS).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onEventClick(e)}
                      className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight ${CAT_CLASS[e.category]} ${conflicts.has(e.id) ? "ring-1 ring-danger/60" : ""}`}
                      title={`${e.title} · ${fmtTime(e.startTime)}`}
                    >
                      {e.title}
                    </button>
                  ))}
                  {list.length > MAX_CHIPS && (
                    <p className="px-1 text-[11px] font-medium text-muted">
                      +{list.length - MAX_CHIPS} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- year view -- */

function YearView({
  state,
  anchor,
  onPickMonth,
}: {
  state: ReturnType<typeof getPlannerSnapshot>;
  anchor: string;
  onPickMonth: (dateIso: string) => void;
}) {
  const year = Number(anchor.slice(0, 4));
  const today = todayIso();

  return (
    <section aria-label="Yearly overview" className="space-y-2">
      <p className="text-sm font-medium text-muted">{year}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }, (_, month) => {
          const dates = monthGridDates(year, month);
          const monthStartIso = `${year}-${String(month + 1).padStart(2, "0")}-01`;
          const label = fromIso(monthStartIso).toLocaleDateString("en-US", {
            month: "long",
          });
          let monthMinutes = 0;
          for (const d of dates) {
            if (Number(d.slice(5, 7)) !== month + 1) continue;
            monthMinutes += eventsOnDate(state, d).reduce((n, e) => n + duration(e), 0);
          }
          return (
            <button
              key={month}
              type="button"
              onClick={() => onPickMonth(monthStartIso)}
              className="lift rounded-2xl border border-line bg-surface p-3 text-left hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight">{label}</h3>
                <span className="text-xs tabular-nums text-muted">
                  {monthMinutes > 0 ? hoursLabel(monthMinutes) : ""}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-0.5">
                {DAYS.map((d) => (
                  <span
                    key={`h-${d.key}`}
                    className="text-center text-[9px] font-medium text-muted"
                  >
                    {d.short[0]}
                  </span>
                ))}
                {dates.map((dateIso) => {
                  const inMonth = Number(dateIso.slice(5, 7)) === month + 1;
                  const has = inMonth && eventsOnDate(state, dateIso).length > 0;
                  const isToday = dateIso === today;
                  return (
                    <span
                      key={dateIso}
                      className={`relative flex h-5 items-center justify-center rounded text-[10px] tabular-nums ${
                        isToday
                          ? "bg-navy-900 font-semibold text-white"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted/50"
                      }`}
                    >
                      {inMonth ? fromIsoDate(dateIso) : ""}
                      {has && !isToday && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent"
                        />
                      )}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------- export section -- */

function CalendarExportPanel({
  events,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
  onExportSelected,
}: {
  events: PlannerEvent[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onExportSelected: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="anim-rise rounded-2xl border border-line bg-surface p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <h2 className="text-lg font-semibold tracking-tight">
            Send to Google Calendar (or any calendar app)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Pick which of your saved blocks to export as a standard .ics
            file. Every calendar app can import one, including Google
            Calendar. Nothing here requires connecting an account, and
            nothing here is required to use the planner.
          </p>
        </span>
        <span className="ml-3 shrink-0 text-sm font-medium text-accent">
          {open ? "Hide" : "Choose events"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onSelectNone}
              className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
            >
              Select none
            </button>
            <button
              type="button"
              onClick={onExportSelected}
              disabled={selected.size === 0}
              className="ml-auto rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              Export {selected.size > 0 ? selected.size : ""} selected (.ics)
            </button>
          </div>

          <ul className="divide-y divide-line rounded-xl border border-line">
            {events.map((e) => (
              <li key={e.id}>
                <label className="flex cursor-pointer items-start gap-3 px-3.5 py-2.5 hover:bg-sunken">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => onToggle(e.id)}
                    className="mt-1 h-4 w-4 rounded border-line-strong"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CAT_DOT[e.category]}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {e.title || "Untitled"}
                    </span>
                    <span className="block text-xs text-muted">
                      {fmtTime(e.startTime)}–{fmtTime(e.endTime)} ·{" "}
                      {recurrenceSummary(e)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- editor */

const WEEKDAY_TOGGLES = DAYS;

function EventEditor({
  draft,
  isNew,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onExportIcs,
}: {
  draft: PlannerEvent;
  isNew: boolean;
  onChange: (e: PlannerEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onExportIcs: () => void;
}) {
  const set = <K extends keyof PlannerEvent>(k: K, v: PlannerEvent[K]) =>
    onChange({ ...draft, [k]: v });

  const invalid = draft.endTime <= draft.startTime;

  const toggleRecurDay = (day: number) => {
    const cur = new Set(draft.recurDays ?? []);
    if (cur.has(day)) cur.delete(day);
    else cur.add(day);
    set("recurDays", [...cur].sort((a, b) => a - b));
  };

  return (
    <section
      aria-label={isNew ? "Add to your calendar" : "Edit block"}
      className="anim-rise sticky bottom-4 z-10 rounded-2xl border border-accent/30 bg-surface p-5 shadow-[0_12px_40px_-16px_rgb(10_28_61/0.4)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {isNew ? "Add to your calendar" : "Edit block"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2.5 py-1 text-sm text-muted hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-medium">What is it?</span>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !invalid) onSave();
              if (e.key === "Escape") onCancel();
            }}
            placeholder="Orgo II lecture, ED scribe shift, Dr. Patel's lab, MCAT test date"
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium">
            {draft.recurrence === "none" ? "Date" : "Starts"}
          </span>
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => e.target.value && set("startDate", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium">Category</span>
          <select
            value={draft.category}
            onChange={(e) => set("category", e.target.value as PlannerCategory)}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          >
            {PLANNER_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} ({c.hint})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-medium">Starts at</span>
          <input
            type="time"
            step={300}
            value={toTimeInput(draft.startTime)}
            onChange={(e) => {
              const m = fromTimeInput(e.target.value);
              if (m === null) return;
              const len = Math.max(15, draft.endTime - draft.startTime);
              onChange({ ...draft, startTime: m, endTime: m + len });
            }}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium">Ends at</span>
          <input
            type="time"
            step={300}
            value={toTimeInput(draft.endTime)}
            onChange={(e) => {
              const m = fromTimeInput(e.target.value);
              if (m !== null) set("endTime", m);
            }}
            aria-invalid={invalid}
            className={`mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 focus:outline-none ${
              invalid
                ? "border-danger focus:border-danger"
                : "border-line-strong focus:border-accent"
            }`}
          />
        </label>

        <label>
          <span className="text-sm font-medium">Repeats</span>
          <select
            value={draft.recurrence}
            onChange={(e) => set("recurrence", e.target.value as RecurrenceType)}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          >
            {RECURRENCE_TYPES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {draft.recurrence !== "none" && (
          <label>
            <span className="text-sm font-medium">
              Repeat until{" "}
              <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              type="date"
              value={draft.endDate ?? ""}
              min={draft.startDate}
              onChange={(e) => set("endDate", e.target.value || undefined)}
              className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
            />
          </label>
        )}

        {draft.recurrence === "custom_days" && (
          <div className="sm:col-span-2">
            <span className="text-sm font-medium">Which days</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WEEKDAY_TOGGLES.map((d) => {
                const active = (draft.recurDays ?? []).includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleRecurDay(d.key)}
                    aria-pressed={active}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line-strong text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label>
          <span className="text-sm font-medium">
            Where <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            value={draft.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Chem 210, Memorial ED"
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium">
            Notes <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            value={draft.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything you want to remember"
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onSave}
          disabled={!draft.title.trim() || invalid}
          className="lift rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isNew ? "Add it" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
        >
          Cancel
        </button>
        {!isNew && (
          <button
            type="button"
            onClick={onExportIcs}
            className="rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            Add to calendar (.ics)
          </button>
        )}
        {!isNew && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            Delete
          </button>
        )}
        {invalid && (
          <p className="w-full text-sm font-medium text-danger">
            The end time has to come after the start time.
          </p>
        )}
        {!invalid && draft.title.trim() && (
          <p className="w-full text-sm text-muted sm:w-auto">
            {fmtDuration(draft.endTime - draft.startTime)} ·{" "}
            {categoryLabel(draft.category)} · {recurrenceSummary(draft)}
          </p>
        )}
      </div>
    </section>
  );
}
