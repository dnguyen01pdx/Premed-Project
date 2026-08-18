"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
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

type Item = {
  href: string;
  label: string;
  hint: string;
  tone: "warn" | "info";
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
      });
    } else if (d <= 10) {
      items.push({
        href: "/secondaries",
        label: `${s.name} is due in ${d} day${d === 1 ? "" : "s"}`,
        hint: `${(s.essays ?? []).filter((e) => e.status !== "done" && e.status !== "submitted").length} essays still open`,
        tone: d <= 3 ? "warn" : "info",
      });
    }
  }

  if (iv.thankYouOwed > 0) {
    items.push({
      href: "/interviews",
      label: `${iv.thankYouOwed} thank-you note${iv.thankYouOwed === 1 ? "" : "s"} unsent`,
      hint: "These stop counting after about 48 hours",
      tone: "warn",
    });
  }

  if (pt.missingSupervisor > 0) {
    items.push({
      href: "/primary",
      label: `${pt.missingSupervisor} ${pt.missingSupervisor === 1 ? "activity has" : "activities have"} no verifier contact`,
      hint: "Far easier to get now than the year you apply",
      tone: "info",
    });
  }

  if (wk.conflicts > 0) {
    items.push({
      href: "/planner",
      label: `${wk.conflicts} blocks in your week overlap`,
      hint: "Two things booked at the same time",
      tone: "info",
    });
  }

  if (iv.invited > 0) {
    items.push({
      href: "/interviews",
      label: `${iv.invited} invite${iv.invited === 1 ? "" : "s"} not scheduled yet`,
      hint: "Dates go fast once they open",
      tone: "warn",
    });
  }

  if (pt.entries > 0 && pt.described < pt.entries) {
    items.push({
      href: "/primary",
      label: `${pt.entries - pt.described} activities still have no description`,
      hint: "700 characters each on AMCAS",
      tone: "info",
    });
  }

  items.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "warn" ? -1 : 1));

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

  return (
    <div className="space-y-8">
      <section
        aria-label="Progress by stage"
        className="anim-stagger grid gap-4 sm:grid-cols-2"
      >
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
      </section>

      <section aria-labelledby="next-heading">
        <h2
          id="next-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Next up
        </h2>
        {items.length === 0 ? (
          <p className="anim-rise mt-3 rounded-2xl border border-ok/30 bg-ok-soft p-5 leading-relaxed text-ok">
            Nothing needs you right now. No deadlines inside ten days, no unsent
            thank-you notes, no activities missing a verifier.
          </p>
        ) : (
          <ul className="anim-stagger mt-3 space-y-2.5">
            {items.slice(0, 7).map((it, i) => (
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
    </div>
  );
}
