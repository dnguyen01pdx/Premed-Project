"use client";

import { useEffect } from "react";
import { setPro } from "@/lib/entitlements";

/**
 * Mirrors the server's real Pro status (Stripe payment or redeemed promo
 * code) into the same local flag every Pro-gated component already reads
 * (see entitlements.ts). This is the only bridge between the two: real Pro
 * always turns the local flag on, but never turns it off, so a browser that
 * had the local preview toggle on keeps behaving exactly as it did before
 * this existed. The one-directional design also means signing out on a
 * shared computer does not silently revoke a flag someone else relies on;
 * it just stops being refreshed to true.
 */
export function ProSync({ isPro }: { isPro: boolean }) {
  useEffect(() => {
    if (isPro) setPro(true);
  }, [isPro]);
  return null;
}
