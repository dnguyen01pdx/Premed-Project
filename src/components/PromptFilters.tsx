"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

type TypeOption = { key: string; label: string };
type SchoolOption = { slug: string; name: string };

/**
 * Filter controls for the prompt browser.
 *
 * All state lives in the URL so results are shareable and indexable. The text
 * input is debounced; every other control commits immediately.
 */
export function PromptFilters({
  types,
  schools,
  states,
}: {
  types: TypeOption[];
  schools: SchoolOption[];
  states: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeTypes = params.getAll("type");
  const q = params.get("q") ?? "";

  // Debounce timer for the search box. Kept in a ref so a re-render mid-typing
  // does not orphan a pending commit.
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(debounce.current), []);

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `/prompts?${qs}` : "/prompts", { scroll: false });
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  }

  function toggleType(key: string) {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll("type");
    next.delete("type");
    const updated = current.includes(key)
      ? current.filter((t) => t !== key)
      : [...current, key];
    for (const t of updated) next.append("type", t);
    commit(next);
  }

  // Route on a pause in typing rather than on every keystroke.
  function onSearchChange(value: string) {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", value || null), 300);
  }

  const hasFilters = Array.from(params.keys()).length > 0;

  return (
    <div
      className="space-y-4"
      data-pending={isPending ? "" : undefined}
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          // Keyed on the URL value so back/forward navigation resets the box
          // without an effect syncing state.
          key={q}
          type="search"
          defaultValue={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompt text or school name"
          aria-label="Search prompts"
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
        />

        <select
          value={params.get("school") ?? ""}
          onChange={(e) => setParam("school", e.target.value || null)}
          aria-label="Filter by school"
          className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm sm:w-64"
        >
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={params.get("state") ?? ""}
          onChange={(e) => setParam("state", e.target.value || null)}
          aria-label="Filter by state"
          className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm sm:w-32"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          Prompt type
        </legend>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => {
            const active = activeTypes.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleType(t.key)}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full border border-accent bg-accent px-3.5 py-1.5 text-xs font-medium text-on-accent"
                    : "rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs hover:border-accent hover:bg-accent-soft hover:text-accent"
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted">Max words</span>
          <input
            type="number"
            min={1}
            defaultValue={params.get("maxWords") ?? ""}
            onBlur={(e) => setParam("maxWords", e.target.value || null)}
            className="w-24 rounded-lg border border-line-strong bg-surface px-2 py-1"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted">Max characters</span>
          <input
            type="number"
            min={1}
            defaultValue={params.get("maxChars") ?? ""}
            onBlur={(e) => setParam("maxChars", e.target.value || null)}
            className="w-24 rounded-lg border border-line-strong bg-surface px-2 py-1"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={params.get("essaysOnly") === "1"}
            onChange={(e) => setParam("essaysOnly", e.target.checked ? "1" : null)}
          />
          <span className="text-muted">Essays only</span>
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() => commit(new URLSearchParams())}
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
