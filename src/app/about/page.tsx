import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who built the Secondary Prompt Library, and why it exists.",
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">About</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Built by someone who went through this cycle recently enough to still
          be annoyed by it.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Hi, I&apos;m Dylan.</h2>
        <div className="mt-4 max-w-2xl space-y-4 leading-relaxed">
          <p>
            I&apos;m an incoming first-year medical student at the Warren Alpert
            Medical School of Brown University. I applied in the most recent
            cycle, which means I was staring at a spreadsheet of secondaries not
            that long ago, trying to remember which school wanted 250 words
            about adversity and which one wanted 1,500 characters.
          </p>
          <p>
            My path here was not the standard one. I did my undergrad at the
            University of Oregon, where I earned a Bachelor of Music in Piano
            Performance with a chemistry minor. I still perform and compete
            internationally. Before medical school I worked as an ophthalmic
            technician, which is where I learned what a clinic actually feels
            like from the inside, and where I got involved in research and
            co-authored a case report in neuro-ophthalmology.
          </p>
          <p>
            I scored a 517 on the MCAT and a 24 on the DAT. I was accepted to
            dental school before deciding medicine was the right fit. I mention
            the numbers only because applicants asked me about them constantly,
            and because I want you to know I am not guessing about what this
            process demands.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Why this site exists
        </h2>
        <div className="mt-4 max-w-2xl space-y-4 leading-relaxed text-muted">
          <p>
            Secondary prompts are public information that is weirdly hard to
            find in one place. They are scattered across forum threads, paywalled
            consulting blogs, and PDFs from three cycles ago. So the first thing
            I built was a database of them, free, no account, no email gate.
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

      <section className="rounded-xl border border-navy-100 bg-accent-soft p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">
          The line I will not cross
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed">
          This site will never write your essay for you. Not a paragraph, not a
          sentence, not a fill-in-the-blank outline. Feedback, when it launches,
          points at what is not working in your own words and explains why. If it
          ever hands you prose you could paste into an application, I have built
          the wrong thing.
        </p>
        <Link
          href="/how-feedback-works"
          className="mt-4 inline-block font-medium text-accent underline underline-offset-2 hover:no-underline"
        >
          Read the full policy
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Found a wrong prompt?
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Tell me. Prompts marked &ldquo;not yet verified&rdquo; were compiled
          from public listings rather than read off a real secondary, and some of
          them are going to be wrong or out of date. If you received a secondary
          and the wording here does not match, that correction is worth more to
          this site than anything else you could send.
        </p>
      </section>
    </div>
  );
}
