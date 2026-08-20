import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/config";
import { FREE_PREVIEW_LIMIT } from "@/lib/entitlements";
import { isStripeConfigured } from "@/lib/stripe";

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
    feature: "Structured feedback on your drafts",
    free: "Not built yet",
    paid: "Not built yet, first Pro feature once it ships",
  },
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
          Every school, essay, hour, and interview you enter is yours, free,
          with no cap. That data is never the thing you pay for. Pro is the
          full cross-school analysis built on top of it: your complete Essay
          Map, every prioritized suggestion, and every insight, instead of
          the first {FREE_PREVIEW_LIMIT}.
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
              The planner, the primary log, the prompt atlas, and the whole
              secondaries and interviews tracker: every school and essay you
              add, no cap. Plus a first look at the Essay Map, your top{" "}
              {FREE_PREVIEW_LIMIT} reusable groups, one prioritized
              suggestion, and one application insight. No account required,
              no credit card, no trial that expires.
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
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              $49{" "}
              <span className="text-base font-normal text-muted">
                one time, per cycle
              </span>
            </p>
            <p className="mt-4 leading-relaxed">
              Not a subscription. One flat payment that covers your whole
              application cycle, because your need for this ends the day you
              submit your last secondary. No auto-renew, nothing to cancel.
            </p>
            <p className="mt-3 leading-relaxed">
              Structured feedback on your drafts is planned as the first
              feature added to Pro once it is built. It does not exist yet,
              for free or paid accounts, and when it ships it will never
              write your essay for you.{" "}
              <Link
                href="/how-feedback-works"
                className="font-medium underline underline-offset-4 hover:no-underline"
              >
                Read the policy
              </Link>
              .
            </p>
            <p className="mt-3 leading-relaxed">
              Beyond that: your complete Essay Map, the full ranked list of
              what to write next, and every application insight, not just
              the first few.
            </p>
            <p className="mt-3 text-sm text-muted">
              Full refund within 14 days, no questions asked. Beta tester
              with a code? Redeem it on your account page instead of paying.
            </p>

            {user?.isPro ? null : stripeReady ? (
              <a
                href="/api/checkout/start"
                className="mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
              >
                Buy Pro
              </a>
            ) : (
              <Link
                href="/account"
                className="mt-5 inline-block rounded-xl border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
              >
                Not open yet: sign in to redeem a code
              </Link>
            )}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Why this split
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-muted">
            <p>
              Organizing your application should not cost money. A sophomore
              logging hours, or an applicant in August trying to remember
              which secondary is still sitting unopened, should be able to
              land here and be useful to themselves in ten seconds, and stay
              useful no matter how many schools or essays they add.
            </p>
            <p>
              Structured feedback on your drafts is the part that will
              actually cost something once it exists, and it is the first
              thing being built for Pro. Past a first look, going deeper into
              cross-school reuse, ranked priorities, and pattern insights
              across everything you have entered will join it there too.
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
