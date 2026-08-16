import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How our feedback works",
  description:
    "We give diagnostic feedback on medical school application essays. We never write, rewrite, or suggest prose. Here is exactly where the line is.",
};

export default function PolicyPage() {
  return (
    <article className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          How our feedback works
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Essay feedback is the paid part of this site. It is not built yet.
          When it ships, it will work like this, and this page is the promise we
          are making before we take anyone&apos;s money.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">
          We never write your essay
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            No rewritten paragraphs. No suggested sentences. No fill-in-the-blank
            outlines. No &ldquo;here is how you could phrase that.&rdquo; If our
            output ever contains prose you could paste into an application, we
            have built the wrong thing and we want to hear about it.
          </p>
          <p>
            The words in your application have to be yours. That is not only an
            ethics position, it is a practical one: admissions committees read
            thousands of these, and an essay assembled from suggested phrasing
            reads exactly like an essay assembled from suggested phrasing.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">
          What you get instead
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Feedback comes back in fixed categories, every time, so you can tell
          whether a revision actually fixed anything.
        </p>
        <dl className="mt-5 space-y-4 text-sm">
          {[
            {
              term: "Prompt adherence",
              def: "Does this answer the question that was asked, or a nearby question you would rather answer?",
            },
            {
              term: "Specificity",
              def: "We quote the exact sentences that could appear in anyone's essay. If a line would survive being copied into a stranger's application, it is not doing work.",
            },
            {
              term: "Show vs. tell",
              def: "We flag traits you assert without evidence. Saying you are resilient is not evidence that you are resilient.",
            },
            {
              term: "Structure",
              def: "Opening, arc, closing. We flag throat-clearing first sentences: the ones that take three lines to start saying anything.",
            },
            {
              term: "Length",
              def: "Over or under the limit, and which passages carry the least weight per word.",
            },
            {
              term: "School fit",
              def: "For \"why us\" prompts only. We flag anything generic enough to apply to any school in the country.",
            },
          ].map((row) => (
            <div key={row.term}>
              <dt className="font-medium">{row.term}</dt>
              <dd className="mt-1 text-muted">{row.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">
          What we do not claim
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>
            We are not affiliated with, endorsed by, or connected to the AAMC,
            AMCAS, or any medical school.
          </li>
          <li>
            We do not promise, imply, or estimate any admissions outcome. Nobody
            selling you anything can.
          </li>
          <li>
            Our prompt database is compiled from public sources and may be
            incomplete or out of date. Always confirm against the school&apos;s
            own application.
          </li>
        </ul>
      </section>
    </article>
  );
}
