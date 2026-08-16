import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromptCard } from "@/components/PromptCard";
import { CURRENT_CYCLE } from "@/lib/config";
import {
  getSchoolBySlug,
  getSchoolPrompts,
  listSchools,
  type PromptRow,
} from "@/lib/queries";

export const revalidate = 3600;

/** Pre-render every school page at build time. These are the SEO surface. */
export async function generateStaticParams() {
  const schools = await listSchools();
  return schools.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school) return {};

  return {
    title: `${school.name} secondary essay prompts`,
    description: `Secondary application essay prompts for ${school.name}, with word and character limits, for the ${CURRENT_CYCLE} cycle.`,
  };
}

function groupByCycle(rows: PromptRow[]): [string, PromptRow[]][] {
  const map = new Map<string, PromptRow[]>();
  for (const r of rows) {
    const list = map.get(r.cycleYear) ?? [];
    list.push(r);
    map.set(r.cycleYear, list);
  }
  // Newest cycle first.
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [school, rows] = await Promise.all([
    getSchoolBySlug(slug),
    getSchoolPrompts(slug),
  ]);

  if (!school) notFound();

  const byCycle = groupByCycle(rows);
  const sourceUrl = rows.find((r) => r.source)?.source ?? null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/schools"
          className="text-xs text-accent underline underline-offset-2 hover:no-underline"
        >
          &larr; All schools
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {school.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {[school.city, school.state].filter(Boolean).join(", ")}
          {school.degree && ` · ${school.degree}`}
          {rows.length > 0 && ` · ${rows.length} prompts on file`}
        </p>
        {school.websiteUrl && (
          <a
            href={school.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-accent underline underline-offset-2 hover:no-underline"
          >
            School admissions page
          </a>
        )}
      </div>

      {byCycle.length === 0 && (
        <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">
            No prompts on file yet
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            {school.name} is listed because it is an accredited MD program, but
            its secondary prompts have not been collected yet. Many schools do
            not publish their prompts at all until they send you a secondary.
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            If you received a secondary from this school, sending the prompts
            along is the single most useful thing you could do for the next
            applicant.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/prompts"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              Browse schools we do have
            </Link>
            <Link
              href="/my-schools"
              className="rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Track this school anyway
            </Link>
          </div>
        </section>
      )}

      {byCycle.map(([cycle, list]) => (
        <section key={cycle}>
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {cycle} cycle
            {cycle !== CURRENT_CYCLE && (
              <span className="ml-2 font-normal text-muted normal-case">
                (prior cycle — may not repeat)
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {list.map((p) => (
              <PromptCard key={p.id} prompt={p} showSchool={false} />
            ))}
          </div>
        </section>
      ))}

      {sourceUrl && (
        <p className="text-xs text-muted">
          Compiled from public sources including{" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline underline-offset-2"
          >
            this listing
          </a>
          . Verify against the school&apos;s own application before you write.
        </p>
      )}
    </div>
  );
}
