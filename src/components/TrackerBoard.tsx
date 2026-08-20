"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EssayMapPanel } from "./EssayMapPanel";
import { InterviewBoard } from "./InterviewBoard";
import { MyOverlap } from "./MyOverlap";
import { SchoolTrackerCard, type SchoolPrompt } from "./SchoolTrackerCard";
import {
  getEntitlementsServerSnapshot,
  getEntitlementsSnapshot,
  subscribeToEntitlements,
} from "@/lib/entitlements";
import {
  STATUSES,
  STATUS_META,
  type Status,
  type TrackedSchool,
  type TrackerState,
  commitTracker,
  countByStatus,
  countEssays,
  daysUntil,
  emptyTracker,
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  parseTracker,
  rollUpStatus,
  subscribeNever,
  subscribeToTracker,
  trackerExportTable,
} from "@/lib/tracker";
import { downloadXlsx } from "@/lib/xlsxExport";
import {
  buildMasterEssayMap,
  coreEssaysNeeded,
  essayCoverage,
  smartPriorities,
} from "@/lib/essayMap";

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

export function TrackerBoard({
  schools,
  promptsBySchool,
  showInterviews = false,
}: {
  schools: SchoolOption[];
  /** Prompts we already hold, keyed by school slug, for the import button. */
  promptsBySchool: Record<string, SchoolPrompt[]>;
  /**
   * Interviews used to be a third tab in here. They now have their own page,
   * because a secondary and an interview invite are different jobs weeks apart
   * and stacking them made this screen read as a pile. Kept as a prop rather
   * than deleted so the combined view is one flag away if that turns out wrong.
   */
  showInterviews?: boolean;
}) {
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

  const entitlements = useSyncExternalStore(
    subscribeToEntitlements,
    getEntitlementsSnapshot,
    getEntitlementsServerSnapshot,
  );

  const [storageOk, setStorageOk] = useState(true);
  const [exportFailed, setExportFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [tab, setTab] = useState<"list" | "overlap" | "map" | "interviews">(
    "list",
  );
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

  const essayTotals = countEssays(tracked);

  const visible = useMemo(() => {
    const rows =
      statusFilter === "all"
        ? tracked
        : tracked.filter((s) => rollUpStatus(s) === statusFilter);
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
        { slug: s.slug, name: s.name, status: "not_started", essays: [] },
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

  async function exportSpreadsheet() {
    const { headers, rows } = trackerExportTable(tracked);
    try {
      setExportFailed(false);
      await downloadXlsx(
        "secondary-tracker.xlsx",
        "Secondaries",
        headers.map((header) => ({ header })),
        rows,
      );
    } catch {
      setExportFailed(true);
    }
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

  // Derived once per render from the same tracked schools everything else on
  // this page reads — no separate store, nothing that can drift from the list
  // below it.
  const schoolsRemaining = tracked.length - counts.submitted;
  const essayGroups = buildMasterEssayMap(tracked);
  const coverage = essayCoverage(tracked);
  const coveragePct =
    coverage.total > 0
      ? Math.round((coverage.coveredByExisting / coverage.total) * 100)
      : null;
  const nextUp = smartPriorities(tracked, essayGroups, today)[0] ?? null;
  const nextDeadline = tracked
    .map((s) => ({ school: s, days: daysUntil(s.dueOn, today) }))
    .filter(
      (x): x is { school: TrackedSchool; days: number } =>
        x.days !== null && x.days >= 0 && rollUpStatus(x.school) !== "submitted",
    )
    .sort((a, b) => a.days - b.days)[0];

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
          {/* Secondary Season summary — the one card meant to answer "where do
              I actually stand" without opening a tab. Everything in it links
              to the tab that can act on it. */}
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-widest text-muted">
              SECONDARY SEASON
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <span className="block text-2xl font-semibold tabular-nums">
                  {schoolsRemaining}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {schoolsRemaining === 1 ? "school" : "schools"} left to submit
                </span>
              </div>
              <div>
                <span className="block text-2xl font-semibold tabular-nums">
                  {essayTotals.remaining}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  unfinished prompts
                </span>
              </div>
              <div>
                <span className="block text-2xl font-semibold tabular-nums">
                  {coreEssaysNeeded(essayGroups)}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  core essays needed
                </span>
              </div>
              <div>
                <span className="block text-2xl font-semibold tabular-nums">
                  {coveragePct === null ? "N/A" : `${coveragePct}%`}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  essay coverage
                </span>
              </div>
            </div>

            {essayTotals.total > coreEssaysNeeded(essayGroups) && (
              <p className="mt-4 text-sm text-muted">
                {essayTotals.total}{" "}
                {essayTotals.total === 1 ? "prompt" : "prompts"} across your
                schools consolidate into {coreEssaysNeeded(essayGroups)} core{" "}
                {coreEssaysNeeded(essayGroups) === 1 ? "essay" : "essays"} via
                the{" "}
                <button
                  type="button"
                  onClick={() => setTab("map")}
                  className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                >
                  Essay Map
                </button>
                .
              </p>
            )}

            {(nextUp || nextDeadline) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {nextDeadline && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setTab("list");
                    }}
                    className={`rounded-xl border p-4 text-left ${
                      nextDeadline.days <= 3
                        ? "border-warn/30 bg-warn-soft"
                        : "border-line bg-sunken"
                    }`}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-widest text-muted">
                      Next deadline
                    </span>
                    <span className="mt-1 block font-medium">
                      {nextDeadline.school.name}
                      {": "}
                      {nextDeadline.days === 0
                        ? "due today"
                        : `due in ${nextDeadline.days} day${nextDeadline.days === 1 ? "" : "s"}`}
                    </span>
                  </button>
                )}
                {nextUp && (
                  <button
                    type="button"
                    onClick={() => setTab("map")}
                    className="rounded-xl border border-line bg-sunken p-4 text-left"
                  >
                    <span className="block text-xs font-semibold uppercase tracking-widest text-muted">
                      Recommended next essay
                    </span>
                    <span className="mt-1 block font-medium">
                      {nextUp.typeLabel}
                      {nextUp.schoolCount > 1
                        ? ` (covers ${nextUp.schoolCount} schools)`
                        : ""}
                      {nextUp.soonestSchoolName
                        ? `, starting with ${nextUp.soonestSchoolName}`
                        : ""}
                    </span>
                  </button>
                )}
              </div>
            )}
          </section>

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

          {/* Essay totals: the number that reflects real workload. */}
          {essayTotals.total > 0 && (
            <p className="text-sm text-muted">
              <strong className="text-foreground">
                {essayTotals.remaining}
              </strong>{" "}
              of {essayTotals.total} individual essays still to write.
            </p>
          )}

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Tracker views"
            className="flex gap-1 rounded-xl border border-line bg-surface p-1"
          >
            {(
              [
                ["list", "My schools"],
                ["overlap", "What overlaps"],
                ["map", "Essay Map"],
                ...(showInterviews
                  ? ([["interviews", "Interviews"]] as const)
                  : []),
              ] as ReadonlyArray<readonly [typeof tab, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-navy-900 text-white"
                    : "text-muted hover:bg-accent-soft hover:text-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "list" ? (
            <section className="space-y-3">
              {visible.map((s) => (
                <SchoolTrackerCard
                  key={s.slug}
                  school={s}
                  prompts={promptsBySchool[s.slug] ?? []}
                  today={today}
                  onPatch={patch}
                  onRemove={remove}
                />
              ))}
              {visible.length === 0 && (
                <p className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
                  No schools with that status.
                </p>
              )}
            </section>
          ) : tab === "overlap" ? (
            <MyOverlap schools={tracked} pro={entitlements.pro} />
          ) : tab === "map" ? (
            <EssayMapPanel
              catalog={schools}
              tracked={tracked}
              today={today}
              pro={entitlements.pro}
              onPatch={patch}
            />
          ) : showInterviews ? (
            <InterviewBoard schools={tracked} today={today} onPatch={patch} />
          ) : null}
        </>
      )}

      {/* Data controls */}
      <section className="rounded-xl border border-line bg-sunken p-5">
        <h2 className="text-sm font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">
          This list is stored in this browser only. We never see it. That also
          means clearing your browser data or switching devices loses it, so
          export a copy if it matters.{" "}
          <a
            href="/privacy"
            className="text-accent underline underline-offset-2 hover:no-underline"
          >
            How we handle your data
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportSpreadsheet}
            disabled={tracked.length === 0}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50 disabled:hover:border-line-strong disabled:hover:text-foreground"
          >
            Export spreadsheet
          </button>
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
        {exportFailed && (
          <p className="mt-3 text-sm text-danger">
            Could not build the spreadsheet. Try again, or use Export backup
            instead.
          </p>
        )}
      </section>
    </div>
  );
}
