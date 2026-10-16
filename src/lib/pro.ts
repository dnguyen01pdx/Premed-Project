import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { promoCodes, promoRedemptions, users, type PromoCode } from "@/db/schema";
import { effectiveIsPro, TRIAL_DAYS } from "@/lib/auth";

export type RedeemFailureReason =
  | "not_found"
  | "expired"
  | "exhausted"
  | "already_redeemed"
  | "already_pro";

export type RedeemResult = { ok: true } | { ok: false; reason: RedeemFailureReason };

export const REDEEM_MESSAGES: Record<RedeemFailureReason, string> = {
  not_found: "That code doesn't match anything. Double-check it and try again.",
  expired: "That code has expired.",
  exhausted: "That code has already been fully redeemed.",
  already_redeemed: "This account has already redeemed a code.",
  already_pro: "This account already has Pro.",
};

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Redeems a promo code for a signed-in user, granting Pro on success.
 *
 * The insert into promoRedemptions is what actually stops a double-click or
 * two open tabs from redeeming the same code twice on one account — its
 * unique index on (promoCodeId, userId) does the real work; the SELECT above
 * it only exists to return a friendlier error than a raw constraint failure.
 */
export async function redeemPromoCode(
  userId: string,
  rawCode: string,
): Promise<RedeemResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "not_found" };

  // Checked before touching the code row at all: an already-Pro account
  // redeeming a limited-quantity code would burn a slot someone else could
  // have used, for no benefit to anyone.
  const [existingUser] = await db
    .select({ isPro: users.isPro, proUntil: users.proUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existingUser && effectiveIsPro(existingUser.isPro, existingUser.proUntil)) {
    return { ok: false, reason: "already_pro" };
  }

  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);
  if (!promo) return { ok: false, reason: "not_found" };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (
    promo.maxRedemptions !== null &&
    promo.redemptionCount >= promo.maxRedemptions
  ) {
    return { ok: false, reason: "exhausted" };
  }

  try {
    await db
      .insert(promoRedemptions)
      .values({ promoCodeId: promo.id, userId });
  } catch {
    return { ok: false, reason: "already_redeemed" };
  }

  await db
    .update(promoCodes)
    .set({ redemptionCount: sql`${promoCodes.redemptionCount} + 1` })
    .where(eq(promoCodes.id, promo.id));

  await db
    .update(users)
    // Promo grants have no end date, same as before paid plans existed.
    .set({
      isPro: true,
      proSource: "promo",
      proGrantedAt: new Date(),
      proUntil: null,
      proPlan: "promo",
    })
    .where(eq(users.id, userId));

  return { ok: true };
}

/* ------------------------------------------------------------ Stripe -- */

/**
 * Pro is sold two ways (October 2026 onward):
 *   - "quarter": $49 one-time, three months of access.
 *   - "monthly": $20/month subscription, renews until canceled.
 * Both are granted ONLY from the verified Stripe webhook, never from a
 * browser redirect.
 *
 * Two rules every function below keeps:
 *   1. proUntil only ever moves later. A renewal, a second pass, or a late
 *      duplicate webhook can extend access, never cut it short. Access ends
 *      by the date passing, not by anything rewriting it earlier.
 *   2. An account with Pro and no end date (the original one-time $49 pass,
 *      and every promo code) is never given one. Those people were promised
 *      access without an expiry, and a new pricing model does not change that.
 */

export const QUARTER_MONTHS = 3;
/** Slack after a monthly period ends, so a renewal that takes a few hours
 *  to clear does not lock someone out in the meantime. */
const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

function addMonths(d: Date, months: number): Date {
  const out = new Date(d.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

function later(a: Date | null, b: Date): Date {
  return a && a.getTime() > b.getTime() ? a : b;
}

async function loadProRow(userId: string) {
  const [row] = await db
    .select({
      isPro: users.isPro,
      proUntil: users.proUntil,
      proPlan: users.proPlan,
      stripeCheckoutSessionId: users.stripeCheckoutSessionId,
      stripeSubscriptionId: users.stripeSubscriptionId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

/** True for accounts that already have Pro with no end date. */
function isLifetime(row: { isPro: boolean; proUntil: Date | null }): boolean {
  return row.isPro && row.proUntil === null;
}

/**
 * $49 three-month pass, from a paid one-time Checkout session. Idempotent per
 * session: Stripe retries webhooks, and without this check one payment
 * delivered twice would grant six months.
 */
export async function grantQuarterPass(
  userId: string,
  opts: { customerId?: string; checkoutSessionId: string },
): Promise<void> {
  const row = await loadProRow(userId);
  if (!row) return;
  if (row.stripeCheckoutSessionId === opts.checkoutSessionId) return;

  const now = new Date();
  const base =
    row.isPro && row.proUntil && row.proUntil.getTime() > now.getTime()
      ? row.proUntil
      : now;

  await db
    .update(users)
    .set({
      isPro: true,
      proSource: "stripe",
      proGrantedAt: now,
      stripeCustomerId: opts.customerId ?? undefined,
      stripeCheckoutSessionId: opts.checkoutSessionId,
      ...(isLifetime(row)
        ? {}
        : {
            proUntil: addMonths(base, QUARTER_MONTHS),
            // A pass bought on top of an active subscription extends access
            // but does not relabel the account; the subscription is still
            // the thing that renews.
            proPlan: row.proPlan === "monthly" && row.stripeSubscriptionId
              ? "monthly"
              : "quarter",
          }),
    })
    .where(eq(users.id, userId));
}

export type SubscriptionSnapshot = {
  id: string;
  status: string;
  customerId: string | null;
  /** End of the current paid period. */
  periodEnd: Date | null;
  /** Set when the subscription was started through our Checkout. */
  userId: string | null;
};

/**
 * Applies the latest known state of a monthly subscription: on start, on
 * every renewal, on cancel, and on final deletion. Finds the account by the
 * userId Stripe carried in metadata, else by stored subscription id, else by
 * customer id.
 */
export async function applySubscription(
  sub: SubscriptionSnapshot,
  opts: { deleted?: boolean } = {},
): Promise<void> {
  let userId = sub.userId;
  if (!userId) {
    const [bySub] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeSubscriptionId, sub.id))
      .limit(1);
    userId = bySub?.id ?? null;
  }
  if (!userId && sub.customerId) {
    const [byCustomer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, sub.customerId))
      .limit(1);
    userId = byCustomer?.id ?? null;
  }
  if (!userId) {
    console.error(`[stripe] subscription ${sub.id} matches no account`);
    return;
  }

  const row = await loadProRow(userId);
  if (!row) return;

  if (opts.deleted || sub.status === "canceled") {
    // Fully over. Access already runs to the end of the last paid period
    // (proUntil was set from it), so nothing is cut short here: we only
    // forget the subscription so the account stops offering "Manage".
    if (row.stripeSubscriptionId === sub.id) {
      await db
        .update(users)
        .set({ stripeSubscriptionId: null })
        .where(eq(users.id, userId));
    }
    return;
  }

  const paying =
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due";

  await db
    .update(users)
    .set({
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customerId ?? undefined,
      ...(paying && sub.periodEnd
        ? {
            isPro: true,
            proSource: "stripe",
            proGrantedAt: row.isPro ? undefined : new Date(),
            ...(isLifetime(row)
              ? {}
              : {
                  proPlan: "monthly",
                  proUntil: later(
                    row.proUntil,
                    new Date(sub.periodEnd.getTime() + RENEWAL_GRACE_MS),
                  ),
                }),
          }
        : {}),
    })
    .where(eq(users.id, userId));
}

/**
 * Cancels a monthly subscription immediately. Used only when someone deletes
 * their account: once the account is gone nothing could ever cancel it, and
 * Stripe would keep charging a card for an account that no longer exists.
 * Returns false if Stripe could not be reached, so the caller can refuse to
 * delete rather than leave a live subscription behind.
 */
export async function cancelSubscriptionForDeletion(
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ sub: users.stripeSubscriptionId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.sub) return true;
  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    await stripe.subscriptions.cancel(row.sub);
    return true;
  } catch (e) {
    const code = (e as { code?: string }).code;
    // Already gone on Stripe's side: nothing left to cancel.
    if (code === "resource_missing") return true;
    console.error("[stripe] could not cancel subscription before delete:", e);
    return false;
  }
}

/**
 * Starts this account's one free trial. The `trial_ends_at IS NULL` condition
 * in the UPDATE itself is what makes it once per account, even with two tabs
 * clicking at once: the second update matches no row.
 */
export async function startTrial(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isPro: users.isPro, proUntil: users.proUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || effectiveIsPro(row.isPro, row.proUntil)) return false;
  const ends = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const updated = await db
    .update(users)
    .set({ trialEndsAt: ends })
    .where(and(eq(users.id, userId), isNull(users.trialEndsAt)))
    .returning({ id: users.id });
  return updated.length > 0;
}

/** The Stripe customer to open the billing portal for, if any. */
export async function getStripeCustomerId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ c: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.c ?? null;
}

/** Admin-only: create a new redeemable code. */
export async function createPromoCode(opts: {
  code: string;
  label?: string;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}): Promise<PromoCode> {
  const [row] = await db
    .insert(promoCodes)
    .values({
      code: normalizeCode(opts.code),
      label: opts.label?.trim() || null,
      maxRedemptions: opts.maxRedemptions ?? null,
      expiresAt: opts.expiresAt ?? null,
    })
    .returning();
  return row;
}

/** Admin-only: list codes, newest first, for the review page. */
export async function listPromoCodes(): Promise<PromoCode[]> {
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
}

/** Admin-only: delete a code. Past redemptions (and the Pro they granted)
 * are untouched — this only stops the code from working again. */
export async function deletePromoCode(id: string): Promise<void> {
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
}

/** How many times a given code has actually been redeemed by distinct
 * accounts — kept for the admin page even though redemptionCount on the row
 * already tracks this, as a sanity check the two never drift apart. */
export async function countRedemptions(promoCodeId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(promoRedemptions)
    .where(eq(promoRedemptions.promoCodeId, promoCodeId));
  return row?.n ?? 0;
}
