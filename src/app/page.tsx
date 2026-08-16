import Link from "next/link";
import { getStats, listPromptTypes } from "@/lib/queries";
import { CURRENT_CYCLE } from "@/lib/config";

export const revalidate = 3600;

export default async function HomePage() {
  const [stats, types] = await Promise.all([getStats(), listPromptTypes()]);

  return (
    <div className="space-y-16">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Every secondary prompt, in one searchable place.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {stats.prompts.toLocaleString()} secondary essay prompts from{" "}
          {stats.schools} US MD programs. Filter by school, prompt type, and
          length, so you can see which essays overlap before you start writing.
          Free, no account needed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/prompts"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Browse prompts
          </Link>
          <Link
            href="/schools"
            className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Browse by school
          </Link>
        </div>
      </section>

      {/* This is a marketing asset, not fine print. Premed communities are
          hostile to ghostwriting tools; drawing the line loudly is the point. */}
      <section className="rounded-lg border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight">
          We will never write your essay for you.
        </h2>
        <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-muted">
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
            ever contains text you could paste into an application, we have
            built the wrong thing.
          </p>
        </div>
        <Link
          href="/how-feedback-works"
          className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
        >
          Read the full policy
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Prompts repeat. Find the overlap.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Most secondaries ask a handful of the same questions in different
          words. Filter by type to see every school asking the same thing, then
          write once and adapt.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {types
            .filter((t) => t.key !== "administrative")
            .map((t) => (
              <Link
                key={t.key}
                href={`/prompts?type=${t.key}`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
              >
                {t.label}
              </Link>
            ))}
        </div>
      </section>

      <section className="rounded-lg border border-warn/25 bg-warn-soft p-6">
        <h2 className="text-base font-semibold tracking-tight text-warn">
          About the {CURRENT_CYCLE} data
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warn/90">
          Schools change their prompts without notice, and many do not publish
          them until they send you a secondary. Every prompt here is labeled with
          the cycle it was reported for and whether we have verified it against
          the school&apos;s own materials. Treat an unverified prompt as a
          preview, not a guarantee.
        </p>
      </section>
    </div>
  );
}
