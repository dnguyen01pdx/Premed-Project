"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  interviewTotals,
  subscribeToTracker,
} from "@/lib/tracker";

const COPY: Record<
  "secondaries" | "interviews",
  { title: string; body: string; existingData: (n: number) => string }
> = {
  secondaries: {
    title: "Sign in to track your secondaries",
    body: "Add each school, break its secondary into individual essays, and see which prompts overlap across your list so you write once instead of twenty times. Free: just an email, no password.",
    existingData: (n) =>
      `This browser already has ${n} ${n === 1 ? "school" : "schools"} saved locally. Sign in to keep editing and back it up. Nothing is deleted by signing in.`,
  },
  interviews: {
    title: "Sign in to track your interviews",
    body: "Log every invite from offer to decision, plus a full question bank of what interviewers are actually listening for. Free: just an email, no password.",
    existingData: () =>
      "This browser already has interview activity saved locally. Sign in to keep tracking it. Nothing is deleted by signing in.",
  },
};

/**
 * Secondaries and Interviews are the two stages that only make sense once an
 * applicant is committed to a real school list — that is also the exact
 * moment losing a browser's local storage stops being a shrug and starts
 * being a real problem. So unlike Planner and Primary (which stay usable
 * with no account at all), these two require signing in even on the free
 * tier: a soft lock, not a redirect. Nothing about the actual tool is hidden
 * from a signed-out visitor here — the page itself, its explanation, and any
 * data already sitting in this browser are still visible in the notice
 * below. What is locked is the ability to add or change anything, since an
 * edit that never gets backed up because no one asked to sign in is exactly
 * the failure this exists to prevent.
 */
export function SignInGate({
  signedIn,
  feature,
  children,
}: {
  signedIn: boolean;
  feature: "secondaries" | "interviews";
  children: React.ReactNode;
}) {
  if (signedIn) return <>{children}</>;
  return <LockedPreview feature={feature} />;
}

function LockedPreview({ feature }: { feature: "secondaries" | "interviews" }) {
  // Client-only check so a returning visitor with real local data gets a
  // notice that reflects that, instead of the generic first-time pitch.
  const tracker = useSyncExternalStore(
    subscribeToTracker,
    getTrackerSnapshot,
    getTrackerServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const schoolCount = tracker.schools.length;
  const hasInterviewActivity = interviewTotals(tracker.schools).total > 0;
  const hasExistingData =
    hydrated &&
    (feature === "secondaries" ? schoolCount > 0 : hasInterviewActivity);

  const copy = COPY[feature];

  return (
    <section className="rounded-2xl border border-line-strong bg-sunken p-7 sm:p-9">
      <h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-muted">
        {hasExistingData ? copy.existingData(schoolCount) : copy.body}
      </p>
      <Link
        href="/account"
        className="mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
      >
        Sign in
      </Link>
    </section>
  );
}
