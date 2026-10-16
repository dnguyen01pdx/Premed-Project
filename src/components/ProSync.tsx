"use client";

import { useEffect } from "react";
import { setPro } from "@/lib/entitlements";

/**
 * Remembers that THIS browser's Pro flag was switched on by a real account
 * (not by the on-device preview toggle), so it can be switched back off when
 * that account's Pro ends. Separate key so the preview toggle is untouched.
 */
const FROM_ACCOUNT_KEY = "mda.proFromAccount.v1";

/**
 * Mirrors the account's Pro status (paid, or inside the free trial) into the
 * local flag every Pro-gated component reads (see entitlements.ts).
 *
 * - Signed in and active: flag on, and remember the account turned it on.
 * - Signed in, not active (trial over, pass expired, subscription lapsed):
 *   flag off.
 * - Signed out: keep a flag the account turned on (a paying user who signed
 *   out keeps working), but switch off any flag nothing vouches for. That
 *   clears what the old on-device "Preview Pro" switch left behind; that
 *   switch unlocked Pro forever for free and was replaced by the 3-day trial.
 */
export function ProSync({
  isPro,
  signedIn,
}: {
  isPro: boolean;
  signedIn: boolean;
}) {
  useEffect(() => {
    try {
      const vouched = window.localStorage.getItem(FROM_ACCOUNT_KEY) === "1";
      if (signedIn && isPro) {
        setPro(true);
        window.localStorage.setItem(FROM_ACCOUNT_KEY, "1");
      } else if (signedIn) {
        setPro(false);
        window.localStorage.removeItem(FROM_ACCOUNT_KEY);
      } else if (!vouched) {
        setPro(false);
      }
    } catch {
      if (signedIn && isPro) setPro(true);
    }
  }, [isPro, signedIn]);
  return null;
}
