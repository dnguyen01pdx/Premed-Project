import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Null when STRIPE_SECRET_KEY is not set, same posture as sendSignInEmail
 * and the Google OAuth routes: callers check for null and fail into a clear
 * redirect rather than the app crashing on a missing key.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export type Plan = "monthly" | "quarter";

/**
 * Stripe Price ids for each plan.
 *  - quarter: a ONE-TIME $49 price. STRIPE_PRICE_ID_QUARTER if set, else the
 *    original STRIPE_PRICE_ID, which is already a one-time $49 price, so the
 *    3-month pass works with no Stripe changes at all.
 *  - monthly: a RECURRING $20/month price in STRIPE_PRICE_ID_MONTHLY. Until
 *    that exists, the monthly button says it is not open yet.
 */
export function priceIdFor(plan: Plan): string | null {
  if (plan === "monthly") return process.env.STRIPE_PRICE_ID_MONTHLY || null;
  return (
    process.env.STRIPE_PRICE_ID_QUARTER || process.env.STRIPE_PRICE_ID || null
  );
}

/** Whether a given plan can be bought right now. */
export function isPlanAvailable(plan: Plan): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && priceIdFor(plan));
}

/** True when at least one plan can be bought. */
export function isStripeConfigured(): boolean {
  return isPlanAvailable("monthly") || isPlanAvailable("quarter");
}
