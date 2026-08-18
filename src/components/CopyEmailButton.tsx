"use client";

import { useState } from "react";

/**
 * A mailto: link silently does nothing on a machine with no default mail
 * client configured — no error, no fallback, just a click that appears to be
 * ignored. That is the "contact doesn't work" experience. This button covers
 * the case: copy the address to the clipboard so it can be pasted into
 * whatever the person actually uses.
 */
export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (old browser, insecure context). The email
      // is already visible as selectable text right next to this button, so
      // manual copy still works.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
    >
      {copied ? "Copied" : "Copy email address"}
    </button>
  );
}
