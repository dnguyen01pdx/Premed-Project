import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts a Pro purchase: a one-time $49 payment, not a subscription, so this
 * is Checkout in "payment" mode rather than "subscription" mode. Redirects to
 * Stripe's hosted page; the actual grant happens in the webhook once Stripe
 * confirms the payment, never here, since a browser redirect proves someone
 * reached Stripe, not that they paid.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/account?error=signinfirst`);
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(`${SITE_URL}/pricing?error=notready`);
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripe || !priceId) {
    return NextResponse.redirect(`${SITE_URL}/pricing?error=notready`);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      // Both set on purpose: client_reference_id is what Stripe's own docs
      // point to for "which of my users was this," metadata is a plain
      // key-value bag that survives even if a future Stripe API version
      // changes how client_reference_id is surfaced.
      client_reference_id: user.id,
      metadata: { userId: user.id },
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/account?upgraded=1`,
      cancel_url: `${SITE_URL}/pricing?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.redirect(`${SITE_URL}/pricing?error=notready`);
    }
    return NextResponse.redirect(session.url);
  } catch (e) {
    console.error("[stripe] failed to create checkout session:", e);
    return NextResponse.redirect(`${SITE_URL}/pricing?error=notready`);
  }
}
