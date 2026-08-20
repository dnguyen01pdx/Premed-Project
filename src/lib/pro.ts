import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { promoCodes, promoRedemptions, users, type PromoCode } from "@/db/schema";

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
    .select({ isPro: users.isPro })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existingUser?.isPro) return { ok: false, reason: "already_pro" };

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
    .set({ isPro: true, proSource: "promo", proGrantedAt: new Date() })
    .where(eq(users.id, userId));

  return { ok: true };
}

/** Called only from the Stripe webhook after a verified completed checkout. */
export async function grantProFromStripe(
  userId: string,
  opts: { customerId?: string; checkoutSessionId?: string },
): Promise<void> {
  await db
    .update(users)
    .set({
      isPro: true,
      proSource: "stripe",
      proGrantedAt: new Date(),
      stripeCustomerId: opts.customerId ?? null,
      stripeCheckoutSessionId: opts.checkoutSessionId ?? null,
    })
    .where(eq(users.id, userId));
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
