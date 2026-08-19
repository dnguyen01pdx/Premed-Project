"use client";

import { useEffect, useRef, useState } from "react";
import { commitTracker, getTrackerSnapshot, parseTracker } from "@/lib/tracker";
import { commitPrep, getPrepSnapshot, parsePrep } from "@/lib/prep";
import { commitPrimary, getPrimarySnapshot, parsePrimary } from "@/lib/primary";
import { getPlannerSnapshot, replacePlanner } from "@/lib/planner";

type Status =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "conflict"; email: string; server: Remote }
  | { kind: "signedIn"; email: string; saving: boolean; savedAt: string | null };

type Remote = {
  tracker: unknown;
  prep: unknown;
  primary: unknown;
  planner: unknown;
};

function countSchools(t: unknown): number {
  const parsed = parseTracker(t);
  return parsed.schools.length;
}

/**
 * Optional sign-in, and the sync it buys.
 *
 * Two rules this follows:
 *
 * 1. Local storage stays the working copy. Signing in adds a backup that
 *    follows you; it never becomes the thing the page reads from. So the
 *    no-account experience is completely unchanged, and losing connectivity
 *    mid-session cannot lose your work.
 * 2. When both sides have data, ASK. Silently picking a winner is how sync
 *    features eat people's work, and an applicant losing their school list in
 *    August is not a recoverable error for them.
 *
 * The "add an email" pitch used to live inline here, on every tracking page.
 * It now lives only on /account, reached through the "Sign in" link in the
 * header — this component just reflects whatever state that produced:
 * nothing when signed out, the synced/saving badge or a conflict prompt when
 * signed in.
 */
export function SyncPanel() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  // Debounce handle for pushing local changes up.
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const signedIn = status.kind === "signedIn";

  // Ask the server who we are exactly once on mount.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/sync")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setStatus({ kind: "signedOut" });
          return;
        }
        if (!res.ok) {
          setStatus({ kind: "signedOut" });
          return;
        }
        const data = await res.json();
        const localSchools = getTrackerSnapshot().schools.length;
        const serverSchools = countSchools(data.tracker);

        if (serverSchools > 0 && localSchools > 0) {
          const same =
            JSON.stringify(parseTracker(data.tracker).schools) ===
            JSON.stringify(getTrackerSnapshot().schools);
          if (!same) {
            setStatus({
              kind: "conflict",
              email: data.email,
              server: {
                tracker: data.tracker,
                prep: data.prep,
                primary: data.primary,
                planner: data.planner,
              },
            });
            return;
          }
        }

        // No conflict: whichever side has data wins, server first.
        if (serverSchools > 0 && localSchools === 0) {
          commitTracker(parseTracker(data.tracker));
          if (data.prep) commitPrep(parsePrep(data.prep));
          if (data.primary) commitPrimary(parsePrimary(data.primary));
          if (data.planner) replacePlanner(data.planner);
        }
        // Primary data can exist without any schools tracked yet, so it pulls
        // down on its own terms rather than riding on the school comparison.
        if (data.planner && getPlannerSnapshot().events.length === 0) {
          replacePlanner(data.planner);
        }
        if (data.primary && getPrimarySnapshot().experiences.length === 0) {
          commitPrimary(parsePrimary(data.primary));
        }

        setStatus({
          kind: "signedIn",
          email: data.email,
          saving: false,
          savedAt: data.updatedAt ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setStatus({ kind: "signedOut" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Push local changes up while signed in.
  useEffect(() => {
    if (!signedIn) return;

    function snapshotBody() {
      return JSON.stringify({
        tracker: getTrackerSnapshot(),
        prep: getPrepSnapshot(),
        primary: getPrimarySnapshot(),
        planner: getPlannerSnapshot(),
      });
    }

    async function flushNow() {
      clearTimeout(pushTimer.current);
      setStatus((s) => (s.kind === "signedIn" ? { ...s, saving: true } : s));
      try {
        await fetch("/api/sync", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: snapshotBody(),
        });
        setStatus((s) =>
          s.kind === "signedIn"
            ? { ...s, saving: false, savedAt: new Date().toISOString() }
            : s,
        );
      } catch {
        setStatus((s) => (s.kind === "signedIn" ? { ...s, saving: false } : s));
      }
    }

    const push = () => {
      clearTimeout(pushTimer.current);
      // Short on purpose: this is the window in which an edit exists only in
      // this browser. Debounced rather than instant so a burst of keystrokes
      // does not fire a request per character.
      pushTimer.current = setTimeout(flushNow, 400);
    };

    // A closed tab, a phone put to sleep, or a browser quit all fire
    // visibilitychange with "hidden" before they fire nothing at all. This is
    // the one chance to get a pending debounced edit onto the server, so it
    // uses sendBeacon (fire-and-forget, survives page teardown) instead of the
    // fetch above, which the browser can and does cancel mid-navigation.
    const flushOnHide = () => {
      if (document.visibilityState !== "hidden") return;
      if (pushTimer.current === undefined) return; // nothing pending
      clearTimeout(pushTimer.current);
      pushTimer.current = undefined;
      const body = new Blob([snapshotBody()], { type: "application/json" });
      navigator.sendBeacon?.("/api/sync", body);
    };

    // localStorage writes from this tab do not fire `storage`, so the tracker
    // module notifies listeners directly. Poll-free.
    const onChange = () => push();
    window.addEventListener("mda:local-change", onChange);
    document.addEventListener("visibilitychange", flushOnHide);
    flushNow(); // sync once on sign-in, immediately rather than debounced

    return () => {
      window.removeEventListener("mda:local-change", onChange);
      document.removeEventListener("visibilitychange", flushOnHide);
      clearTimeout(pushTimer.current);
    };
  }, [signedIn]);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setStatus({ kind: "signedOut" });
  }

  async function resolveConflict(keep: "local" | "server") {
    if (status.kind !== "conflict") return;
    if (keep === "server") {
      commitTracker(parseTracker(status.server.tracker));
      if (status.server.prep) commitPrep(parsePrep(status.server.prep));
      if (status.server.planner) replacePlanner(status.server.planner);
      if (status.server.primary) {
        commitPrimary(parsePrimary(status.server.primary));
      }
    }
    // Keeping local needs no action: the push effect uploads it next tick.
    setStatus({
      kind: "signedIn",
      email: status.email,
      saving: false,
      savedAt: null,
    });
  }

  if (status.kind === "loading") return null;

  if (status.kind === "conflict") {
    const serverCount = countSchools(status.server.tracker);
    const localCount = getTrackerSnapshot().schools.length;
    return (
      <section className="rounded-2xl border border-warn/40 bg-warn-soft p-5 sm:p-6">
        <h2 className="font-semibold text-warn">Two different lists</h2>
        <p className="mt-2 text-sm leading-relaxed text-warn">
          This browser has <strong>{localCount} schools</strong> saved, and your
          account has <strong>{serverCount}</strong>. They do not match, so
          nothing has been changed yet. Pick which one to keep.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => resolveConflict("local")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Keep this browser&apos;s {localCount}
          </button>
          <button
            type="button"
            onClick={() => resolveConflict("server")}
            className="rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            Keep my account&apos;s {serverCount}
          </button>
        </div>
        <p className="mt-3 text-xs text-warn">
          Export a backup first from the bottom of this page if you want both.
        </p>
      </section>
    );
  }

  if (status.kind === "signedIn") {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ok/30 bg-ok-soft px-5 py-3.5">
        <p className="text-sm text-ok">
          Synced to <strong>{status.email}</strong>
          {status.saving
            ? " · saving..."
            : status.savedAt
              ? " · saved"
              : ""}
        </p>
        <button
          type="button"
          onClick={signOut}
          className="text-sm text-ok underline underline-offset-2 hover:no-underline"
        >
          Sign out
        </button>
      </section>
    );
  }

  // Signed out: nothing to show here. Signing in happens on /account, via
  // the "Sign in" link in the header, not as a pitch inline on this page.
  return null;
}
