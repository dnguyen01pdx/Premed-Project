import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "What's free",
  description: `Everything that helps you organize your application is free on ${SITE_NAME}. Only essay feedback is paid.`,
};

const ROWS: Array<{ feature: string; free: string; paid: string }> = [
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
  { feature: "Overlap: which schools ask the same question", free: "Yes", paid: "Yes" },
  { feature: "Track your schools, essays and deadlines", free: "Yes", paid: "Yes" },
  { feature: "Export your tracker", free: "Yes", paid: "Yes" },
  { feature: "Interview tracking and prep questions", free: "Yes", paid: "Yes" },
  { feature: "Structured feedback on your drafts", free: "2 essays", paid: "Unlimited" },
];

export default function PricingPage() {
  return (
    <div className="space-y-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Almost all of it is free.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Everything that helps you stay organized costs nothing and always
          will. The only thing you can pay for is feedback on your writing.
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
              The prompt atlas, the overlap view, and the whole tracker. No
              account required, no credit card, no trial that expires. If you
              never pay a cent, the site still does its job.
            </p>
            <Link
              href="/secondaries"
              className="mt-6 inline-block rounded-xl border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Start tracking
            </Link>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-accent-soft p-7">
            <h2 className="text-2xl font-semibold tracking-tight">
              Full cycle
            </h2>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              Coming soon
            </p>
            <p className="mt-4 leading-relaxed">
              One flat payment covering your whole application cycle. Not a
              subscription, because your need for this ends the day you submit
              your last secondary and nobody should have to remember to cancel.
            </p>
            <p className="mt-3 leading-relaxed">
              Unlimited structured feedback across secondaries, Work &amp;
              Activities entries, and your personal statement.
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
              and be useful to themselves in ten seconds.
            </p>
            <p>
              Reading your drafts carefully is different. That takes real
              computation for every essay, and it is the part people already pay
              admissions consultants hundreds of dollars for. So that is the
              part that costs something.
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
            It does not buy essay text. Paid feedback points at the sentences
            that are not working in your own draft and explains why. It will
            never hand you a rewritten paragraph, a suggested sentence, or a
            fill-in-the-blank outline. That limit applies to paying users
            exactly as much as to everyone else.
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
