"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string; devLink?: string }
  | { kind: "error"; message: string };

/**
 * The one place someone actually types an email to sign in. Used to live as
 * an inline "Save your work" nag on every tracking page; now it lives only
 * here, reached through the "Sign in" link in the header, since a page
 * dedicated to the decision beats interrupting four different workflows to
 * ask the same question.
 */
export function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Could not send the link.",
        });
        return;
      }
      setStatus({ kind: "sent", email, devLink: data.devLink });
    } catch {
      setStatus({ kind: "error", message: "Could not reach the server." });
    }
  }

  if (status.kind === "sent") {
    return (
      <section className="rounded-2xl border border-ok/30 bg-ok-soft p-5">
        <h2 className="font-semibold text-ok">Check your email</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ok">
          A sign-in link is on its way to <strong>{status.email}</strong>. It
          works once and expires in 15 minutes.
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
    <form onSubmit={requestLink} className="space-y-3">
      <div>
        <label htmlFor="signin-email" className="block text-sm font-medium">
          Email address
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <input
            id="signin-email"
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
            disabled={status.kind === "sending"}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {status.kind === "sending" ? "Sending..." : "Email me a link"}
          </button>
        </div>
      </div>

      {status.kind === "error" && (
        <p role="alert" className="text-sm text-danger">
          {status.message}
        </p>
      )}

      <p className="text-xs text-muted">
        No password, just a link. We use your email for sign-in and to tell
        you when essay feedback launches. Nothing else.{" "}
        <a
          href="/privacy"
          className="text-accent underline underline-offset-2 hover:no-underline"
        >
          Privacy
        </a>
      </p>
    </form>
  );
}
