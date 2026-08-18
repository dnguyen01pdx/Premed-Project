"use client";

import { useSyncExternalStore } from "react";
import {
  getEntitlementsServerSnapshot,
  getEntitlementsSnapshot,
  setPro,
  subscribeToEntitlements,
} from "@/lib/entitlements";

/**
 * There is no checkout wired up yet — see /pricing. Until there is, this is
 * the only way Pro gets turned on: a plainly-labeled testing switch, not a
 * purchase. It exists so the Pro-gated surfaces (Essay Map, prioritization,
 * insights) can be built and reviewed honestly before real payment exists.
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
        MD Atlas Pro doesn&apos;t have checkout connected yet, so there is
        nothing to buy here. This switch previews what Pro unlocks — Essay
        Map, prioritization, insights — while that gets built.
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
