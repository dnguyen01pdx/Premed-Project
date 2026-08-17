"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  countEssays,
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  interviewTotals,
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
 * The part that makes this a headquarters rather than a landing page.
 *
 * A returning applicant should not have to re-read the pitch. If they have any
 * data at all, the top of the site becomes their status: what is left in each
 * of the three stages, and one link straight back into whichever stage they
 * are actually living in right now.
 *
 * Renders nothing until hydration and nothing for a first-time visitor, so the
 * marketing copy underneath stays the default and the page never flashes an
 * empty dashboard at someone who has never used it.
 */
export function HomeSnapshot() {
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

  if (!hydrated) return null;

  const pt = primaryTotals(primary);
  const essays = countEssays(tracker.schools);
  const iv = interviewTotals(tracker.schools);
  const wk = weeklyTotals(planner);

  const hasAnything =
    pt.entries > 0 ||
    tracker.schools.length > 0 ||
    iv.total > 0 ||
    wk.events > 0;
  if (!hasAnything) return null;

  // Everything here is a teaser for /dashboard, which does the real triage.
  const stages = [
    {
      href: "/planner",
      label: "This week",
      headline:
        wk.events > 0
          ? `${Math.round(wk.total / 60)} hours booked`
          : "Empty week",
      detail:
        wk.events > 0
          ? `${Math.round(wk.reportable / 60)} count on AMCAS`
          : "Add your classes and shifts",
      urgent: wk.conflicts > 0,
    },
    {
      href: "/primary",
      label: "Primary",
      headline:
        pt.entries > 0
          ? `${pt.entries} ${pt.entries === 1 ? "activity" : "activities"}`
          : "Nothing logged",
      detail:
        pt.entries === 0
          ? "Start logging what you do"
          : pt.missingSupervisor > 0
            ? `${pt.missingSupervisor} missing a verifier contact`
            : `${pt.completed.toLocaleString()} hours logged`,
      urgent: pt.missingSupervisor > 0,
    },
    {
      href: "/secondaries",
      label: "Secondaries",
      headline:
        tracker.schools.length > 0
          ? `${tracker.schools.length} ${tracker.schools.length === 1 ? "school" : "schools"}`
          : "No schools yet",
      detail:
        essays.total > 0
          ? `${essays.remaining} of ${essays.total} essays left`
          : tracker.schools.length > 0
            ? "No essays added yet"
            : "Add the schools you applied to",
      urgent: essays.remaining > 0,
    },
    {
      href: "/interviews",
      label: "Interviews",
      headline:
        iv.total > 0 ? `${iv.total} in flight` : "No invites yet",
      detail:
        iv.thankYouOwed > 0
          ? `${iv.thankYouOwed} thank-you note${iv.thankYouOwed === 1 ? "" : "s"} owed`
          : iv.scheduled > 0
            ? `${iv.scheduled} scheduled`
            : iv.total > 0
              ? `${iv.accepted} accepted`
              : "They start arriving in the fall",
      urgent: iv.thankYouOwed > 0,
    },
  ];

  return (
    <section
      aria-labelledby="snapshot-heading"
      className="-mx-5 -mt-10 bg-navy-900 px-5 py-10 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-10 sm:py-12"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="snapshot-heading"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Where you are
          </h2>
          <p className="mt-1.5 text-sm text-navy-100">
            Picked up from this browser. Nothing here was sent anywhere.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="lift rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-navy-100"
        >
          Open my dashboard
        </Link>
      </div>

      <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((s, i) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className="block h-full rounded-2xl border border-white/15 bg-white/5 p-5 transition-colors hover:border-white/40 hover:bg-white/10"
            >
              <span className="text-xs font-semibold tracking-widest text-navy-100">
                {String(i + 1).padStart(2, "0")} · {s.label.toUpperCase()}
              </span>
              <span className="mt-2.5 block text-xl font-semibold tracking-tight">
                {s.headline}
              </span>
              <span
                className={`mt-1 block text-sm ${s.urgent ? "text-white" : "text-navy-100"}`}
              >
                {s.detail}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
