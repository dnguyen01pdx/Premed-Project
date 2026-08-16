"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge } from "./Badge";
import {
  STATUSES,
  STATUS_META,
  type Status,
  type TrackedSchool,
  type TrackerState,
  commitTracker,
  countByStatus,
  daysUntil,
  emptyTracker,
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  parseTracker,
  subscribeNever,
  subscribeToTracker,
  toCsv,
} from "@/lib/tracker";

type SchoolOption = {
  slug: string;
  name: string;
  shortName: string | null;
  state: string | null;
  promptCount: number;
};

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TrackerBoard({ schools }: { schools: SchoolOption[] }) {
  // localStorage is an external store, so it is subscribed to rather than
  // copied into state. See the note in lib/tracker.ts.
  const state = useSyncExternalStore(
    subscribeToTracker,
    getTrackerSnapshot,
    getTrackerServerSnapshot,
  );

  // True only after hydration, so the first paint can say "loading" instead of
  // flashing "nothing tracked" at someone who has twenty schools saved.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const [storageOk, setStorageOk] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const importRef = useRef<HTMLInputElement>(null);

  function update(next: TrackerState) {
    setStorageOk(commitTracker(next));
  }

  const tracked = state.schools;
  const trackedSlugs = useMemo(
    () => new Set(tracked.map((s) => s.slug)),
    [tracked],
  );

  const addable = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return schools
      .filter((s) => !trackedSlugs.has(s.slug))
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.shortName ?? "").toLowerCase().includes(q) ||
          (s.state ?? "").toLowerCase() === q,
      )
      .slice(0, 8);
  }, [query, schools, trackedSlugs]);

  const counts = countByStatus(tracked);

  const visible = useMemo(() => {
    const rows =
      statusFilter === "all"
        ? tracked
        : tracked.filter((s) => s.status === statusFilter);
    // Soonest deadline first; undated schools sink to the bottom.
    return [...rows].sort((a, b) => {
      if (a.dueOn && b.dueOn) return a.dueOn.localeCompare(b.dueOn);
      if (a.dueOn) return -1;
      if (b.dueOn) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [tracked, statusFilter]);

  function addSchool(s: SchoolOption) {
    update({
      ...state,
      schools: [
        ...state.schools,
        { slug: s.slug, name: s.name, status: "not_started" },
      ],
    });
    setQuery("");
  }

  function patch(slug: string, changes: Partial<TrackedSchool>) {
    update({
      ...state,
      schools: state.schools.map((s) =>
        s.slug === slug ? { ...s, ...changes } : s,
      ),
    });
  }

  function remove(slug: string) {
    update({
      ...state,
      schools: state.schools.filter((s) => s.slug !== slug),
    });
  }

  function onImport(file: File) {
    file.text().then((text) => {
      try {
        update(parseTracker(JSON.parse(text)));
      } catch {
        setStorageOk(false);
      }
    });
  }

  if (!hydrated) {
    return (
      <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
        Loading your list...
      </p>
    );
  }

  // Safe to read the clock here: this branch only runs after hydration, so it
  // cannot cause a server/client mismatch.
  const today = new Date();

  return (
    <div className="space-y-8">
      {!storageOk && (
        <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          Your browser is blocking local storage, so changes here will not
          survive a refresh. Private browsing usually causes this. Use Export to
          keep a copy.
        </p>
      )}

      {/* Add schools */}
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">Add the schools you applied to</h2>
        <p className="mt-1 text-sm text-muted">
          Start typing a school name or a two-letter state code.
        </p>

        <div className="relative mt-4">
          <label htmlFor="tracker-search" className="sr-only">
            Search schools to add
          </label>
          <input
            id="tracker-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Michigan, or NY"
            autoComplete="off"
            className="w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted"
          />

          {addable.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line-strong bg-surface shadow-lg">
              {addable.map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => addSchool(s)}
                    className="flex w-full items-baseline justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-accent-soft"
                  >
                    <span>{s.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {s.state}
                      {s.promptCount > 0 && ` · ${s.promptCount} prompts`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && addable.length === 0 && (
            <p className="mt-2 text-sm text-muted">
              No matches, or you have already added it.
            </p>
          )}
        </div>
      </section>

      {tracked.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
          Nothing tracked yet. Add a school above and it will show up here.
        </p>
      ) : (
        <>
          {/* Progress summary */}
          <section aria-labelledby="progress-heading">
            <h2 id="progress-heading" className="sr-only">
              Progress
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATUSES.map((s) => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(active ? "all" : s)}
                    aria-pressed={active}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-2xl font-semibold tabular-nums">
                      {counts[s]}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {STATUS_META[s].label}
                    </span>
                  </button>
                );
              })}
            </div>
            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="mt-3 text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
              >
                Show all {tracked.length}
              </button>
            )}
          </section>

          {/* The list */}
          <section className="space-y-3">
            {visible.map((s) => {
              const days = daysUntil(s.dueOn, today);
              const overdue = days !== null && days < 0 && s.status !== "submitted";
              const soon =
                days !== null && days >= 0 && days <= 7 && s.status !== "submitted";

              return (
                <article
                  key={s.slug}
                  className="rounded-xl border border-line bg-surface p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium">
                        <Link
                          href={`/schools/${s.slug}`}
                          className="text-accent underline underline-offset-2 hover:no-underline"
                        >
                          {s.name}
                        </Link>
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge tone={STATUS_META[s.status].tone}>
                          {STATUS_META[s.status].label}
                        </Badge>
                        {overdue && (
                          <Badge tone="danger">
                            Deadline passed {Math.abs(days!)}d ago
                          </Badge>
                        )}
                        {soon && (
                          <Badge tone="warn">
                            {days === 0 ? "Due today" : `Due in ${days}d`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(s.slug)}
                      className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Status
                      </span>
                      <select
                        value={s.status}
                        onChange={(e) =>
                          patch(s.slug, { status: e.target.value as Status })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      >
                        {STATUSES.map((v) => (
                          <option key={v} value={v}>
                            {STATUS_META[v].label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Secondary received
                      </span>
                      <input
                        type="date"
                        value={s.receivedOn ?? ""}
                        onChange={(e) =>
                          patch(s.slug, { receivedOn: e.target.value || undefined })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Deadline
                      </span>
                      <input
                        type="date"
                        value={s.dueOn ?? ""}
                        onChange={(e) =>
                          patch(s.slug, { dueOn: e.target.value || undefined })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Notes
                    </span>
                    <textarea
                      value={s.notes ?? ""}
                      onChange={(e) =>
                        patch(s.slug, { notes: e.target.value || undefined })
                      }
                      rows={2}
                      placeholder="Which essays are left, who you mentioned, anything you want to remember."
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                    />
                  </label>
                </article>
              );
            })}
          </section>
        </>
      )}

      {/* Data controls */}
      <section className="rounded-xl border border-line bg-sunken p-5">
        <h2 className="text-sm font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">
          This list is stored in this browser only. We never see it. That also
          means clearing your browser data or switching devices loses it, so
          export a copy if it matters.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              download(
                "secondary-tracker.json",
                JSON.stringify(state, null, 2),
                "application/json",
              )
            }
            disabled={tracked.length === 0}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50 disabled:hover:border-line-strong disabled:hover:text-foreground"
          >
            Export backup
          </button>
          <button
            type="button"
            onClick={() =>
              download("secondary-tracker.csv", toCsv(tracked), "text/csv")
            }
            disabled={tracked.length === 0}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50 disabled:hover:border-line-strong disabled:hover:text-foreground"
          >
            Export spreadsheet
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          {tracked.length > 0 && (
            <button
              type="button"
              onClick={() => update(emptyTracker())}
              className="rounded-lg border border-danger/40 bg-surface px-3.5 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              Clear everything
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
