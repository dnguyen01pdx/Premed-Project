"use client";

import { useState } from "react";
import { Badge, OutlineBadge } from "./Badge";
import { UpgradeCallout } from "./UpgradeCallout";
import {
  type CoverageStatus,
  type MasterEssayGroup,
  applicationInsights,
  buildMasterEssayMap,
  coreEssaysNeeded,
  essayCoverage,
  essayCoverageStatus,
  indexEssaysById,
  smartPriorities,
  usedExperiences,
} from "@/lib/essayMap";
import { FREE_PREVIEW_LIMIT } from "@/lib/entitlements";
import {
  STATUS_META,
  type TrackedEssay,
  type TrackedSchool,
} from "@/lib/tracker";
import { checkSchoolNames, type SchoolForCheck } from "@/lib/schoolNameCheck";

type SchoolOption = {
  slug: string;
  name: string;
  shortName: string | null;
};

function limitText(
  value: number | null | undefined,
  unit: string | undefined,
): string | null {
  if (!unit || unit === "none" || typeof value !== "number") return null;
  return `${value.toLocaleString()} ${unit === "words" ? "words" : "characters"}`;
}

const COVERAGE_META: Record<
  CoverageStatus,
  { label: string; tone: "ok" | "warn" | "neutral" }
> = {
  covered: { label: "Covered", tone: "ok" },
  needs_adaptation: { label: "Needs adaptation", tone: "warn" },
  needs_new: { label: "Needs a new essay", tone: "neutral" },
};

export function EssayMapPanel({
  catalog,
  tracked,
  today,
  pro,
  onPatch,
}: {
  catalog: SchoolOption[];
  tracked: TrackedSchool[];
  today: Date;
  pro: boolean;
  onPatch: (slug: string, changes: Partial<TrackedSchool>) => void;
}) {
  const essayCount = tracked.reduce((n, s) => n + (s.essays?.length ?? 0), 0);

  if (essayCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <h2 className="font-semibold">No essays added yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Add essays under each school in the &ldquo;My schools&rdquo; tab.
          Once you have a few, they show up here grouped into the smallest set
          of essays you actually need to write.
        </p>
      </section>
    );
  }

  const essayById = indexEssaysById(tracked);
  const groups = buildMasterEssayMap(tracked);
  const coverage = essayCoverage(tracked);
  const core = coreEssaysNeeded(groups);
  const priorities = smartPriorities(tracked, groups, today);
  const tagCounts = usedExperiences(tracked);
  const insights = applicationInsights(tracked, groups, tagCounts, []);

  const catalogBySlug = new Map(catalog.map((s) => [s.slug, s]));
  const checkUniverse: SchoolForCheck[] = tracked.map((s) => ({
    slug: s.slug,
    name: s.name,
    shortName: catalogBySlug.get(s.slug)?.shortName ?? null,
  }));

  function patchEssay(
    schoolSlug: string,
    essayId: string,
    changes: Partial<TrackedEssay>,
  ) {
    const school = tracked.find((s) => s.slug === schoolSlug);
    if (!school) return;
    onPatch(schoolSlug, {
      essays: (school.essays ?? []).map((e) =>
        e.id === essayId ? { ...e, ...changes } : e,
      ),
    });
  }

  const visibleGroups = pro ? groups : groups.slice(0, FREE_PREVIEW_LIMIT);
  const lockedGroups = pro ? [] : groups.slice(FREE_PREVIEW_LIMIT);
  const lockedSchools = new Set(
    lockedGroups.flatMap((g) => g.essays.map((e) => e.schoolSlug)),
  ).size;

  const visiblePriorities = pro ? priorities.slice(0, 5) : priorities.slice(0, 1);
  const lockedPriorityCount = pro ? 0 : Math.max(0, priorities.length - 1);

  const visibleInsights = pro ? insights : insights.slice(0, 1);
  const lockedInsightCount = pro ? 0 : Math.max(0, insights.length - 1);

  return (
    <section className="space-y-6">
      {/* Headline stats: always visible, the "84 -> 16" teaser. */}
      <div className="rounded-2xl border border-navy-100 bg-accent-soft p-5 sm:p-6">
        <p className="text-lg leading-relaxed">
          Your{" "}
          <strong>
            {essayCount} {essayCount === 1 ? "prompt" : "prompts"}
          </strong>{" "}
          group into{" "}
          <strong>
            {core} core {core === 1 ? "essay" : "essays"}
          </strong>{" "}
          to actually write.
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Essay coverage</span>
            <span className="text-muted">
              {coverage.coveredByExisting} / {coverage.total} prompts have an
              essay behind them
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{
                width: `${coverage.total ? (coverage.coveredByExisting / coverage.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Smart prioritization */}
      {priorities.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">What to write next</h2>
          {visiblePriorities.map((p, i) => (
            <div
              key={p.typeKey}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <p className="font-medium">
                {i === 0 ? "Write your " : "Then: "}
                {p.typeLabel} essay{i === 0 ? " next" : ""}
              </p>
              <p className="mt-1 text-sm text-muted">
                {p.soonestSchoolName && p.daysUntilDue !== null ? (
                  <>
                    Due soonest: {p.soonestSchoolName} in{" "}
                    {p.daysUntilDue < 0
                      ? `${Math.abs(p.daysUntilDue)}d ago`
                      : `${p.daysUntilDue}d`}{" "}
                    ·{" "}
                  </>
                ) : null}
                Reusable for {p.schoolCount}{" "}
                {p.schoolCount === 1 ? "school" : "schools"}
              </p>
            </div>
          ))}
          {!pro && lockedPriorityCount > 0 && (
            <UpgradeCallout>
              {lockedPriorityCount} more prioritized essay
              {lockedPriorityCount === 1 ? "" : "s"} ranked by deadline and
              reuse value. Unlock full Smart Prioritization with MD Atlas Pro.
            </UpgradeCallout>
          )}
        </section>
      )}

      {/* Master Essay Map */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Essay Map</h2>

        {visibleGroups.map((group) => (
          <EssayGroupCard
            key={group.typeKey}
            group={group}
            essayById={essayById}
            checkUniverse={checkUniverse}
            onPatchEssay={patchEssay}
          />
        ))}

        {!pro && lockedGroups.length > 0 && (
          <>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sunken">
              {lockedGroups.map((g) => (
                <li
                  key={g.typeKey}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm text-muted"
                >
                  <span className="font-medium text-foreground/70">
                    {g.typeLabel}
                  </span>
                  <span>
                    {g.schoolCount} {g.schoolCount === 1 ? "school" : "schools"} ·
                    locked
                  </span>
                </li>
              ))}
            </ul>
            <UpgradeCallout>
              You have {lockedGroups.length} more prompt group
              {lockedGroups.length === 1 ? "" : "s"} across {lockedSchools}{" "}
              {lockedSchools === 1 ? "school" : "schools"}. Unlock your full
              Essay Map with MD Atlas Pro.
            </UpgradeCallout>
          </>
        )}
      </section>

      {/* Used experiences */}
      {tagCounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Used experiences</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {tagCounts.map((t) => (
              <li
                key={t.tag}
                className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
              >
                <span>{t.tag}</span>
                <span className="text-muted">
                  {t.count} {t.count === 1 ? "essay" : "essays"}
                </span>
              </li>
            ))}
          </ul>

          {insights.length > 0 && (
            <div className="space-y-2">
              {visibleInsights.map((ins) => (
                <p
                  key={ins.id}
                  className={`rounded-xl border p-3.5 text-sm leading-relaxed ${
                    ins.severity === "warn"
                      ? "border-warn/30 bg-warn-soft text-warn"
                      : "border-line bg-sunken text-muted"
                  }`}
                >
                  {ins.text}
                </p>
              ))}
              {!pro && lockedInsightCount > 0 && (
                <UpgradeCallout>
                  {lockedInsightCount} more application insight
                  {lockedInsightCount === 1 ? "" : "s"} about repetitive
                  themes and underused activities. Unlock full analysis with
                  MD Atlas Pro.
                </UpgradeCallout>
              )}
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function EssayGroupCard({
  group,
  essayById,
  checkUniverse,
  onPatchEssay,
}: {
  group: MasterEssayGroup;
  essayById: Map<string, TrackedEssay>;
  checkUniverse: SchoolForCheck[];
  onPatchEssay: (
    schoolSlug: string,
    essayId: string,
    changes: Partial<TrackedEssay>,
  ) => void;
}) {
  const candidateMasters = group.essays.filter(
    (e) => e.essay.draftText?.trim() || e.essay.status !== "not_started",
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line bg-navy-900 px-5 py-3.5 text-white">
        <h3 className="font-semibold tracking-tight">{group.typeLabel}</h3>
        <p className="text-sm text-navy-100">
          {group.schoolCount} {group.schoolCount === 1 ? "school" : "schools"} ·{" "}
          {group.total} {group.total === 1 ? "prompt" : "prompts"}
        </p>
      </div>

      {(group.minWords !== null || group.minChars !== null) && (
        <p className="border-b border-line bg-sunken px-5 py-2.5 text-sm">
          <span className="font-medium">Write to:</span>{" "}
          <span className="text-muted">
            {[
              group.minWords !== null && `${group.minWords.toLocaleString()} words`,
              group.minChars !== null &&
                `${group.minChars.toLocaleString()} characters`,
            ]
              .filter(Boolean)
              .join(" or ")}{" "}
            — the tightest limit in this group.
          </span>
        </p>
      )}

      <ul className="divide-y divide-line">
        {group.essays.map(({ schoolSlug, schoolName, essay }) => {
          const status = essayCoverageStatus(essay, essayById);
          const isMaster = group.masterEssayId === essay.id;
          const linkedMaster = essay.linkedToId
            ? essayById.get(essay.linkedToId)
            : undefined;

          return (
            <li key={schoolSlug + essay.id} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{schoolName}</span>
                  <Badge tone={COVERAGE_META[status].tone}>
                    {COVERAGE_META[status].label}
                  </Badge>
                  {isMaster && group.schoolCount > 1 && (
                    <OutlineBadge>Master version</OutlineBadge>
                  )}
                  {limitText(essay.limitValue, essay.limitUnit) && (
                    <OutlineBadge>
                      {limitText(essay.limitValue, essay.limitUnit)}
                    </OutlineBadge>
                  )}
                </div>
                <Badge tone={STATUS_META[essay.status].tone}>
                  {STATUS_META[essay.status].label}
                </Badge>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {essay.label}
              </p>

              {group.schoolCount > 1 && !isMaster && candidateMasters.length > 0 && (
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-muted">Reuse a draft:</span>
                  <select
                    value={essay.linkedToId ?? ""}
                    onChange={(e) =>
                      onPatchEssay(schoolSlug, essay.id, {
                        linkedToId: e.target.value || undefined,
                      })
                    }
                    className="rounded-lg border border-line-strong bg-surface px-2 py-1 text-xs"
                  >
                    <option value="">Write my own</option>
                    {candidateMasters
                      .filter((c) => c.essay.id !== essay.id)
                      .map((c) => (
                        <option key={c.essay.id} value={c.essay.id}>
                          {c.schoolName}&apos;s draft
                        </option>
                      ))}
                  </select>
                </label>
              )}

              {linkedMaster && (
                <p className="mt-1.5 text-xs text-muted">
                  Reusing the draft from this group&apos;s master version.
                  Remember to adapt it — that&apos;s what the name check below
                  is for.
                </p>
              )}

              <SafetyCheckControl
                essay={essay}
                sourceText={essay.draftText || linkedMaster?.draftText || ""}
                targetSlug={schoolSlug}
                universe={checkUniverse}
              />
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function SafetyCheckControl({
  sourceText,
  targetSlug,
  universe,
}: {
  essay: TrackedEssay;
  sourceText: string;
  targetSlug: string;
  universe: SchoolForCheck[];
}) {
  const [result, setResult] = useState<"idle" | "clean" | "flagged">("idle");
  const [hits, setHits] = useState<string[]>([]);

  if (!sourceText.trim()) return null;

  function runCheck() {
    const found = checkSchoolNames(sourceText, targetSlug, universe);
    if (found.length === 0) {
      setResult("clean");
      setHits([]);
    } else {
      setResult("flagged");
      setHits(found.map((h) => h.matchedOn));
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={runCheck}
        className="text-xs font-medium text-accent underline underline-offset-2 hover:no-underline"
      >
        Check for other school names
      </button>
      {result === "flagged" && (
        <p className="mt-1.5 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
          ⚠️ Possible school-name error — this draft contains &ldquo;
          {hits.join('", "')}&rdquo;.
        </p>
      )}
      {result === "clean" && (
        <p className="mt-1.5 text-xs text-ok">
          ✓ No other school names found.
        </p>
      )}
    </div>
  );
}
