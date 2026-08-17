import Link from "next/link";
import { CompassMark } from "@/components/Logo";
import { CountUp } from "@/components/CountUp";
import { HomeSnapshot } from "@/components/HomeSnapshot";
import { Reveal } from "@/components/Reveal";
import { getStats, listSchools } from "@/lib/queries";
import { CURRENT_CYCLE } from "@/lib/config";

export const revalidate = 3600;

/**
 * The homepage has two jobs and they belong to different people.
 *
 * A returning applicant gets their own status first (HomeSnapshot), because
 * for them this is a headquarters, not a pitch. A first-time visitor never
 * sees that block and gets the hero instead.
 *
 * The three stages are presented as one timeline rather than a feature grid.
 * The product's argument is that these are one continuous job, and a grid of
 * equal cards quietly says the opposite.
 */
export default async function HomePage() {
  const [stats, schools] = await Promise.all([getStats(), listSchools()]);
  const withoutPrompts = schools.length - stats.schools;

  const STAGES = [
    {
      n: "01",
      href: "/planner",
      when: "Every week, all four years",
      title: "Planner",
      lead: "Your week, entered once.",
      body: "Classes, shifts, lab hours, volunteering, standing meetings. The planner totals them by category every week, which means the hours question on your application is already answered before anyone asks it.",
      points: [
        "A repeating week, not 52 copies of the same entry",
        "Hours per category, split into what counts on AMCAS and what does not",
        "Double-booked blocks flagged before you commit to both",
        "Export the whole week to a spreadsheet",
      ],
      cta: "Lay out my week",
    },
    {
      n: "02",
      href: "/primary",
      when: "Sophomore year through May",
      title: "Primary",
      lead: "Log it while you remember it.",
      body: "Hours, dates, and the supervisor's email for every activity, captured while you still see these people. Then turn those entries into your fifteen Work & Activities descriptions and your personal statement, with AMCAS limits counted live.",
      points: [
        "18 AMCAS categories, hours done and hours planned kept separate",
        "Verifier contact per entry, with a nag until you have one",
        "Personal statement at 5,300 characters",
        "Letters of recommendation, from asked to submitted",
      ],
      cta: "Start logging",
    },
    {
      n: "03",
      href: "/secondaries",
      when: "June through September",
      title: "Secondaries",
      lead: "Twenty applications, eight actual questions.",
      body: "Every prompt we have, per school, broken into individual essays you track one at a time. The overlap view groups your own schools by question type, so you write once and adapt instead of starting over twenty times.",
      points: [
        `${stats.prompts.toLocaleString()} prompts across ${stats.schools} of ${schools.length} MD programs`,
        "Each essay tracked: not started, drafting, done, submitted",
        "Overlap across your list, with the tightest limit to write to",
        "Deadlines closing in float to the top",
      ],
      cta: "Track secondaries",
    },
    {
      n: "04",
      href: "/interviews",
      when: "September through March",
      title: "Interviews",
      lead: "The part that is pure logistics.",
      body: "Invites, dates, formats, and the thank-you notes everybody forgets. Plus a question bank that tells you what each question is actually testing, rather than handing you an answer to memorize.",
      points: [
        "Invited, scheduled, interviewed, decision",
        "Traditional, MMI, panel, mixed",
        "Loud reminders for unsent thank-you notes",
        "27 questions with what the interviewer is listening for",
      ],
      cta: "Prep interviews",
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Returning users see their status here instead of the pitch. */}
      <HomeSnapshot />

      {/* Hero */}
      <section className="-mx-5 -mt-10 overflow-hidden bg-navy-900 px-5 py-16 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-12 sm:py-20">
        <CompassMark className="h-12 w-12 text-white/70" />
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          Navigate your way through the application cycle.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-100 sm:text-xl">
          Four years of work with no system attached to it. MD Atlas is the one
          place it all lives — the week you are actually living, the hours it
          adds up to, the twenty secondaries in August, the interview invites in
          November.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="lift rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy-900 hover:bg-navy-100"
          >
            Open my dashboard
          </Link>
          <Link
            href="/prompts"
            className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Just browse the prompts
          </Link>
        </div>
        <p className="mt-6 text-sm text-navy-100">
          Free. No account needed to start.
        </p>
      </section>

      {/* Stats */}
      <Reveal>
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            By the numbers
          </h2>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { n: schools.length, label: "MD programs" },
              { n: stats.prompts, label: "Secondary prompts" },
              { n: stats.schools, label: "Programs with prompts" },
              { n: 0, label: "Dollars to use it", literal: "$0" },
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

      {/* The three stages, as one timeline */}
      <section aria-labelledby="stages-heading">
        <Reveal>
          <div className="max-w-2xl">
            <h2
              id="stages-heading"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              One application. Four very different jobs.
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Most tools pick one of these. The point of MD Atlas is that they
              feed each other: the hours in your week become the hours on your
              application, and what you did there is what they ask about in the
              interview.
            </p>
          </div>
        </Reveal>

        <ol className="mt-10 space-y-5">
          {STAGES.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <li className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="grid gap-0 md:grid-cols-[minmax(0,260px)_1fr]">
                  <div className="border-b border-line bg-navy-900 p-6 text-white md:border-r md:border-b-0">
                    <span className="text-xs font-semibold tracking-widest text-navy-100">
                      {s.n}
                    </span>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-navy-100">{s.when}</p>
                    <Link
                      href={s.href}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-navy-100"
                    >
                      {s.cta}
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>

                  <div className="p-6 sm:p-7">
                    <p className="text-lg font-medium tracking-tight">
                      {s.lead}
                    </p>
                    <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {s.points.map((p) => (
                        <li
                          key={p}
                          className="flex gap-2 text-sm leading-relaxed text-muted"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Why it is free, and what is not */}
      <Reveal>
        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-2xl font-semibold tracking-tight">
              Yours, and portable
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted">
              <p>
                Everything works with no account. What you track stays in your
                browser, and you can export all of it whenever you like.
              </p>
              <p>
                Add an email only if you want your dashboard on your phone as
                well as your laptop. No password, just a link.
              </p>
            </div>
            <Link
              href="/privacy"
              className="mt-5 inline-block font-medium text-accent underline underline-offset-4 hover:no-underline"
            >
              How your data is handled
            </Link>
          </div>

          {/* This is a marketing asset, not fine print. Premed communities are
              hostile to ghostwriting tools; drawing the line loudly is the point. */}
          <div className="rounded-2xl border border-navy-100 bg-accent-soft p-7">
            <h2 className="text-2xl font-semibold tracking-tight">
              We will never write your essay
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed">
              <p>
                When essay feedback launches it will be diagnostic only: it
                points at the sentences that are not working and tells you why.
              </p>
              <p>
                No rewritten paragraphs, no suggested sentences, no
                fill-in-the-blank outlines. If our output ever contains text you
                could paste into an application, we have built the wrong thing.
              </p>
            </div>
            <Link
              href="/how-feedback-works"
              className="mt-5 inline-block font-medium text-accent underline underline-offset-4 hover:no-underline"
            >
              Read the full policy
            </Link>
          </div>
        </section>
      </Reveal>

      {/* Honesty about the data */}
      <Reveal>
        <section className="rounded-2xl border border-warn/30 bg-warn-soft p-7 sm:p-10">
          <h2 className="text-xl font-semibold tracking-tight text-warn">
            Where the prompt data stands
          </h2>
          <div className="mt-3 max-w-2xl space-y-3 leading-relaxed text-warn">
            <p>
              We hold {stats.prompts.toLocaleString()} prompts covering{" "}
              {stats.schools} of the {schools.length} MD programs listed. Every
              one carries the source it was read from and the cycle it was
              reported for.
            </p>
            <p>
              Almost all of it was compiled from aggregators and applicant
              reports, not read off the school&apos;s own secondary, so treat it
              as a head start rather than gospel. Schools change prompts without
              notice and most do not publish them until they send you the
              secondary. Confirm against the real thing before you write.
            </p>
            {withoutPrompts > 0 && (
              <p>
                {withoutPrompts} programs still have nothing collected. Their
                pages say so plainly instead of guessing.
              </p>
            )}
          </div>
          <Link
            href="/submit"
            className="lift mt-5 inline-block rounded-xl bg-warn px-5 py-2.5 text-sm font-semibold text-white"
          >
            Got a secondary? Send us the prompts
          </Link>
        </section>
      </Reveal>

      {/* Closing */}
      <Reveal>
        <section className="rounded-2xl bg-navy-900 p-8 text-center text-white sm:p-12">
          <CompassMark className="mx-auto h-10 w-10 text-white/70" />
          <h2 className="mx-auto mt-5 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Start wherever you actually are.
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-navy-100">
            Sophomore with a chaotic schedule? Start at the planner. Two years
            out and just want somewhere to put your hours? Primary. Secondaries
            already piling up? Start there. Nothing has to be filled in for the
            rest to work.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/planner"
              className="lift rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy-900 hover:bg-navy-100"
            >
              Planner
            </Link>
            <Link
              href="/primary"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Primary
            </Link>
            <Link
              href="/secondaries"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Secondaries
            </Link>
            <Link
              href="/interviews"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Interviews
            </Link>
          </div>
          <p className="mt-6 text-sm text-navy-100">
            {CURRENT_CYCLE} cycle · free · no account required
          </p>
        </section>
      </Reveal>
    </div>
  );
}
