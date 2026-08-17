"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  DAYS,
  PLANNER_CATEGORIES,
  REPORTABLE,
  blankEvent,
  categoryLabel,
  conflictIds,
  duration,
  eventsForDay,
  fmtDuration,
  fmtTime,
  fromTimeInput,
  getPlannerServerSnapshot,
  getPlannerSnapshot,
  layoutDay,
  plannerToCsv,
  toTimeInput,
  updatePlanner,
  weeklyTotals,
  type PlannerCategory,
  type PlannerEvent,
} from "@/lib/planner";
import { subscribeToPlanner } from "@/lib/planner";
import { subscribeNever } from "@/lib/tracker";

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

export function PlannerBoard() {
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

  const [draft, setDraft] = useState<PlannerEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => weeklyTotals(state), [state]);
  const conflicts = useMemo(() => conflictIds(state), [state]);

  const firstHour = Math.floor(state.dayStart / 60);
  const lastHour = Math.ceil(state.dayEnd / 60);
  const hours = useMemo(
    () => Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i),
    [firstHour, lastHour],
  );
  const gridHeight = (lastHour - firstHour) * HOUR;

  const openNew = useCallback(
    (day: number, start: number) => {
      const snapped = Math.round(start / 15) * 15;
      setDraft(blankEvent(day, Math.max(0, Math.min(23 * 60, snapped))));
      setIsNew(true);
    },
    [],
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
      end: draft.end > draft.start ? draft.end : draft.start + 30,
    };
    updatePlanner((s) => ({
      ...s,
      events: s.events.some((e) => e.id === clean.id)
        ? s.events.map((e) => (e.id === clean.id ? clean : e))
        : [...s.events, clean],
      // Keep the visible window wide enough to actually contain the block the
      // user just saved, or it silently vanishes off the top or bottom.
      dayStart: Math.min(s.dayStart, Math.floor(clean.start / 60) * 60),
      dayEnd: Math.max(s.dayEnd, Math.ceil(clean.end / 60) * 60),
    }));
    setDraft(null);
  }, [draft]);

  const remove = useCallback((id: string) => {
    updatePlanner((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    setDraft(null);
  }, []);

  const exportCsv = useCallback(() => {
    const blob = new Blob([plannerToCsv(state)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "md-atlas-week.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  /** Turn a click anywhere in a day column into a start time. */
  const onColumnClick = (day: number) => (ev: React.MouseEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget) return; // a block was clicked, not the column
    const rect = ev.currentTarget.getBoundingClientRect();
    const mins = firstHour * 60 + (ev.clientY - rect.top) / PPM;
    openNew(day, mins);
  };

  if (!hydrated) {
    return (
      <div
        className="rounded-2xl border border-line bg-surface p-8 text-center text-muted"
        aria-live="polite"
      >
        Loading your week…
      </div>
    );
  }

  const empty = state.events.length === 0;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- summary bar -- */}
      <section
        aria-label="Week at a glance"
        className="anim-rise grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat
          label="Scheduled"
          value={hoursLabel(totals.total)}
          detail={`${totals.events} block${totals.events === 1 ? "" : "s"}`}
        />
        <Stat
          label="Application hours"
          value={hoursLabel(totals.reportable)}
          detail="Clinical, research, service, work, leadership"
          accent
        />
        <Stat
          label="Busiest day"
          value={
            totals.busiest && totals.busiest.minutes > 0
              ? DAYS[totals.busiest.day].short
              : "—"
          }
          detail={
            totals.busiest && totals.busiest.minutes > 0
              ? hoursLabel(totals.busiest.minutes)
              : "Nothing scheduled yet"
          }
        />
        <Stat
          label="Double-booked"
          value={String(totals.conflicts)}
          detail={
            totals.conflicts > 0
              ? "Blocks that overlap"
              : "Nothing collides"
          }
          warn={totals.conflicts > 0}
        />
      </section>

      {/* ------------------------------------------------------- controls -- */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openNew(1, 9 * 60)}
          className="lift rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          + Add to my week
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={empty}
          className="rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          Export CSV
        </button>
        <p className="ml-auto text-sm text-muted">
          Click any empty spot on the grid to add something there.
        </p>
      </div>

      {empty && (
        <section className="anim-pop rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            Your week is empty.
          </h2>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted">
            Put your recurring commitments in once — lectures, shifts, lab
            hours, standing meetings. The planner totals them every week, and
            those totals are the hours your application asks for later.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {(["class", "clinical", "research", "volunteer"] as const).map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const e = blankEvent(1, 9 * 60);
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

      {/* ----------------------------------------------- the week (desktop) */}
      <section
        aria-label="Weekly calendar"
        className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block"
      >
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-sunken">
          <div />
          {DAYS.map((d) => {
            const mins = eventsForDay(state, d.key).reduce(
              (n, e) => n + duration(e),
              0,
            );
            return (
              <div
                key={d.key}
                className="border-l border-line px-2 py-2.5 text-center"
              >
                <span className="block text-sm font-semibold tracking-tight">
                  {d.short}
                </span>
                <span className="block text-xs tabular-nums text-muted">
                  {mins > 0 ? hoursLabel(mins) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]"
        >
          {/* time gutter */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                /* Every hour gets a label, including the first. Centering it on
                   its line would clip it against the day header, so the top one
                   hangs just below instead of straddling. */
                className={`absolute right-2 text-xs tabular-nums text-muted ${
                  i === 0 ? "translate-y-0.5" : "-translate-y-1/2"
                }`}
                style={{ top: i * HOUR }}
              >
                {fmtTime(h * 60).replace(":00", "")}
              </div>
            ))}
          </div>

          {DAYS.map((d) => {
            const laid = layoutDay(state, d.key);
            return (
              <div
                key={d.key}
                onClick={onColumnClick(d.key)}
                className="relative border-l border-line"
                style={{ height: gridHeight }}
              >
                {/* hour lines, pointer-events-none so clicks reach the column */}
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-line/70"
                    style={{ top: i * HOUR }}
                  />
                ))}

                {laid.map(({ event, lane, lanes }, idx) => {
                  const top = (event.start - firstHour * 60) * PPM;
                  const h = Math.max(18, duration(event) * PPM - 2);
                  const clash = conflicts.has(event.id);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openExisting(event)}
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
                          {fmtTime(event.start)}
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

      {/* ------------------------------------------------ the week (mobile) */}
      <section aria-label="Weekly schedule by day" className="space-y-3 md:hidden">
        {DAYS.map((d, i) => {
          const list = eventsForDay(state, d.key);
          const mins = list.reduce((n, e) => n + duration(e), 0);
          return (
            <div
              key={d.key}
              className="anim-rise overflow-hidden rounded-2xl border border-line bg-surface"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between border-b border-line bg-sunken px-4 py-2.5">
                <h3 className="text-sm font-semibold tracking-tight">{d.long}</h3>
                <span className="text-xs tabular-nums text-muted">
                  {mins > 0 ? hoursLabel(mins) : "Free"}
                </span>
              </div>
              {list.length === 0 ? (
                <button
                  type="button"
                  onClick={() => openNew(d.key, 9 * 60)}
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
                        onClick={() => openExisting(e)}
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
                            {fmtTime(e.start)} – {fmtTime(e.end)} ·{" "}
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
                Where your week goes
              </h2>
              <p className="mt-1 text-sm text-muted">
                Per week, if you do everything you have scheduled.
              </p>
            </div>
            <Link
              href="/primary"
              className="link-sweep text-sm font-medium text-accent"
            >
              Log these hours on your application &rarr;
            </Link>
          </div>

          {/* One proportional bar rather than a chart: the only question here
              is "how is my week split", and a stacked bar answers it faster. */}
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

      {/* ----------------------------------------------------------- editor */}
      {draft && (
        <EventEditor
          draft={draft}
          isNew={isNew}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setDraft(null)}
          onDelete={() => remove(draft.id)}
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

function EventEditor({
  draft,
  isNew,
  onChange,
  onSave,
  onCancel,
  onDelete,
}: {
  draft: PlannerEvent;
  isNew: boolean;
  onChange: (e: PlannerEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof PlannerEvent>(k: K, v: PlannerEvent[K]) =>
    onChange({ ...draft, [k]: v });

  const invalid = draft.end <= draft.start;

  return (
    /* Not a <dialog>: this sits inline under the grid so the week stays visible
       while you edit, which is the whole point of editing a schedule. */
    <section
      aria-label={isNew ? "Add to your week" : "Edit block"}
      className="anim-rise sticky bottom-4 z-10 rounded-2xl border border-accent/30 bg-surface p-5 shadow-[0_12px_40px_-16px_rgb(10_28_61/0.4)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {isNew ? "Add to your week" : "Edit block"}
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
            placeholder="Orgo II lecture, ED scribe shift, Dr. Patel's lab"
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium">Day</span>
          <select
            value={draft.day}
            onChange={(e) => set("day", Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          >
            {DAYS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.long}
              </option>
            ))}
          </select>
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
                {c.label} — {c.hint}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-medium">Starts</span>
          <input
            type="time"
            step={300}
            value={toTimeInput(draft.start)}
            onChange={(e) => {
              const m = fromTimeInput(e.target.value);
              if (m === null) return;
              // Drag the end along so the block keeps its length instead of
              // silently inverting when you push the start past the end.
              const len = Math.max(15, draft.end - draft.start);
              onChange({ ...draft, start: m, end: m + len });
            }}
            className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 focus:border-accent focus:outline-none"
          />
        </label>

        <label>
          <span className="text-sm font-medium">Ends</span>
          <input
            type="time"
            step={300}
            value={toTimeInput(draft.end)}
            onChange={(e) => {
              const m = fromTimeInput(e.target.value);
              if (m !== null) set("end", m);
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
            {fmtDuration(draft.end - draft.start)} ·{" "}
            {categoryLabel(draft.category)}
          </p>
        )}
      </div>
    </section>
  );
}
