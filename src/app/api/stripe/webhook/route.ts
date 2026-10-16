import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  applySubscription,
  grantQuarterPass,
  type SubscriptionSnapshot,
} from "@/lib/pro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe's source of truth for "did this actually get paid." The redirect
 * back to /account after Checkout is just where the browser lands; Pro is
 * only ever granted here, after Stripe's signature on the raw body checks
 * out. Never call req.json() before constructEvent(): verification needs
 * the exact bytes Stripe signed, and JSON parsing does not round-trip byte
 * for byte.
 *
 * The Stripe webhook endpoint must be subscribed to:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   invoice.paid
 *   customer.subscription.updated
 *   customer.subscription.deleted
 */

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

/** Stripe moved current_period_end from the subscription onto its items in
 *  newer API versions; read whichever is present. */
function snapshotOf(sub: Stripe.Subscription): SubscriptionSnapshot {
  const item = sub.items?.data?.[0] as unknown as
    | { current_period_end?: number }
    | undefined;
  const legacy = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const end = item?.current_period_end ?? legacy;
  return {
    id: sub.id,
    status: sub.status,
    customerId: idOf(sub.customer as string | { id: string } | null),
    periodEnd: end ? new Date(end * 1000) : null,
    userId: sub.metadata?.userId || null,
  };
}

/** Subscription id on an invoice, across old and new API shapes. */
function subscriptionIdOfInvoice(inv: Stripe.Invoice): string | null {
  const legacy = (inv as unknown as { subscription?: string | { id: string } })
    .subscription;
  const modern = (
    inv as unknown as {
      parent?: { subscription_details?: { subscription?: string | { id: string } } };
    }
  ).parent?.subscription_details?.subscription;
  return idOf(legacy ?? modern ?? null);
}

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId;
        if (!userId) {
          console.error("[stripe] checkout with no userId reference:", session.id);
          break;
        }
        if (session.payment_status !== "paid") {
          // Delayed payment methods: wait for async_payment_succeeded.
          console.log(
            `[stripe] checkout ${session.id} not paid yet (${session.payment_status}); waiting.`,
          );
          break;
        }
        const customerId = idOf(session.customer as string | { id: string } | null);
        if (session.mode === "subscription") {
          const subId = idOf(session.subscription as string | { id: string } | null);
          if (!subId) break;
          const sub = await stripe.subscriptions.retrieve(subId);
          const snap = snapshotOf(sub);
          await applySubscription({
            ...snap,
            userId: snap.userId ?? userId,
            customerId: snap.customerId ?? customerId,
          });
        } else {
          await grantQuarterPass(userId, {
            customerId: customerId ?? undefined,
            checkoutSessionId: session.id,
          });
        }
        break;
      }

      case "invoice.paid": {
        // Each monthly renewal. Re-read the subscription so access runs to
        // the new period end.
        const subId = subscriptionIdOfInvoice(event.data.object as Stripe.Invoice);
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applySubscription(snapshotOf(sub));
        break;
      }

      case "customer.subscription.updated":
        await applySubscription(snapshotOf(event.data.object as Stripe.Subscription));
        break;

      case "customer.subscription.deleted":
        await applySubscription(
          snapshotOf(event.data.object as Stripe.Subscription),
          { deleted: true },
        );
        break;
    }
  } catch (e) {
    // A 500 makes Stripe retry later, which is what we want if the database
    // blipped. Every handler above is safe to run twice.
    console.error(`[stripe] failed handling ${event.type}:`, e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
