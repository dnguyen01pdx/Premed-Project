"use client";

import { useSyncExternalStore } from "react";
import {
  getEntitlementsServerSnapshot,
  getEntitlementsSnapshot,
  setPro,
  subscribeToEntitlements,
} from "@/lib/entitlements";

/**
 * A plainly-labeled testing switch, separate from an actual purchase or a
 * redeemed promo code (see the "Pro" section above this one, on /account).
 * It exists so anyone can see what Pro unlocks before paying for it, and so
 * the Pro-gated surfaces (Essay Map, prioritization, insights) stay
 * reviewable without needing a real payment every time. It only ever turns
 * the local preview on or off; it can never turn off a real purchase or
 * promo grant, which is why this section is hidden once the account
 * actually has Pro.
 */
export function ProPreviewToggle() {
  const entitlements = useSyncExternalStore(
    subscribeToEntitlements,
    getEntitlementsSnapshot,
    getEntitlementsServerSnapshot,
  );

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-semibold">Pro preview</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Not a purchase. This switch previews what Pro unlocks on this device
        only, for Essay Map, prioritization, and insights, so you can see it
        before you buy it.
      </p>
      <label className="mt-4 flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={entitlements.pro}
          onChange={(e) => setPro(e.target.checked)}
          className="h-4 w-4 rounded border-line-strong"
        />
        <span className="font-medium">Preview Pro features on this device</span>
      </label>
    </section>
  );
}
