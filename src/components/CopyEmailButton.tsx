"use client";

import { useState } from "react";

type Status = "idle" | "copied" | "failed";

/**
 * A mailto: link silently does nothing on a machine with no default mail
 * client configured — no error, no fallback, just a click that appears to be
 * ignored. That is the "contact doesn't work" experience. This button covers
 * the case: copy the address to the clipboard so it can be pasted into
 * whatever the person actually uses.
 *
 * navigator.clipboard.writeText can itself fail silently in ways that
 * reproduce the exact same "nothing happened" experience — most commonly
 * "NotAllowedError: Document is not focused" (Chrome refuses the write if
 * the tab lost focus between page load and the click) or the permission
 * simply being denied. The old version caught that and did nothing, which
 * left the button reading "Copy email address" forever with zero feedback.
 * This version falls back to the legacy execCommand copy path (which
 * doesn't have a focus requirement) and, if that fails too, switches the
 * button to an explicit failed state instead of staying silent — the email
 * is also selectable text right above, so manual copy always works.
 */
export function CopyEmailButton({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>("idle");

  function showStatus(next: Status) {
    setStatus(next);
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  function legacyCopy(text: string): boolean {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  async function handleCopy() {
    try {
      if (!navigator.clipboard) throw new Error("clipboard API unavailable");
      await navigator.clipboard.writeText(email);
      showStatus("copied");
      return;
    } catch {
      // Fall through to the legacy path below.
    }
    showStatus(legacyCopy(email) ? "copied" : "failed");
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
    >
      {status === "copied"
        ? "Copied"
        : status === "failed"
          ? "Couldn't copy. Select it above"
          : "Copy email address"}
    </button>
  );
}
