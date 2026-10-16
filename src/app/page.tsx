import Image from "next/image";
import Link from "next/link";
import { HomeSnapshot } from "@/components/HomeSnapshot";
import { Reveal } from "@/components/Reveal";
import { getStats, listSchools } from "@/lib/queries";
import { TOTAL_QUESTIONS } from "@/lib/interview-questions";
import { CycleRoute } from "@/components/CycleRoute";
import {
  InterviewsPreview,
  PlannerPreview,
  PrimaryPreview,
  SecondariesPreview,
} from "@/components/StagePreviews";

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
      href: "/planner",
      when: "Every week, all four years",
      title: "Planner",
      body: "Put in your classes, shifts, lab time, and volunteering once. The planner adds up your hours by category every week, so you have real numbers when AMCAS asks for them.",
      cta: "Lay out my week",
      preview: <PlannerPreview />,
    },
    {
      href: "/primary",
      when: "Sophomore year through May",
      title: "Primary",
      body: "Log each activity with its hours, dates, and a supervisor you can list as a contact. When you apply, write your Work & Activities entries and personal statement here, with the AMCAS character limits counted as you type.",
      cta: "Start logging",
      preview: <PrimaryPreview />,
    },
    {
      href: "/secondaries",
      when: "June through September",
      title: "Secondaries",
      body: "Add your schools and we fill in the prompts we have for each one. You can see which schools ask the same question, so you write one essay and adjust it instead of starting over each time.",
      cta: "Track secondaries",
      preview: <SecondariesPreview />,
    },
    {
      href: "/interviews",
      when: "September through March",
      title: "Interviews",
      body: `Keep track of invites, dates, and formats, with a reminder for any thank-you note you haven't sent. There are also ${TOTAL_QUESTIONS} practice questions, each with a short note on what the interviewer wants to learn from your answer.`,
      cta: "Prep interviews",
      preview: <InterviewsPreview />,
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
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl">
                Your med school application, in one place.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">
                Log your hours as you go, keep up with every secondary, and
                get ready for interviews. It&apos;s free, and you can start
                with whichever part you need right now.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href="/dashboard"
                  className="lift rounded-full bg-white px-7 py-3.5 text-base font-semibold text-navy-900 hover:bg-navy-50"
                >
                  Open my dashboard
                </Link>
                <p className="text-sm text-navy-100">
                  The planner and activity log work without an account.
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
, a medical student at Brown who wanted something
            like this when he applied and couldn&apos;t find it.{" "}
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
              What&apos;s in it
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              One part for each stage of applying. They share what you
              enter, so the hours in your planner carry over to your
              activities.
            </p>
          </div>
        </Reveal>

        {/* Plain rows split by a rule, not four identical boxes. The stages
            are a sequence, but the order is carried by the "when" line and
            the reading order; numbered badges added nothing. */}
        <ol className="mt-10 divide-y divide-line border-y border-line">
          {STAGES.map((s) => (
            <li
              key={s.title}
              className="grid gap-8 py-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14 md:py-16"
            >
              <div>
                <p className="text-sm text-muted">{s.when}</p>
                <h3 className="mt-1 text-3xl font-semibold sm:text-4xl">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted">
                  {s.body}
                </p>
                <Link
                  href={s.href}
                  className="mt-6 inline-block rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
                >
                  {s.cta}
                </Link>
              </div>
              <div>{s.preview}</div>
            </li>
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
          className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14"
        >
          <h2
            id="faq-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Questions
          </h2>
          <div className="divide-y divide-line border-y border-line">
            <details className="group py-5">
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
                Yes. The planner, activity log, prompt database, and the
                secondaries and interviews trackers are all free, with no
                limit on schools or essays. Pro adds the full Essay Map and
                ranked suggestions, and later, feedback on your drafts.{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  See the full breakdown
                </Link>
                .
              </div>
            </details>

            <details className="group py-5">
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
                Mostly from prep sites and past applicants, not from the
                schools themselves. Each prompt shows where it came from and
                which year it was reported for. Schools change their prompts,
                so check against your actual secondary before you write. We
                have{" "}
                {stats.prompts.toLocaleString()} prompts across{" "}
                {stats.schools} of {schools.length} programs
                {withoutPrompts > 0
                  ? `. ${withoutPrompts} have none yet`
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

            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                Do I need an account?
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 leading-relaxed text-muted">
                Not for the planner or activity log. Secondaries and
                interviews need a free Google sign-in, so your school list is
                backed up and works on any device.
              </div>
            </details>
            <details className="group py-5">
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
                It stays as long as you want it. You can download everything
                as a spreadsheet anytime. If you delete your account, the
                copy on our server is erased right away, and the copy in your
                browser stays until you clear it.
              </div>
            </details>

            <details className="group py-5">
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
                No. MD Atlas will never write or rewrite your essays, on any
                plan.{" "}
                <Link
                  href="/how-feedback-works"
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  Read the full policy
                </Link>
                .
              </div>
            </details>

            <details className="group py-5">
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
