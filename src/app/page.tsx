import Link from "next/link";
import { CompassMark } from "@/components/Logo";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";
import { getStats, listPromptTypes, listSchools } from "@/lib/queries";
import { CURRENT_CYCLE } from "@/lib/config";

export const revalidate = 3600;

export default async function HomePage() {
  const [stats, types, schools] = await Promise.all([
    getStats(),
    listPromptTypes(),
    listSchools(),
  ]);

  const withoutPrompts = schools.length - stats.schools;

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="-mx-5 -mt-10 overflow-hidden bg-navy-900 px-5 py-16 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-12 sm:py-20">
        <CompassMark className="h-12 w-12 text-white/70" />
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          Navigate your way through the application cycle.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-100 sm:text-xl">
          Primaries are one big push. Then twenty secondaries arrive, then the
          interviews. MD Atlas is where you keep track of all of it: every
          prompt, every essay, every invite, in one place.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/primary"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy-900 transition-transform hover:scale-[1.02] hover:bg-navy-100"
          >
            Start with my activities
          </Link>
          <Link
            href="/my-schools"
            className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Open my dashboard
          </Link>
        </div>
      </section>

      {/* Stats */}
      <Reveal>
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            By the numbers
          </h2>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { n: schools.length, label: "MD programs listed" },
              { n: stats.prompts, label: "Prompts on file" },
              { n: types.length - 1, label: "Question types" },
              { n: 0, label: "Accounts required", literal: "0" },
            ].map((s) => (
              <div key={s.label}>
                <dd className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {s.literal ?? <CountUp to={s.n} />}
                </dd>
                <dt className="mt-1.5 text-sm text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      {/* Three things */}
      <section aria-labelledby="features-heading">
        <Reveal>
          <h2
            id="features-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
One place for the whole cycle.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              href: "/primary",
              step: "01",
              title: "Primary",
              body: "Log hours and supervisor contacts as you go, years before you apply. Then turn them into your fifteen Work & Activities entries with live character counts.",
              cta: "Start logging",
            },
            {
              href: "/my-schools",
              step: "02",
              title: "Secondaries",
              body: "Every prompt for every school, your essays tracked one by one, and the overlap between schools so you write once and adapt.",
              cta: "Track secondaries",
            },
            {
              href: "/interview-prep",
              step: "03",
              title: "Interviews",
              body: "Invites, dates, formats and thank-you notes, plus what each interview question is really testing.",
              cta: "Prep interviews",
            },
          ].map((card, i) => (
            <Reveal key={card.href} delay={i * 90}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-navy-900/5"
              >
                <span className="text-xs font-semibold tracking-widest text-accent/60">
                  {card.step}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {card.body}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  {card.cta}
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* This is a marketing asset, not fine print. Premed communities are
          hostile to ghostwriting tools; drawing the line loudly is the point. */}
      <Reveal>
        <section className="rounded-2xl border border-navy-100 bg-accent-soft p-7 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            We will never write your essay for you.
          </h2>
          <div className="mt-4 max-w-2xl space-y-3 leading-relaxed">
            <p>
              When we launch essay feedback, it will be diagnostic only. It
              points at the sentences that are not working and tells you why: a
              trait you asserted without evidence, an opening that takes three
              sentences to start, a &ldquo;why us&rdquo; paragraph that would
              apply to any school in the country.
            </p>
            <p>
              It will not hand you replacement prose. No rewritten paragraphs,
              no suggested sentences, no fill-in-the-blank outlines. If our
              output ever contains text you could paste into an application, we
              have built the wrong thing.
            </p>
          </div>
          <Link
            href="/how-feedback-works"
            className="mt-5 inline-block font-medium text-accent underline underline-offset-4 hover:no-underline"
          >
            Read the full policy
          </Link>
        </section>
      </Reveal>

      {/* Prompt types */}
      <Reveal>
        <section>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Jump to a question type
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Filter to every school asking the same thing, then write once and
            adapt.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {types
              .filter((t) => t.key !== "administrative")
              .map((t) => (
                <Link
                  key={t.key}
                  href={`/prompts?type=${t.key}`}
                  className="rounded-full border border-line-strong bg-surface px-4 py-2 text-sm transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                >
                  {t.label}
                </Link>
              ))}
          </div>
        </section>
      </Reveal>

      {/* Honesty about the data */}
      <Reveal>
        <section className="rounded-2xl border border-warn/30 bg-warn-soft p-7 sm:p-10">
          <h2 className="text-xl font-semibold tracking-tight text-warn">
            Where the {CURRENT_CYCLE} data stands
          </h2>
          <div className="mt-3 max-w-2xl space-y-3 leading-relaxed text-warn">
            <p>
              Schools change their prompts without notice, and most do not
              publish them at all until they send you a secondary. Every prompt
              here is labeled with the cycle it was reported for and whether it
              has been verified against the school&apos;s own materials. Treat
              an unverified prompt as a preview, not a guarantee.
            </p>
            <p>
              {withoutPrompts} of the {schools.length} programs listed have no
              prompts collected yet. Their pages say so plainly rather than
              pretending otherwise.
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
