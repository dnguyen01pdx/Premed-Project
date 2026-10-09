import { Suspense } from "react";
import Link from "next/link";
import { OLDEST_DEFAULT_CYCLE } from "@/lib/config";
import type { Metadata } from "next";
import { PromptCard } from "@/components/PromptCard";
import { PromptFilters } from "@/components/PromptFilters";
import { CountUp } from "@/components/CountUp";
import {
  countPrompts,
  getStats,
  listPromptTypes,
  listSchools,
  listStates,
  searchPrompts,
  type PromptFilters as Filters,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Browse secondary essay prompts",
  description:
    "Search every US MD secondary essay prompt by school, prompt type, and word or character limit.",
};

const RESULT_LIMIT = 200;

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function positiveInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseFilters(sp: SearchParams): Filters {
  const rawTypes = sp.type;
  return {
    q: first(sp.q)?.trim() || undefined,
    types: Array.isArray(rawTypes) ? rawTypes : rawTypes ? [rawTypes] : [],
    school: first(sp.school) || undefined,
    state: first(sp.state) || undefined,
    maxWords: positiveInt(first(sp.maxWords)),
    maxChars: positiveInt(first(sp.maxChars)),
    essaysOnly: first(sp.essaysOnly) === "1",
    includeOlder: first(sp.older) === "1",
  };
}

async function Results({
  filters,
  olderHref,
}: {
  filters: Filters;
  olderHref: string;
}) {
  const [rows, total, withOlder] = await Promise.all([
    searchPrompts(filters, { limit: RESULT_LIMIT }),
    countPrompts(filters),
    filters.includeOlder
      ? Promise.resolve(0)
      : countPrompts({ ...filters, includeOlder: true }),
  ]);
  const hiddenOlder = filters.includeOlder ? 0 : withOlder - total;
  const olderNote =
    hiddenOlder > 0 ? (
      <p className="mt-2 text-sm text-muted">
        {hiddenOlder} older {hiddenOlder === 1 ? "prompt" : "prompts"} from
        before {OLDEST_DEFAULT_CYCLE} hidden.{" "}
        <Link
          href={olderHref}
          className="font-medium text-accent underline underline-offset-2 hover:no-underline"
        >
          Show them
        </Link>
      </p>
    ) : null;

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-6 text-sm text-muted">
        No prompts match those filters. Try clearing the length limit, or
        widening the prompt type.
        {olderNote}
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted">
        {total.toLocaleString()} {total === 1 ? "prompt" : "prompts"}
        {total > rows.length && ` (showing the first ${rows.length})`}
      </p>
      {olderNote}
      <div className="mt-4 space-y-3">
        {rows.map((p) => (
          <PromptCard key={p.id} prompt={p} />
        ))}
      </div>
    </>
  );
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);

  const [types, schools, states, stats] = await Promise.all([
    listPromptTypes(),
    listSchools(),
    listStates(),
    getStats(),
  ]);

  // Serialized filters key the Suspense boundary so the results area shows a
  // fallback whenever the query changes, rather than sitting stale.
  const key = JSON.stringify(filters);

  const olderParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    for (const one of Array.isArray(v) ? v : v ? [v] : []) olderParams.append(k, one);
  }
  olderParams.set("older", "1");
  const olderHref = `/prompts?${olderParams.toString()}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          Browse secondary prompts
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Filters update the URL, so you can bookmark or share any view.
        </p>
      </div>

      {/* Used to live on the homepage as a marketing stat block. It belongs
          here instead — this is the page where these numbers are actually
          the thing you came for. */}
      <dl className="grid grid-cols-3 gap-6 border-y border-line py-6">
        {[
          { n: schools.length, label: "MD programs" },
          { n: stats.prompts, label: "Secondary prompts" },
          { n: stats.schools, label: "Programs with prompts" },
        ].map((s) => (
          <div key={s.label}>
            <dd className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              <CountUp to={s.n} />
            </dd>
            <dt className="mt-1 text-sm text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      <Suspense fallback={null}>
        <PromptFilters
          types={types.map((t) => ({ key: t.key, label: t.label }))}
          schools={schools.map((s) => ({ slug: s.slug, name: s.name }))}
          states={states}
        />
      </Suspense>

      <Suspense
        key={key}
        fallback={<p className="text-sm text-muted">Loading prompts...</p>}
      >
        <Results filters={filters} olderHref={olderHref} />
      </Suspense>
    </div>
  );
}
