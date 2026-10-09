import Image from "next/image";
import Link from "next/link";
import { CompassMark } from "@/components/Logo";
import { HomeSnapshot } from "@/components/HomeSnapshot";
import { Reveal } from "@/components/Reveal";
import { getStats, listSchools } from "@/lib/queries";
import { TOTAL_QUESTIONS } from "@/lib/interview-questions";
import { CycleRoute } from "@/components/CycleRoute";

export const revalidate = 3600;

/**
 * The homepage has two jobs and they belong to different people.
 *
 * A returning applicant gets their own status first (HomeSnapshot), because
 * for them this is a headquarters, not a pitch. A first-time visitor never
 * sees that block and gets the hero instead — kept short enough to fit one
 * screen, since a scroll before the pitch even starts loses people.
 *
 * The four stages are presented as one timeline rather than a feature grid.
 * The product's argument is that these are one connected process, and a grid
 * of equal cards quietly says the opposite.
 *
 * Everything below the stages used to also cover "is this free," "where do
 * prompts come from," and "do you write essays" as full standalone sections.
 * The FAQ says the same things in less space, so it is the only place that
 * ground gets covered now.
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
        "Hours per category, split into what counts on AMCAS and what does not",
        "Double-booked blocks flagged before you commit to both",
      ],
      cta: "Lay out my week",
      img: "/img/screenshots/planner.webp",
      imgAlt:
        "The MD Atlas planner showing a week's scheduled hours, application hours, and double-booked blocks",
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
      ],
      cta: "Start logging",
      img: "/img/screenshots/primary.webp",
      imgAlt:
        "The MD Atlas primary application page showing activity counts, hours logged, and a Work & Activities entry",
    },
    {
      n: "03",
      href: "/secondaries",
      when: "June through September",
      title: "Secondaries",
      lead: "Twenty applications, eight actual questions.",
      body: "Every prompt we have, per school, broken into individual essays you track one at a time. The overlap view groups your own schools by question type, so you write once and adapt instead of starting over twenty times.",
      points: [
        "Each essay tracked: not started, drafting, done, submitted",
        "Overlap across your list, with the tightest limit to write to",
      ],
      cta: "Track secondaries",
      img: "/img/screenshots/secondaries.webp",
      imgAlt:
        "The MD Atlas secondaries tracker showing schools by status, with prompts collected across programs",
    },
    {
      n: "04",
      href: "/interviews",
      when: "September through March",
      title: "Interviews",
      lead: "The part that is pure logistics.",
      body: "Invites, dates, formats, and the thank-you notes everybody forgets. Plus a question bank that tells you what each question is actually testing, rather than handing you an answer to memorize.",
      points: [
        "Loud reminders for unsent thank-you notes",
        `${TOTAL_QUESTIONS} questions with what the interviewer is listening for`,
      ],
      cta: "Prep interviews",
      img: "/img/screenshots/interviews.webp",
      imgAlt:
        "The MD Atlas interviews page showing an interview pipeline with dates, formats, and decisions",
    },
  ];

  return (
    <div className="space-y-20 pb-10 sm:space-y-28 sm:pb-16">
      {/* Returning users see their status here instead of the pitch. */}
      <HomeSnapshot />

      {/* Hero. Kept short enough to fit one screen on arrival — the pitch,
          not a scroll, is the first thing a new visitor should have to do. */}
      <div className="space-y-5">
        <section className="-mx-5 -mt-12 overflow-hidden bg-navy-900 px-5 py-12 text-white sm:mx-0 sm:-mt-4 sm:rounded-3xl sm:px-12 sm:py-16">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16">
            <div>
              <CompassMark className="h-10 w-10 text-navy-100/70" />
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl">
                The operating system for your medical school application.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">
                The hours, the activities, the secondaries, the interviews:
                four years of work in one place. Start anywhere. Nothing has
                to be filled in for the rest to work.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href="/dashboard"
                  className="lift rounded-full bg-white px-7 py-3.5 text-base font-semibold text-navy-900 hover:bg-navy-50"
                >
                  Open my dashboard
                </Link>
                <p className="text-sm text-navy-100">
                  Free. No account needed to start.
                </p>
              </div>
            </div>

            <CycleRoute now={new Date()} />
          </div>
        </section>

        {/* Founder line: who built this and why, in Dylan's own words — not
            marketing copy. Lives just outside the hero card, not inside it,
            so the card itself stays short enough to fit one screen. Full
            story lives at /about. */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-line">
            <Image
              src="/img/dylan-480.webp"
              alt="Dylan Nguyen"
              width={480}
              height={600}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            <span className="font-semibold text-foreground">
              Built by Dylan
            </span>
            , a medical student who wanted this tracker during his own
            application cycle and it didn&apos;t exist.{" "}
            <Link
              href="/about"
              className="whitespace-nowrap font-medium text-accent underline underline-offset-4 hover:no-underline"
            >
              More
            </Link>
          </p>
        </div>
      </div>

      {/* The three stages, as one timeline */}
      <section aria-labelledby="stages-heading">
        <Reveal>
          <div className="max-w-2xl">
            <h2
              id="stages-heading"
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              One application. Four connected stages.
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Most tools handle one of these and stop there. MD Atlas
              connects them: the hours in your week become the hours on
              your application, and what you did there is what they ask
              about in the interview.
            </p>
          </div>
        </Reveal>

        <ol className="mt-12 space-y-8">
          {STAGES.map((s, i) => (
              <Reveal key={s.title} delay={i * 70}>
                <li className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="grid gap-0 md:grid-cols-[minmax(0,260px)_1fr]">
                    <div className="border-b border-line bg-sunken p-7 sm:p-8 md:border-r md:border-b-0">
                      <span className="font-display text-4xl font-semibold text-accent tabular-nums">
                        {s.n}
                      </span>
                      <h3 className="mt-3 text-3xl font-semibold">
                        {s.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted">{s.when}</p>
                      <Link
                        href={s.href}
                        className="mt-6 inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
                      >
                        {s.cta}
                      </Link>
                    </div>

                    <div className="p-7 sm:p-9">
                      <p className="font-display text-2xl font-semibold">
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

                      <div className="mt-5 overflow-hidden rounded-xl border border-line">
                        <Image
                          src={s.img}
                          alt={s.imgAlt}
                          width={1120}
                          height={699}
                          sizes="(max-width: 768px) 100vw, 640px"
                          className="h-auto w-full"
                        />
                      </div>
                    </div>
                  </div>
                </li>
              </Reveal>
          ))}
        </ol>
      </section>

      {/* The "yours and portable" / feedback-policy / prompt-honesty content
          that used to live here as three separate cards was saying the same
          things the FAQ says right below, just at greater length and with
          more visual weight than a first-time visitor needs. Their unique
          bits — the live prompt count and the submit-a-prompt CTA — moved
          into the FAQ's prompts answer instead of disappearing. */}

      {/* FAQ */}
      <Reveal>
        <section
          aria-labelledby="faq-heading"
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="faq-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface text-left">
            <details className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                Is this really free?
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 leading-relaxed text-muted">
                Yes. The planner, the primary log, the full prompt database,
                and the whole secondaries and interviews tracker are free
                forever, with no cap on schools or essays and no account
                required. The only thing that will ever cost anything is
                going deeper than a first look at the Essay Map, and,
                eventually, structured feedback on your drafts.{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  See the full breakdown
                </Link>
                .
              </div>
            </details>

            <details className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                Where do the prompts come from, and how current are they?
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 leading-relaxed text-muted">
                Mostly aggregators and past applicants&apos; reports, not
                schools&apos; own admissions pages, so treat them as a head
                start, not gospel. Every prompt shows the source it came from
                and the cycle it was reported for, and schools change prompts
                without notice. Confirm against your actual secondary before
                you write a word. We currently hold{" "}
                {stats.prompts.toLocaleString()} prompts across{" "}
                {stats.schools} of {schools.length} programs
                {withoutPrompts > 0
                  ? `. ${withoutPrompts} still have nothing collected, and their pages say so plainly`
                  : ""}
                .{" "}
                <Link
                  href="/submit"
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  Got a secondary? Send us the prompts
                </Link>
                .
              </div>
            </details>

            <details className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                What happens to my data after my cycle ends?
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 leading-relaxed text-muted">
                Nothing, automatically. It just stays there, yours, for as
                long as you want it. Export everything as JSON or CSV from
                your account page, or a full spreadsheet from the dashboard,
                whenever you like. Delete your account and its synced copy is
                gone immediately; what is saved in your own browser is never
                touched unless you clear it yourself.
              </div>
            </details>

            <details className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                Do you write essays for me?
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 leading-relaxed text-muted">
                No. Never a rewritten paragraph, a suggested sentence, or a
                fill-in-the-blank outline, not for free accounts, not for
                paying ones, not once feedback ships.{" "}
                <Link
                  href="/how-feedback-works"
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  Read the full policy
                </Link>
                .
              </div>
            </details>

            <details className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                Who made this?
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 leading-relaxed text-muted">
                One person: Dylan, a first-year medical student at Brown who
                applied in the 2025-2026 cycle and built the tracker he wanted and
                didn&apos;t have.{" "}
                <Link
                  href="/about"
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  Read more
                </Link>
                .
              </div>
            </details>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
