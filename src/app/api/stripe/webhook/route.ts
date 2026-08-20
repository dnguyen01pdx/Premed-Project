import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { grantProFromStripe } from "@/lib/pro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe's source of truth for "did this actually get paid." The redirect
 * back to /account after Checkout is just where the browser lands; Pro is
 * only ever granted here, after Stripe's signature on the raw body checks
 * out. Never call req.json() before constructEvent() — verification needs
 * the exact bytes Stripe signed, and JSON parsing does not round-trip byte
 * for byte.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    console.error(
      "[stripe] webhook called but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET is not set.",
    );
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    console.error("[stripe] webhook signature verification failed:", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId;

    if (!userId) {
      console.error(
        "[stripe] checkout.session.completed with no userId reference:",
        session.id,
      );
    } else if (session.payment_status !== "paid") {
      // Can happen with delayed payment methods; the account is not granted
      // Pro until a later event confirms the money actually moved.
      console.log(
        `[stripe] checkout ${session.id} completed but not yet paid (status: ${session.payment_status}); waiting for a later event.`,
      );
    } else {
      await grantProFromStripe(userId, {
        customerId:
          typeof session.customer === "string" ? session.customer : undefined,
        checkoutSessionId: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
