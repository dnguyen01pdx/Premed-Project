import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SITE_NAME } from "@/lib/config";
import { FREE_PREVIEW_LIMIT } from "@/lib/entitlements";

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
    feature: "Track your schools, essays and deadlines — no cap",
    free: "Yes",
    paid: "Yes",
  },
  { feature: "Export your tracker", free: "Yes", paid: "Yes" },
  { feature: "Interview tracking and prep questions", free: "Yes", paid: "Yes" },
  {
    feature: "Structured feedback on your drafts",
    free: "Not built yet",
    paid: "Not built yet — first Pro feature once it ships",
  },
  {
    feature: "Your overlap: which of your own schools share a question",
    free: `First ${FREE_PREVIEW_LIMIT} groups`,
    paid: "Every group",
  },
  {
    feature: "Essay Map — reuse a draft across schools",
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

export default function PricingPage() {
  return (
    <div className="space-y-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Almost all of it is free.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Every school, essay, hour, and interview you enter is yours, free,
          with no cap — that data is never the thing you pay for. Pro is the
          full cross-school analysis built on top of it: your complete Essay
          Map, every prioritized suggestion, every insight, instead of the
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
              <tr className="border-b border-line bg-navy-900 text-white">
                <th scope="col" className="px-5 py-4 font-semibold">
                  Feature
                </th>
                <th scope="col" className="px-5 py-4 text-center font-semibold">
                  Free
                </th>
                <th scope="col" className="px-5 py-4 text-center font-semibold">
                  Full cycle
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

      <Reveal>
        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-2xl font-semibold tracking-tight">Free</h2>
            <p className="mt-1 text-3xl font-semibold tracking-tight">$0</p>
            <p className="mt-4 leading-relaxed text-muted">
              The planner, the primary log, the prompt atlas, and the whole
              secondaries and interviews tracker — every school and essay you
              add, no cap. Plus a first look at the Essay Map: your top{" "}
              {FREE_PREVIEW_LIMIT} reusable groups, one prioritized
              suggestion, one application insight. No account required, no
              credit card, no trial that expires.
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
              <h2 className="text-2xl font-semibold tracking-tight">
                Pro — full cycle
              </h2>
              <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              $49{" "}
              <span className="text-base font-normal text-muted">
                one time, per cycle
              </span>
            </p>
            <p className="mt-4 leading-relaxed">
              Not a subscription — one flat payment that covers your whole
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
              what to write next, and every application insight — not just
              the first few. Checkout is not connected yet, so there is
              nothing to buy today; this is what it will cost when it is.
            </p>
            <p className="mt-3 text-sm text-muted">
              Once checkout exists: full refund within 14 days, no questions
              asked.
            </p>
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
              logging hours, or an applicant in August trying to remember which
              secondary is still sitting unopened, should be able to land here
              and be useful to themselves in ten seconds — and stay useful no
              matter how many schools or essays they add.
            </p>
            <p>
              Structured feedback on your drafts is the part that will
              actually cost something, once it exists — and it is the first
              thing being built for Pro. Past a first look, going deeper into
              cross-school reuse, ranked priorities, and pattern insights
              across everything you have entered will join it there too.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-2xl rounded-2xl border border-navy-100 bg-accent-soft p-7 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            What paying does not buy
          </h2>
          <p className="mt-3 leading-relaxed">
            It will not buy essay text. When feedback ships, it will point at
            the sentences that are not working in your own draft and explain
            why — never hand you a rewritten paragraph, a suggested sentence,
            or a fill-in-the-blank outline. That limit will apply to paying
            users exactly as much as to everyone else.
          </p>
          <Link
            href="/how-feedback-works"
            className="mt-4 inline-block font-medium text-accent underline underline-offset-4 hover:no-underline"
          >
            Read the full policy
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
