"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { InterviewBoard } from "./InterviewBoard";
import { PrepBank } from "./PrepBank";
import {
  commitTracker,
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  interviewTotals,
  subscribeNever,
  subscribeToTracker,
  type TrackedSchool,
} from "@/lib/tracker";

/**
 * The interview stage, in one place.
 *
 * Tracking invites and rehearsing answers used to live on two different pages
 * that never referenced each other, which meant the prep bank was effectively
 * invisible to anyone who came in through the tracker. They are the same job
 * two weeks apart, so they are now two tabs of one screen.
 */
export function InterviewsClient() {
  const state = useSyncExternalStore(
    subscribeToTracker,
    getTrackerSnapshot,
    getTrackerServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [tab, setTab] = useState<"pipeline" | "prep">("pipeline");

  function patch(slug: string, changes: Partial<TrackedSchool>) {
    commitTracker({
      ...state,
      schools: state.schools.map((s) =>
        s.slug === slug ? { ...s, ...changes } : s,
      ),
    });
  }

  const totals = hydrated ? interviewTotals(state.schools) : null;

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Interview views"
        className="flex gap-1 rounded-xl border border-line bg-surface p-1"
      >
        {(
          [
            ["pipeline", "My interviews"],
            ["prep", "Question bank"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-navy-900 text-white"
                : "text-muted hover:bg-accent-soft hover:text-accent"
            }`}
          >
            {label}
            {key === "pipeline" && totals && totals.total > 0 && (
              <span className="ml-1.5 tabular-nums opacity-70">
                {totals.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "pipeline" ? (
        !hydrated ? (
          <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
            Loading your interviews…
          </p>
        ) : state.schools.length === 0 ? (
          <div className="anim-pop rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
            <h2 className="text-lg font-semibold tracking-tight">
              No schools on your list yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted">
              Interviews hang off the schools you are tracking, so add those
              first. Every school you add gets an interview record you can move
              from invited through to a decision.
            </p>
            <Link
              href="/secondaries"
              className="lift mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              Add my schools
            </Link>
          </div>
        ) : (
          <div className="anim-rise">
            <InterviewBoard
              schools={state.schools}
              today={new Date()}
              onPatch={patch}
            />
          </div>
        )
      ) : (
        <div className="anim-rise">
          <section className="mb-6 rounded-2xl border border-navy-100 bg-accent-soft p-5 text-sm leading-relaxed">
            <p>
              <strong>Two things to know.</strong> These are question types, not
              a claim about what any specific school asks. School-by-school
              question lists floating around online are mostly rumor, and
              preparing for the wrong one is worse than preparing for none.
            </p>
            <p className="mt-3">
              And there are no model answers here, on purpose. Same rule as our
              essay feedback: we will show you what the question is testing,
              never hand you the words. Memorized answers are audible.
            </p>
          </section>
          <PrepBank />
        </div>
      )}
    </div>
  );
}
