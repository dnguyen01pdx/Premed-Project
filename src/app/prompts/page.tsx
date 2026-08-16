import { Suspense } from "react";
import type { Metadata } from "next";
import { PromptCard } from "@/components/PromptCard";
import { PromptFilters } from "@/components/PromptFilters";
import {
  countPrompts,
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
  };
}

async function Results({ filters }: { filters: Filters }) {
  const [rows, total] = await Promise.all([
    searchPrompts(filters, { limit: RESULT_LIMIT }),
    countPrompts(filters),
  ]);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-6 text-sm text-muted">
        No prompts match those filters. Try clearing the length limit, or
        widening the prompt type.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted">
        {total.toLocaleString()} {total === 1 ? "prompt" : "prompts"}
        {total > rows.length && ` (showing the first ${rows.length})`}
      </p>
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

  const [types, schools, states] = await Promise.all([
    listPromptTypes(),
    listSchools(),
    listStates(),
  ]);

  // Serialized filters key the Suspense boundary so the results area shows a
  // fallback whenever the query changes, rather than sitting stale.
  const key = JSON.stringify(filters);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Browse secondary prompts
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Filters update the URL, so you can bookmark or share any view.
        </p>
      </div>

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
        <Results filters={filters} />
      </Suspense>
    </div>
  );
}
