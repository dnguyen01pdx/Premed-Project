import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { TopoLines } from "@/components/TopoLines";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/config";
import { FREE_PREVIEW_LIMIT } from "@/lib/entitlements";
import { isPlanAvailable, isStripeConfigured, type Plan } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Every school, essay and deadline you track on ${SITE_NAME} is free with no limit. Pro is the full cross-school analysis on top of it.`,
};

// Everything an applicant tracks. Free for everyone, with no cap.
const FREE_FEATURES = [
  "Weekly planner, with hours added up by category",
  "Activity log with verifier contacts",
  "Work & Activities and personal statement drafting",
  "Letter of recommendation tracker",
  "Every US MD secondary prompt we have, searchable by school, type and length",
  "Track your schools, essays and deadlines, no cap",
  "Interview tracking and practice questions",
  "Export everything you have entered",
];

// The only places Free and Pro differ. Kept as its own short table so the
// difference is easy to see instead of buried under rows of "Yes / Yes".
const PRO_ROWS: Array<{ feature: string; free: string; paid: string }> = [
  {
    feature: "Your overlap: which of your schools share a question",
    free: `First ${FREE_PREVIEW_LIMIT} groups`,
    paid: "Every group",
  },
  {
    feature: "Essay Map: reuse one draft across schools",
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
    <div className="space-y-16 pb-10 sm:space-y-20">
      {/* Same ink hero as the homepage, so Pricing reads as part of the
          site rather than a bolted-on comparison table. */}
      <section className="relative -mx-5 -mt-12 overflow-hidden bg-navy-900 px-5 py-12 text-white sm:mx-0 sm:-mt-4 sm:rounded-lg sm:border-2 sm:border-navy-900 sm:px-12 sm:py-16 sm:shadow-[8px_8px_0_var(--coral-pop)]">
        <TopoLines className="pointer-events-none absolute -right-24 -top-20 h-[520px] w-[720px] text-white/[0.1]" />
        <div className="relative max-w-3xl">
          <p className="kicker !text-coral-pop">Pricing · Free version + Pro</p>
          <h1 className="mt-4 text-6xl leading-[0.9] sm:text-8xl">
            Free to track. Pro to go deeper.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">
            Every tracker in {SITE_NAME} works in the free version, with no
            limit on schools or essays. Pro adds the deeper essay tools on
            top. Try the free version first and upgrade only if you want
            more!
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/dashboard"
              className="lift rounded-full bg-white px-7 py-3.5 text-base font-semibold text-navy-900 hover:bg-navy-50"
            >
              Try the free version
            </Link>
            <a
              href="#pro"
              className="text-sm font-medium text-navy-100 underline underline-offset-4 hover:text-white"
            >
              See Pro plans
            </a>
          </div>
        </div>
      </section>

      {(error === "notready" || canceled) && (
        <p className="mx-auto max-w-2xl rounded-md border-2 border-navy-900 bg-sunken p-3.5 text-center text-sm">
          {error === "notready"
            ? "Purchasing is not open yet."
            : "Checkout was canceled. Nothing was charged."}
        </p>
      )}

      <Reveal>
        <section
          aria-labelledby="plans-heading"
          className="grid gap-8 md:grid-cols-2"
        >
          <h2 id="plans-heading" className="sr-only">
            Plans
          </h2>

          <div className="stamp rounded-lg bg-surface p-7 sm:p-8">
            <p className="kicker">The free version</p>
            <h3 className="mt-2 text-4xl">Free</h3>
            <p className="mt-2">
              <span className="font-display text-5xl">$0</span>{" "}
              <span className="text-sm text-muted">forever</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span aria-hidden="true" className="font-bold text-accent">
                    ✓
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Plus a taste of the Pro tools: your top {FREE_PREVIEW_LIMIT}{" "}
              Essay Map groups, one suggestion and one insight. No credit
              card needed!
            </p>
            <Link
              href="/dashboard"
              className="mt-7 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              Start for free
            </Link>
          </div>

          <div id="pro" className="stamp-coral scroll-mt-24 rounded-lg bg-surface p-7 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="kicker">For secondary season</p>
              {user?.isPro && (
                <span className="rounded-sm border border-ok/40 bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                  You have this
                </span>
              )}
            </div>
            <h3 className="mt-2 text-4xl">Pro</h3>
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
            <div className="mt-6 grid gap-4">
              {PLANS.map((plan) => {
                const available = isPlanAvailable(plan.key);
                return (
                  <div
                    key={plan.key}
                    className="rounded-md border-2 border-navy-900 bg-sunken p-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="nav-label text-navy-900">{plan.name}</p>
                      {plan.note && (
                        <span className="kicker">{plan.note}</span>
                      )}
                    </div>
                    <p className="mt-1">
                      <span className="font-display text-4xl">
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
              <p className="mt-5 text-sm leading-relaxed">
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

      <Reveal>
        <section aria-labelledby="diff-heading">
          <p className="kicker">Side by side</p>
          <h2 id="diff-heading" className="mt-2 text-4xl sm:text-5xl">
            Where Pro goes further
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Everything in the free list above is the same on both. These four
            essay tools are the only difference.
          </p>
          <div className="mt-8 overflow-x-auto rounded-lg border-2 border-navy-900">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">
                Features that differ between the free version and Pro
              </caption>
              <thead>
                <tr className="bg-navy-900 text-white">
                  <th scope="col" className="nav-label px-5 py-3.5 font-medium">
                    Tool
                  </th>
                  <th scope="col" className="nav-label px-5 py-3.5 font-medium">
                    Free version
                  </th>
                  <th scope="col" className="nav-label px-5 py-3.5 font-medium">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {PRO_ROWS.map((r) => (
                  <tr key={r.feature}>
                    <th scope="row" className="px-5 py-4 font-medium">
                      {r.feature}
                    </th>
                    <td className="px-5 py-4 text-muted">{r.free}</td>
                    <td className="px-5 py-4 font-semibold text-navy-900">
                      {r.paid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
