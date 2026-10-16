import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripeCustomerId } from "@/lib/pro";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens Stripe's hosted billing portal, where a subscriber can cancel, change
 * their card, or download receipts. Cancelling there fires
 * customer.subscription.updated / .deleted, which the webhook applies; access
 * runs to the end of the period they already paid for.
 *
 * Requires the Customer Portal to be turned on once in the Stripe dashboard
 * (Settings > Billing > Customer portal). If it is not, Stripe throws and we
 * land back on /account with an error instead of a broken page.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/account?error=signinfirst`);
  }
  const stripe = getStripe();
  const customerId = await getStripeCustomerId(user.id);
  if (!stripe || !customerId) {
    return NextResponse.redirect(`${SITE_URL}/account?error=noportal`);
  }
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/account`,
    });
    return NextResponse.redirect(portal.url);
  } catch (e) {
    console.error("[stripe] failed to open billing portal:", e);
    return NextResponse.redirect(`${SITE_URL}/account?error=noportal`);
  }
}
