import Link from "next/link";
import { getStats, listPromptTypes, listSchools } from "@/lib/queries";
import { CURRENT_CYCLE } from "@/lib/config";

export const revalidate = 3600;

export default async function HomePage() {
  const [stats, types, schools] = await Promise.all([
    getStats(),
    listPromptTypes(),
    listSchools(),
  ]);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="-mx-5 -mt-10 bg-navy-900 px-5 py-14 text-white sm:rounded-2xl sm:mx-0 sm:mt-0 sm:px-10 sm:py-16">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
          Every secondary prompt, in one searchable place.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-100">
          {stats.prompts.toLocaleString()} secondary essay prompts across{" "}
          {schools.length} US MD programs. Filter by school, question type, and
          length. Track what you still owe. Free, no account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/prompts"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-navy-100"
          >
            Browse prompts
          </Link>
          <Link
            href="/my-schools"
            className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Track my secondaries
          </Link>
        </div>
      </section>

      {/* The three things it does */}
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">
          What this site does
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "/prompts",
              title: "Search every prompt",
              body: `${stats.prompts.toLocaleString()} prompts, filterable by school, question type, and word or character limit.`,
              cta: "Browse prompts",
            },
            {
              href: "/overlap",
              title: "Find the overlap",
              body: "Most secondaries ask the same eight questions. See which schools ask each one, and write it once.",
              cta: "See the overlap",
            },
            {
              href: "/my-schools",
              title: "Track what you owe",
              body: "Not started, drafting, done, submitted. Deadlines closing in float to the top.",
              cta: "Open my list",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-line bg-surface p-6 hover:border-accent"
            >
              <h3 className="font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {card.body}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-accent group-hover:underline group-hover:underline-offset-4">
                {card.cta} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* This is a marketing asset, not fine print. Premed communities are
          hostile to ghostwriting tools; drawing the line loudly is the point. */}
      <section className="rounded-xl border border-navy-100 bg-accent-soft p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          We will never write your essay for you.
        </h2>
        <div className="mt-4 max-w-2xl space-y-3 leading-relaxed">
          <p>
            When we launch essay feedback, it will be diagnostic only. It points
            at the sentences that are not working and tells you why: a trait you
            asserted without evidence, an opening that takes three sentences to
            start, a &ldquo;why us&rdquo; paragraph that would apply to any
            school in the country.
          </p>
          <p>
            It will not hand you replacement prose. No rewritten paragraphs, no
            suggested sentences, no fill-in-the-blank outlines. If our output
            ever contains text you could paste into an application, we have built
            the wrong thing.
          </p>
        </div>
        <Link
          href="/how-feedback-works"
          className="mt-5 inline-block font-medium text-accent underline underline-offset-2 hover:no-underline"
        >
          Read the full policy
        </Link>
      </section>

      {/* Prompt types */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          Jump to a question type
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Filter to every school asking the same thing, then write once and
          adapt.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {types
            .filter((t) => t.key !== "administrative")
            .map((t) => (
              <Link
                key={t.key}
                href={`/prompts?type=${t.key}`}
                className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm hover:border-accent hover:bg-accent-soft hover:text-accent"
              >
                {t.label}
              </Link>
            ))}
        </div>
      </section>

      {/* Honesty about the data */}
      <section className="rounded-xl border border-warn/30 bg-warn-soft p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-warn">
          About the {CURRENT_CYCLE} data
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-warn">
          Schools change their prompts without notice, and many do not publish
          them until they send you a secondary. Every prompt here is labeled with
          the cycle it was reported for and whether it has been verified against
          the school&apos;s own materials. Treat an unverified prompt as a
          preview, not a guarantee.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-warn">
          {schools.length - stats.schools} of the {schools.length} programs
          listed have no prompts on file yet. Their pages say so plainly rather
          than pretending otherwise.
        </p>
      </section>
    </div>
  );
}
