import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Who built ${SITE_NAME}, and why it exists.`,
};

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          About
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Built by someone who went through this cycle recently enough to still
          be annoyed by it.
        </p>
      </header>

      <Reveal>
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid gap-0 sm:grid-cols-[minmax(0,280px)_1fr]">
            <div className="relative bg-navy-900">
              <Image
                src="/img/dylan-960.webp"
                alt="Dylan Nguyen"
                width={960}
                height={1200}
                sizes="(max-width: 640px) 100vw, 280px"
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-7 sm:p-9">
              <h2 className="text-2xl font-semibold tracking-tight">
                Hi, I&apos;m Dylan.
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed">
                <p>
                  I&apos;m an incoming first-year medical student at the Warren
                  Alpert Medical School of Brown University. I applied in the
                  most recent cycle, which means I was staring at a spreadsheet
                  of secondaries not that long ago, trying to remember which
                  school wanted 250 words about adversity and which one wanted
                  1,500 characters.
                </p>
                <p>
                  My path here was not the standard one. I did my undergrad at
                  the University of Oregon, where I earned a Bachelor of Music in
                  Piano Performance with a chemistry minor. I still perform and
                  compete internationally. Before medical school I worked as an
                  ophthalmic technician, which is where I learned what a clinic
                  actually feels like from the inside, and where I got involved
                  in research and co-authored a case report in
                  neuro-ophthalmology.
                </p>
                <p>
                  I scored a 517 on the MCAT and a 24 on the DAT. I was accepted
                  to dental school before deciding medicine was the right fit. I
                  mention the numbers only because applicants asked me about them
                  constantly, and because I want you to know I am not guessing
                  about what this process demands.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="text-3xl font-semibold tracking-tight">
            Why {SITE_NAME} exists
          </h2>
          <div className="mt-4 max-w-2xl space-y-4 leading-relaxed text-muted">
            <p>
              Secondary prompts are public information that is weirdly hard to
              find in one place. They are scattered across forum threads,
              paywalled consulting blogs, and PDFs from three cycles ago. So the
              first thing I built was an atlas of them: free, no account, no
              email gate.
            </p>
            <p>
              The second thing I built was the tracker, because keeping track of
              what I still owed was genuinely harder than writing the essays. If
              you have ever lost a week to a secondary you forgot arrived, you
              know exactly what I mean.
            </p>
            <p>
              Eventually there will be a paid tier that gives structured feedback
              on essay drafts. Everything you see now stays free.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-2xl border border-navy-100 bg-accent-soft p-7 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            The line I will not cross
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            {SITE_NAME} will never write your essay for you. Not a paragraph,
            not a sentence, not a fill-in-the-blank outline. Feedback, when it
            launches, points at what is not working in your own words and
            explains why. If it ever hands you prose you could paste into an
            application, I have built the wrong thing.
          </p>
          <Link
            href="/how-feedback-works"
            className="mt-4 inline-block font-medium text-accent underline underline-offset-4 hover:no-underline"
          >
            Read the full policy
          </Link>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="text-3xl font-semibold tracking-tight">
            Found a wrong prompt?
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Tell me. Prompts marked &ldquo;not yet verified&rdquo; were compiled
            from public listings rather than read off a real secondary, and some
            of them are going to be wrong or out of date. If you received a
            secondary and the wording here does not match, that correction is
            worth more to this site than anything else you could send.
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Use the form below, or email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent underline underline-offset-4 hover:no-underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Send a prompt
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
