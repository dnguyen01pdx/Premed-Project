import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, isPlanAvailable, priceIdFor, type Plan } from "@/lib/stripe";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts a Pro purchase. `?plan=monthly` is a $20/month subscription
 * (Checkout "subscription" mode); `?plan=quarter` (the default) is a $49
 * one-time payment for three months (Checkout "payment" mode).
 *
 * Redirects to Stripe's hosted page. Pro is granted only in the webhook once
 * Stripe confirms payment, never here: a browser landing back on our site
 * proves someone reached Stripe, not that they paid.
 */
export async function GET(req: NextRequest) {
  const plan: Plan =
    req.nextUrl.searchParams.get("plan") === "monthly" ? "monthly" : "quarter";

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(
      `${SITE_URL}/account?error=signinfirst&next=/pricing`,
    );
  }

  const stripe = getStripe();
  const priceId = priceIdFor(plan);
  if (!stripe || !priceId || !isPlanAvailable(plan)) {
    return NextResponse.redirect(`${SITE_URL}/pricing?error=notready`);
  }

  // A subscriber starting a second subscription would be billed twice for
  // the same thing. Send them to manage the one they have instead.
  if (plan === "monthly" && user.hasSubscription && user.isPro) {
    return NextResponse.redirect(`${SITE_URL}/account?error=alreadysubscribed`);
  }

  try {
    // client_reference_id is Stripe's documented "which of my users"; the
    // metadata copy survives API changes. On subscriptions the userId is also
    // stamped on the subscription itself, so renewal and cancellation events
    // months later can still find the account.
    const common = {
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/account?upgraded=1`,
      cancel_url: `${SITE_URL}/pricing?canceled=1`,
    };
    const session =
      plan === "monthly"
        ? await stripe.checkout.sessions.create({
            ...common,
            mode: "subscription",
            subscription_data: { metadata: { userId: user.id } },
          })
        : await stripe.checkout.sessions.create({
            ...common,
            mode: "payment",
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
