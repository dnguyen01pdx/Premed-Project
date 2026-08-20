"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "error"; message: string };

/**
 * Lives on /account for anyone signed in who is not Pro yet. Separate from
 * the Stripe checkout button on purpose: a beta tester should be able to use
 * their code the moment Dylan hands it out, whether or not Stripe is even
 * configured.
 */
export function PromoCodeForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Could not redeem that code.",
        });
        return;
      }
      setStatus({ kind: "done" });
      // Pulls the fresh, server-confirmed isPro into this page's props so
      // the Pro badge and this form's own "done" state agree with reality.
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Could not reach the server." });
    }
  }

  if (status.kind === "done") {
    return (
      <p className="rounded-xl border border-ok/30 bg-ok-soft p-3.5 text-sm text-ok">
        Code redeemed. You have Pro now.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="promo-code" className="block text-sm font-medium">
        Have a beta code?
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CODE"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={status.kind === "sending" || !code.trim()}
          className="rounded-lg border border-line-strong px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {status.kind === "sending" ? "Checking..." : "Redeem"}
        </button>
      </div>
      {status.kind === "error" && (
        <p role="alert" className="text-sm text-danger">
          {status.message}
        </p>
      )}
    </form>
  );
}
