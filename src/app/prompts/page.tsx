import { Suspense } from "react";
import Link from "next/link";
import { OLDEST_DEFAULT_CYCLE } from "@/lib/config";
import type { Metadata } from "next";
import { PromptCard } from "@/components/PromptCard";
import { PromptFilters } from "@/components/PromptFilters";
import { CountUp } from "@/components/CountUp";
import { ToolHeader } from "@/components/ToolHeader";
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

// Show a screenful, then grow on request. Loading every prompt at once made
// this page ~36,000px tall and slow on phones.
const PAGE_SIZE = 30;
const MAX_SHOWN = 1000;

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
  shown,
  moreHref,
}: {
  filters: Filters;
  olderHref: string;
  shown: number;
  moreHref: string;
}) {
  const [rows, total, withOlder] = await Promise.all([
    searchPrompts(filters, { limit: shown }),
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
        {total > rows.length && `, showing the first ${rows.length}`}
      </p>
      {olderNote}
      <div className="mt-4 space-y-3">
        {rows.map((p) => (
          <PromptCard key={p.id} prompt={p} />
        ))}
      </div>
      {total > rows.length && rows.length < MAX_SHOWN && (
        <div className="mt-8 text-center">
          <Link
            href={moreHref}
            scroll={false}
            className="inline-block rounded-md border border-line-strong bg-surface px-5 py-2.5"
          >
            Show {Math.min(PAGE_SIZE, total - rows.length)} more
          </Link>
        </div>
      )}
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

  const shown = Math.min(
    positiveInt(first(sp.show)) ?? PAGE_SIZE,
    MAX_SHOWN,
  );
  const moreParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "show") continue;
    for (const one of Array.isArray(v) ? v : v ? [v] : []) moreParams.append(k, one);
  }
  moreParams.set("show", String(shown + PAGE_SIZE));
  const moreHref = `/prompts?${moreParams.toString()}`;

  return (
    <div className="space-y-8">
      <ToolHeader kicker="Reference · For your secondaries" title="Browse secondary prompts">
        Search secondary prompts by school, question type, or length.
      </ToolHeader>

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
        <Results
          filters={filters}
          olderHref={olderHref}
          shown={shown}
          moreHref={moreHref}
        />
      </Suspense>
    </div>
  );
}
