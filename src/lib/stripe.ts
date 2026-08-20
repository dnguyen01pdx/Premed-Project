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

/** Both the secret key and a configured price are required to sell Pro. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
