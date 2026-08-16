"use client";

import { useEffect, useRef, useState } from "react";
import { commitTracker, getTrackerSnapshot, parseTracker } from "@/lib/tracker";
import { commitPrep, getPrepSnapshot, parsePrep } from "@/lib/prep";
import { commitPrimary, getPrimarySnapshot, parsePrimary } from "@/lib/primary";

type Status =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "linkSent"; email: string; devLink?: string }
  | { kind: "conflict"; email: string; server: Remote }
  | { kind: "signedIn"; email: string; saving: boolean; savedAt: string | null };

type Remote = { tracker: unknown; prep: unknown; primary: unknown };

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
 */
export function SyncPanel() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
        }
        // Primary data can exist without any schools tracked yet, so it pulls
        // down on its own terms rather than riding on the school comparison.
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

    const push = () => {
      clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(async () => {
        setStatus((s) => (s.kind === "signedIn" ? { ...s, saving: true } : s));
        try {
          await fetch("/api/sync", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              tracker: getTrackerSnapshot(),
              prep: getPrepSnapshot(),
              primary: getPrimarySnapshot(),
            }),
          });
          setStatus((s) =>
            s.kind === "signedIn"
              ? { ...s, saving: false, savedAt: new Date().toISOString() }
              : s,
          );
        } catch {
          setStatus((s) => (s.kind === "signedIn" ? { ...s, saving: false } : s));
        }
      }, 1200);
    };

    // localStorage writes from this tab do not fire `storage`, so the tracker
    // module notifies listeners directly. Poll-free.
    const onChange = () => push();
    window.addEventListener("mda:local-change", onChange);
    push(); // sync once on sign-in

    return () => {
      window.removeEventListener("mda:local-change", onChange);
      clearTimeout(pushTimer.current);
    };
  }, [signedIn]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send the link.");
        return;
      }
      setStatus({ kind: "linkSent", email, devLink: data.devLink });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setStatus({ kind: "signedOut" });
  }

  async function resolveConflict(keep: "local" | "server") {
    if (status.kind !== "conflict") return;
    if (keep === "server") {
      commitTracker(parseTracker(status.server.tracker));
      if (status.server.prep) commitPrep(parsePrep(status.server.prep));
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

  if (status.kind === "linkSent") {
    return (
      <section className="rounded-2xl border border-ok/30 bg-ok-soft p-5">
        <h2 className="font-semibold text-ok">Check your email</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ok">
          A sign-in link is on its way to <strong>{status.email}</strong>. It
          works once and expires in 15 minutes. Your list stays right here in the
          meantime.
        </p>
        {status.devLink && (
          <p className="mt-3 break-all text-xs text-ok">
            Dev mode, no email service configured:{" "}
            <a className="underline" href={status.devLink}>
              {status.devLink}
            </a>
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-sunken p-5 sm:p-6">
      <h2 className="font-semibold">Want this on your phone too?</h2>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
        Add your email and your list follows you between devices. Optional:
        everything here already works without it. No password, we just email you
        a link.
      </p>

      <form onSubmit={requestLink} className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="sync-email" className="sr-only">
          Email address
        </label>
        <input
          id="sync-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {sending ? "Sending..." : "Email me a link"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        We use your email for sign-in and to tell you when essay feedback
        launches. Nothing else.{" "}
        <a
          href="/privacy"
          className="text-accent underline underline-offset-2 hover:no-underline"
        >
          Privacy
        </a>
      </p>
    </section>
  );
}
