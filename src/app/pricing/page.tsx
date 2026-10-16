import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/config";
import { FREE_PREVIEW_LIMIT } from "@/lib/entitlements";
import { isPlanAvailable, isStripeConfigured, type Plan } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What's free",
  description: `Every school, essay and deadline you track on ${SITE_NAME} is free with no limit. Pro is the full cross-school analysis on top of it.`,
};

const ROWS: Array<{ feature: string; free: string; paid: string }> = [
  {
    feature: "Weekly planner, hours by category",
    free: "Yes",
    paid: "Yes",
  },
  {
    feature: "Activity log with verifier contacts",
    free: "Yes",
    paid: "Yes",
  },
  {
    feature: "Work & Activities and personal statement drafting",
    free: "Yes",
    paid: "Yes",
  },
  {
    feature: "Letter of recommendation tracker",
    free: "Yes",
    paid: "Yes",
  },
  {
    feature: "Every US MD secondary prompt we have",
    free: "Yes",
    paid: "Yes",
  },
  { feature: "Search and filter by school, type, length", free: "Yes", paid: "Yes" },
  {
    feature: "Track your schools, essays and deadlines, no cap",
    free: "Yes",
    paid: "Yes",
  },
  { feature: "Export your tracker", free: "Yes", paid: "Yes" },
  { feature: "Interview tracking and prep questions", free: "Yes", paid: "Yes" },
  {
    feature: "Your overlap: which of your own schools share a question",
    free: `First ${FREE_PREVIEW_LIMIT} groups`,
    paid: "Every group",
  },
  {
    feature: "Essay Map: reuse a draft across schools",
    free: `First ${FREE_PREVIEW_LIMIT} groups`,
    paid: "Every group, with reuse tools",
  },
  {
    feature: "Smart prioritization: what to write next",
    free: "1 suggestion",
    paid: "Full ranked list",
  },
  {
    feature: "Application insights (repeats, underused activities)",
    free: "1 insight",
    paid: "All insights",
  },
];

const PLANS: Array<{
  key: Plan;
  name: string;
  price: string;
  per: string;
  terms: string;
  note?: string;
  cta: string;
}> = [
  {
    key: "monthly",
    name: "Monthly",
    price: "$20",
    per: "per month",
    terms:
      "Renews every month until you cancel. Cancel anytime from your account page and keep Pro until the end of the month you paid for.",
    cta: "Start monthly",
  },
  {
    key: "quarter",
    name: "3 months",
    price: "$49",
    per: "one time",
    note: "Saves $11",
    terms:
      "Three months of Pro for one payment. It does not renew, so there is nothing to cancel. Long enough for a full secondary season.",
    cta: "Buy 3 months",
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const canceled = (Array.isArray(sp.canceled) ? sp.canceled[0] : sp.canceled) === "1";
  const user = await getCurrentUser();
  const stripeReady = isStripeConfigured();

  return (
    <div className="space-y-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Almost all of it is free.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Tracking everything is free, with no limits. Pro adds the full
          Essay Map, every suggestion, and every insight, instead of the
          first {FREE_PREVIEW_LIMIT}.
        </p>
      </header>

      <Reveal>
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Feature comparison between the free and paid tiers
            </caption>
            <thead>
              <tr className="border-b border-line bg-navy-900 text-base text-white">
                <th scope="col" className="px-5 py-4 font-semibold">
                  Feature
                </th>
                <th scope="col" className="px-5 py-4 text-center font-semibold">
                  Free
                </th>
                <th scope="col" className="px-5 py-4 text-center font-semibold">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map((r) => (
                <tr key={r.feature}>
                  <th scope="row" className="px-5 py-3.5 font-normal">
                    {r.feature}
                  </th>
                  <td className="px-5 py-3.5 text-center text-muted">
                    {r.free}
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium">
                    {r.paid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </Reveal>

      {(error === "notready" || canceled) && (
        <p className="mx-auto max-w-2xl rounded-xl border border-line-strong bg-sunken p-3.5 text-center text-sm">
          {error === "notready"
            ? "Purchasing is not open yet."
            : "Checkout was canceled. Nothing was charged."}
        </p>
      )}

      <Reveal>
        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-2xl font-semibold tracking-tight">Free</h2>
            <p className="mt-1 text-3xl font-semibold tracking-tight">$0</p>
            <p className="mt-4 leading-relaxed text-muted">
              The planner, activity log, prompt database, and the
              secondaries and interviews trackers, with no limit on schools
              or essays. You also see your top {FREE_PREVIEW_LIMIT} Essay Map
              groups, one suggestion, and one insight. No credit card.
            </p>
            <Link
              href="/secondaries"
              className="mt-6 inline-block rounded-xl border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Start tracking
            </Link>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-accent-soft p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Pro</h2>
              {user?.isPro && (
                <span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-semibold text-ok">
                  You have this
                </span>
              )}
            </div>
            <p className="mt-3 leading-relaxed">
              Your complete Essay Map, the full ranked list of what to write
              next, and every application insight, not just the first few.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Structured feedback on your drafts is in progress and will be
              added to Pro at no extra cost when it ships. It will never write
              your essay for you.{" "}
              <Link
                href="/how-feedback-works"
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                Read the policy
              </Link>
              .
            </p>

            {/* The two ways to pay. Same Pro either way; the only difference
                is how long it runs and whether it renews. */}
            <div className="mt-6 grid gap-3">
              {PLANS.map((plan) => {
                const available = isPlanAvailable(plan.key);
                return (
                  <div
                    key={plan.key}
                    className="rounded-xl border border-line bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {plan.note && (
                        <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                          {plan.note}
                        </span>
                      )}
                    </div>
                    <p className="mt-1">
                      <span className="font-display text-3xl font-semibold">
                        {plan.price}
                      </span>{" "}
                      <span className="text-sm text-muted">{plan.per}</span>
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {plan.terms}
                    </p>
                    {user?.isPro ? null : available ? (
                      <a
                        href={`/api/checkout/start?plan=${plan.key}`}
                        className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <p className="mt-4 text-sm font-medium text-muted">
                        Not open yet.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {user?.isPro && user.hasSubscription && (
              <a
                href="/api/billing/portal"
                className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-4 hover:no-underline"
              >
                Manage or cancel your subscription
              </a>
            )}
            {!user?.isPro && !stripeReady && (
              <Link
                href="/account"
                className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-4 hover:no-underline"
              >
                Have a code? Sign in to redeem it
              </Link>
            )}

            {!user?.isPro && (
              <p className="mt-4 text-sm leading-relaxed">
                Not sure yet?{" "}
                <Link
                  href="/account"
                  className="font-semibold text-accent underline underline-offset-4 hover:no-underline"
                >
                  Try Pro free for 3 days
                </Link>
                . No card needed, and it ends on its own.
              </p>
            )}
            <p className="mt-3 text-sm text-muted">
              Full refund within 14 days of buying, no questions asked.
            </p>
          </div>
        </section>
      </Reveal>

    </div>
  );
}
