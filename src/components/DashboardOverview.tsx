"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { downloadFullWorkbook } from "@/lib/exportWorkbook";
import {
  countEssays,
  daysUntil,
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  interviewTotals,
  rollUpStatus,
  subscribeNever,
  subscribeToTracker,
} from "@/lib/tracker";
import {
  getPrimaryServerSnapshot,
  getPrimarySnapshot,
  primaryTotals,
  subscribeToPrimary,
} from "@/lib/primary";
import {
  getPlannerServerSnapshot,
  getPlannerSnapshot,
  subscribeToPlanner,
  weeklyTotals,
} from "@/lib/planner";
import {
  getPhaseServerSnapshot,
  getPhaseSnapshot,
  PHASES,
  setPhase,
  subscribeToPhase,
  type Phase,
} from "@/lib/dashboardPhase";

/**
 * The hub.
 *
 * Two rules kept this from becoming another wall of cards:
 *
 * 1. Every number on this page is a link to the screen where you can act on it.
 *    A dashboard that only reports is a worse version of the page it summarizes.
 * 2. "Next up" is ordered by what actually goes wrong — a deadline you will
 *    miss outranks a form you have not filled in — and it is empty when nothing
 *    is wrong, rather than padded with encouragement.
 */

const R = 26;
const CIRC = 2 * Math.PI * R;

function Ring({
  value,
  total,
  tone = "accent",
}: {
  value: number;
  total: number;
  tone?: "accent" | "ok" | "warn";
}) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const stroke =
    tone === "ok"
      ? "var(--ok)"
      : tone === "warn"
        ? "var(--warn)"
        : "var(--accent)";
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r={R}
        fill="none"
        stroke="var(--surface-sunken)"
        strokeWidth="7"
      />
      <circle
        cx="32"
        cy="32"
        r={R}
        fill="none"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - pct)}
        className="anim-ring"
        style={{ ["--dash-total" as string]: `${CIRC}` }}
      />
    </svg>
  );
}

function StageCard({
  href,
  eyebrow,
  headline,
  detail,
  value,
  total,
  tone,
  index,
}: {
  href: string;
  eyebrow: string;
  headline: string;
  detail: string;
  value: number;
  total: number;
  tone?: "accent" | "ok" | "warn";
  index: number;
}) {
  return (
    <Link
      href={href}
      style={{ ["--i" as string]: index }}
      className="lift flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 hover:border-accent/50"
    >
      <Ring value={value} total={total} tone={tone} />
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-widest text-muted">
          {eyebrow}
        </span>
        <span className="mt-1 block text-xl font-semibold tracking-tight">
          {headline}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{detail}</span>
      </span>
    </Link>
  );
}

type Category = "planner" | "primary" | "secondaries" | "interviews";

type Item = {
  href: string;
  label: string;
  hint: string;
  tone: "warn" | "info";
  category: Category;
};

/**
 * Which categories show at all, and which sort ahead of everything else,
 * per phase. Building is the one acceptance criterion given by name — a
 * sophomore's dashboard must not show secondary deadlines — everything past
 * that is the same idea applied consistently: each phase sees the stages
 * that are actually live for someone at that point in the cycle, with the
 * stage that IS their current focus leading the list rather than just being
 * sorted in alongside it.
 */
const PHASE_CATEGORIES: Record<
  Phase,
  { visible: Category[]; leads: Category[] }
> = {
  building: {
    visible: ["planner", "primary"],
    leads: ["primary", "planner"],
  },
  applying: {
    visible: ["planner", "primary", "secondaries"],
    leads: ["primary"],
  },
  secondaries: {
    visible: ["planner", "primary", "secondaries"],
    leads: ["secondaries"],
  },
  interviewing: {
    visible: ["primary", "secondaries", "interviews"],
    leads: ["interviews"],
  },
};

export function DashboardOverview() {
  const tracker = useSyncExternalStore(
    subscribeToTracker,
    getTrackerSnapshot,
    getTrackerServerSnapshot,
  );
  const primary = useSyncExternalStore(
    subscribeToPrimary,
    getPrimarySnapshot,
    getPrimaryServerSnapshot,
  );
  const planner = useSyncExternalStore(
    subscribeToPlanner,
    getPlannerSnapshot,
    getPlannerServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const phase = useSyncExternalStore(
    subscribeToPhase,
    getPhaseSnapshot,
    getPhaseServerSnapshot,
  );
  const [exportFailed, setExportFailed] = useState(false);
  const [choosingPhase, setChoosingPhase] = useState(false);

  async function exportEverything() {
    try {
      setExportFailed(false);
      await downloadFullWorkbook();
    } catch {
      setExportFailed(true);
    }
  }

  if (!hydrated) {
    return (
      <div
        className="rounded-2xl border border-line bg-surface p-10 text-center text-muted"
        aria-live="polite"
      >
        Loading your dashboard…
      </div>
    );
  }

  const pt = primaryTotals(primary);
  const essays = countEssays(tracker.schools);
  const iv = interviewTotals(tracker.schools);
  const wk = weeklyTotals(planner);
  const today = new Date();

  const touched =
    pt.entries > 0 ||
    tracker.schools.length > 0 ||
    planner.events.length > 0;

  /* --------------------------------------------------------- next up ---- */
  const items: Item[] = [];

  // Deadlines first: this is the only category with a hard, external clock.
  for (const s of tracker.schools) {
    const d = daysUntil(s.dueOn, today);
    if (d === null) continue;
    const status = rollUpStatus(s);
    if (status === "submitted") continue;
    if (d < 0) {
      items.push({
        href: "/secondaries",
        label: `${s.name} is past its deadline`,
        hint: `Was due ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ago`,
        tone: "warn",
        category: "secondaries",
      });
    } else if (d <= 10) {
      const openCount = (s.essays ?? []).filter(
        (e) => e.status !== "done" && e.status !== "submitted",
      ).length;
      items.push({
        href: "/secondaries",
        label: `${s.name} is due in ${d} day${d === 1 ? "" : "s"}`,
        hint: `${openCount} ${openCount === 1 ? "essay" : "essays"} still open`,
        tone: d <= 3 ? "warn" : "info",
        category: "secondaries",
      });
    }
  }

  if (iv.thankYouOwed > 0) {
    items.push({
      href: "/interviews",
      label: `${iv.thankYouOwed} thank-you note${iv.thankYouOwed === 1 ? "" : "s"} unsent`,
      hint: "These stop counting after about 48 hours",
      tone: "warn",
      category: "interviews",
    });
  }

  if (pt.missingSupervisor > 0) {
    items.push({
      href: "/primary",
      label: `${pt.missingSupervisor} ${pt.missingSupervisor === 1 ? "activity has" : "activities have"} no verifier contact`,
      hint: "Far easier to get now than the year you apply",
      tone: "info",
      category: "primary",
    });
  }

  if (wk.conflicts > 0) {
    items.push({
      href: "/planner",
      label: `${wk.conflicts} blocks in your week overlap`,
      hint: "Two things booked at the same time",
      tone: "info",
      category: "planner",
    });
  }

  if (iv.invited > 0) {
    items.push({
      href: "/interviews",
      label: `${iv.invited} invite${iv.invited === 1 ? "" : "s"} not scheduled yet`,
      hint: "Dates go fast once they open",
      tone: "warn",
      category: "interviews",
    });
  }

  if (pt.entries > 0 && pt.described < pt.entries) {
    items.push({
      href: "/primary",
      label: `${pt.entries - pt.described} ${pt.entries - pt.described === 1 ? "activity" : "activities"} still ${pt.entries - pt.described === 1 ? "has" : "have"} no description`,
      hint: "700 characters each on AMCAS",
      tone: "info",
      category: "primary",
    });
  }

  items.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "warn" ? -1 : 1));

  // Phase-aware view: only categories live for this phase show at all, and
  // whichever stage IS the phase leads the list ahead of everything else —
  // "secondaries in flight" means the dashboard leads with secondaries, not
  // whatever else happens to have a warn-tone item this week.
  const phaseRules = phase ? PHASE_CATEGORIES[phase] : null;
  const visibleItems = phaseRules
    ? items.filter((it) => phaseRules.visible.includes(it.category))
    : items;
  const rankedItems = phaseRules
    ? [...visibleItems].sort((a, b) => {
        const aLeads = phaseRules.leads.includes(a.category);
        const bLeads = phaseRules.leads.includes(b.category);
        if (aLeads !== bLeads) return aLeads ? -1 : 1;
        return 0; // stable: keep the tone-based order within each group
      })
    : visibleItems;

  /* ------------------------------------------------------------ render -- */

  if (!touched) {
    return (
      <section className="anim-pop rounded-2xl border border-line bg-surface p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Nothing here yet — pick a starting point.
        </h2>
        <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted">
          None of these depend on each other. Fill in whichever one matches
          where you actually are, and the rest stays empty until you need it.
        </p>
        <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
          {[
            {
              href: "/planner",
              t: "Lay out my week",
              d: "Classes, shifts, lab hours",
            },
            {
              href: "/primary",
              t: "Log an activity",
              d: "Hours, dates, who can verify it",
            },
            {
              href: "/secondaries",
              t: "Add my schools",
              d: "Every secondary in one list",
            },
            {
              href: "/prompts",
              t: "Just browse prompts",
              d: "769 across 161 programs",
            },
          ].map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              style={{ ["--i" as string]: i }}
              className="lift rounded-xl border border-line bg-sunken p-4 text-left hover:border-accent/50"
            >
              <span className="block font-semibold tracking-tight">{c.t}</span>
              <span className="mt-0.5 block text-sm text-muted">{c.d}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const activePhase = phase ? PHASES.find((p) => p.key === phase) : null;
  const showPhasePrompt = !phase || choosingPhase;

  return (
    <div className="space-y-8">
      {/* "Where are you right now?" — asked once, changeable any time. This
          is what "next up" filters and leads by, so it comes first: everything
          below it depends on the answer. */}
      <section
        aria-labelledby="phase-heading"
        className={
          showPhasePrompt
            ? "anim-pop rounded-2xl border border-navy-100 bg-accent-soft p-5 sm:p-6"
            : ""
        }
      >
        {showPhasePrompt ? (
          <>
            <h2 id="phase-heading" className="font-semibold">
              Where are you right now?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              This decides what leads below — you can change it any time.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PHASES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setPhase(p.key);
                    setChoosingPhase(false);
                  }}
                  className={`lift rounded-xl border p-3.5 text-left ${
                    phase === p.key
                      ? "border-accent bg-surface"
                      : "border-line bg-surface hover:border-accent/50"
                  }`}
                >
                  <span className="block font-medium">{p.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {p.sub}
                  </span>
                </button>
              ))}
            </div>
            {phase && (
              <button
                type="button"
                onClick={() => setChoosingPhase(false)}
                className="mt-3 text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            Right now:{" "}
            <span className="font-medium text-foreground">
              {activePhase?.label}
            </span>
            <button
              type="button"
              onClick={() => setChoosingPhase(true)}
              className="font-medium text-accent underline underline-offset-2 hover:no-underline"
            >
              Change
            </button>
          </p>
        )}
      </section>

      {/* Next up dominates the page — it is the one thing that should not
          need a click to see. Everything else is detail on a decision this
          list already made for you. */}
      <section aria-labelledby="next-heading">
        <h2
          id="next-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Next up
        </h2>
        {rankedItems.length === 0 ? (
          <p className="anim-rise mt-3 rounded-2xl border border-ok/30 bg-ok-soft p-5 leading-relaxed text-ok">
            Nothing needs you right now. No deadlines inside ten days, no unsent
            thank-you notes, no activities missing a verifier.
          </p>
        ) : (
          <ul className="anim-stagger mt-3 space-y-2.5">
            {rankedItems.slice(0, 7).map((it, i) => (
              <li key={`${it.href}-${it.label}`} style={{ ["--i" as string]: i }}>
                <Link
                  href={it.href}
                  className={`lift flex items-center gap-3.5 rounded-xl border p-4 ${
                    it.tone === "warn"
                      ? "border-warn/30 bg-warn-soft"
                      : "border-line bg-surface"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${it.tone === "warn" ? "bg-warn" : "bg-accent"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-medium ${it.tone === "warn" ? "text-warn" : ""}`}
                    >
                      {it.label}
                    </span>
                    <span
                      className={`block text-sm ${it.tone === "warn" ? "text-warn" : "text-muted"}`}
                    >
                      {it.hint}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 ${it.tone === "warn" ? "text-warn" : "text-muted"}`}
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Everything else: the four-panel view this page used to open with,
          now a click away instead of competing with Next up for attention. */}
      <details className="group rounded-2xl border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="font-semibold tracking-tight">
            Full progress, all four stages
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <div className="anim-stagger grid gap-4 border-t border-line p-5 sm:grid-cols-2">
          <StageCard
            index={0}
            href="/planner"
            eyebrow="Planner"
            headline={
              wk.total > 0 ? `${Math.round(wk.total / 60)} hours/wk booked` : "Nothing scheduled"
            }
            detail={
              wk.reportable > 0
                ? `${Math.round(wk.reportable / 60)} of them count on AMCAS`
                : "Add your classes and shifts"
            }
            value={wk.reportable}
            total={Math.max(wk.total, 1)}
            tone="accent"
          />
          <StageCard
            index={1}
            href="/primary"
            eyebrow="Primary"
            headline={`${pt.entries} of 15 activities`}
            detail={
              pt.entries === 0
                ? "Nothing logged yet"
                : `${pt.described} written · ${Math.round(pt.completed).toLocaleString()} hours`
            }
            value={pt.described}
            total={Math.max(pt.entries, 1)}
            tone={pt.missingSupervisor > 0 ? "warn" : "ok"}
          />
          <StageCard
            index={2}
            href="/secondaries"
            eyebrow="Secondaries"
            headline={
              essays.total > 0
                ? `${essays.done} of ${essays.total} essays done`
                : `${tracker.schools.length} schools`
            }
            detail={
              essays.total > 0
                ? `${essays.remaining} still open`
                : tracker.schools.length > 0
                  ? "No essays added yet"
                  : "Add the schools you applied to"
            }
            value={essays.done}
            total={Math.max(essays.total, 1)}
            tone={essays.total > 0 && essays.remaining === 0 ? "ok" : "accent"}
          />
          <StageCard
            index={3}
            href="/interviews"
            eyebrow="Interviews"
            headline={iv.total > 0 ? `${iv.total} in flight` : "No invites yet"}
            detail={
              iv.total > 0
                ? `${iv.completed} done · ${iv.scheduled} scheduled · ${iv.invited} to book`
                : "They start arriving in the fall"
            }
            value={iv.completed}
            total={Math.max(iv.total, 1)}
            tone={iv.thankYouOwed > 0 ? "warn" : "accent"}
          />
        </div>
      </details>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            <span className="block font-semibold tracking-tight">
              Export everything
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              Activities, hours, schools, secondaries, essays, interviews, and
              letters — one workbook, one download.
            </span>
          </span>
          <button
            type="button"
            onClick={exportEverything}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Download .xlsx
          </button>
        </div>
        {exportFailed && (
          <p className="mt-3 text-sm text-danger">
            Could not build the workbook. Try again, or export each page
            individually from Secondaries and Planner.
          </p>
        )}
      </section>
    </div>
  );
}
