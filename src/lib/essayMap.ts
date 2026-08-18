/**
 * The Master Essay Map: the engine behind "84 secondary prompts, 16 core
 * essays." Everything here is pure and operates on the tracker's own data —
 * no network call, no model, nothing leaves the browser. It groups, counts,
 * and ranks. It never drafts a sentence.
 */

import {
  type Status,
  type TrackedEssay,
  type TrackedSchool,
  daysUntil,
} from "./tracker";

export type EssayRef = {
  schoolSlug: string;
  schoolName: string;
  essay: TrackedEssay;
};

export type CoverageStatus = "covered" | "needs_adaptation" | "needs_new";

/**
 * One essay's coverage bucket.
 *
 * "covered" — this prompt already has its own real draft, or is finished.
 * "needs_adaptation" — either drafting is underway, or it is pointed at
 *   another essay's draft (linkedToId) that has not been personalized here.
 * "needs_new" — nothing exists for this prompt yet.
 */
export function essayCoverageStatus(
  essay: TrackedEssay,
  essayById: Map<string, TrackedEssay>,
): CoverageStatus {
  if (essay.status === "done" || essay.status === "submitted") return "covered";
  if (essay.draftText?.trim()) return "covered";
  if (essay.status === "drafting") return "needs_adaptation";
  if (essay.linkedToId) {
    const master = essayById.get(essay.linkedToId);
    if (master && (master.draftText?.trim() || master.status !== "not_started")) {
      return "needs_adaptation";
    }
  }
  return "needs_new";
}

/** Flat id -> essay index, since linkedToId can cross schools. */
export function indexEssaysById(
  schools: TrackedSchool[],
): Map<string, TrackedEssay> {
  const map = new Map<string, TrackedEssay>();
  for (const s of schools) {
    for (const e of s.essays ?? []) map.set(e.id, e);
  }
  return map;
}

export type MasterEssayGroup = {
  typeKey: string;
  typeLabel: string;
  essays: EssayRef[];
  schoolCount: number;
  minWords: number | null;
  minChars: number | null;
  /** The essay currently acting as the reference draft, chosen or inferred. */
  masterEssayId: string | null;
  /** True once the user has actually picked/linked a master, vs. a guess. */
  masterIsExplicit: boolean;
  covered: number;
  needsAdaptation: number;
  needsNew: number;
  total: number;
};

const UNCATEGORIZED_KEY = "__uncategorized";

/**
 * Groups every tracked essay — across every school — by question type. Unlike
 * the free overlap preview (lib/tracker.ts#overlapClusters), this includes
 * groups of one: the point of the full map is the whole picture, not just
 * where two schools happen to line up.
 */
export function buildMasterEssayMap(schools: TrackedSchool[]): MasterEssayGroup[] {
  const essayById = indexEssaysById(schools);
  const byType = new Map<string, EssayRef[]>();

  for (const school of schools) {
    for (const essay of school.essays ?? []) {
      const key = essay.typeKey || UNCATEGORIZED_KEY;
      const list = byType.get(key) ?? [];
      list.push({ schoolSlug: school.slug, schoolName: school.name, essay });
      byType.set(key, list);
    }
  }

  const groups: MasterEssayGroup[] = [];

  for (const [typeKey, essays] of byType.entries()) {
    const typeLabel =
      typeKey === UNCATEGORIZED_KEY
        ? "Uncategorized"
        : essays.find((e) => e.essay.typeLabel)?.essay.typeLabel ?? typeKey;

    const words = essays
      .map((e) => e.essay)
      .filter((e) => e.limitUnit === "words" && typeof e.limitValue === "number")
      .map((e) => e.limitValue as number);
    const chars = essays
      .map((e) => e.essay)
      .filter((e) => e.limitUnit === "characters" && typeof e.limitValue === "number")
      .map((e) => e.limitValue as number);

    // A master is "explicit" once something links to it. Absent that, we
    // suggest whichever essay has the most real progress, purely as a
    // display default — nothing is written to storage until the user
    // actually links an essay to it.
    const linkedToCounts = new Map<string, number>();
    for (const { essay } of essays) {
      if (essay.linkedToId) {
        linkedToCounts.set(essay.linkedToId, (linkedToCounts.get(essay.linkedToId) ?? 0) + 1);
      }
    }
    let masterEssayId: string | null = null;
    let masterIsExplicit = false;
    for (const { essay } of essays) {
      if (linkedToCounts.has(essay.id)) {
        masterEssayId = essay.id;
        masterIsExplicit = true;
        break;
      }
    }
    if (!masterEssayId) {
      const withDraft = essays.filter((e) => e.essay.draftText?.trim());
      if (withDraft.length === 1) {
        masterEssayId = withDraft[0].essay.id;
      } else {
        const rank: Record<Status, number> = {
          not_started: 0,
          drafting: 1,
          done: 2,
          submitted: 3,
        };
        const withProgress = [...essays].sort(
          (a, b) => rank[b.essay.status] - rank[a.essay.status],
        )[0];
        if (withProgress && withProgress.essay.status !== "not_started") {
          masterEssayId = withProgress.essay.id;
        }
      }
    }

    let covered = 0;
    let needsAdaptation = 0;
    let needsNew = 0;
    for (const { essay } of essays) {
      const status = essayCoverageStatus(essay, essayById);
      if (status === "covered") covered++;
      else if (status === "needs_adaptation") needsAdaptation++;
      else needsNew++;
    }

    groups.push({
      typeKey,
      typeLabel,
      essays,
      schoolCount: new Set(essays.map((e) => e.schoolSlug)).size,
      minWords: words.length ? Math.min(...words) : null,
      minChars: chars.length ? Math.min(...chars) : null,
      masterEssayId,
      masterIsExplicit,
      covered,
      needsAdaptation,
      needsNew,
      total: essays.length,
    });
  }

  // Biggest reuse opportunity first — the whole point of the page is "look
  // at these first," and that is always where the most schools overlap.
  return groups.sort((a, b) => b.schoolCount - a.schoolCount || b.total - a.total);
}

export type CoverageSummary = {
  total: number;
  covered: number;
  needsAdaptation: number;
  needsNew: number;
  /** covered + needsAdaptation: prompts with SOME existing essay behind them. */
  coveredByExisting: number;
};

export function essayCoverage(schools: TrackedSchool[]): CoverageSummary {
  const essayById = indexEssaysById(schools);
  let covered = 0;
  let needsAdaptation = 0;
  let needsNew = 0;
  let total = 0;

  for (const s of schools) {
    for (const e of s.essays ?? []) {
      total++;
      const status = essayCoverageStatus(e, essayById);
      if (status === "covered") covered++;
      else if (status === "needs_adaptation") needsAdaptation++;
      else needsNew++;
    }
  }

  return {
    total,
    covered,
    needsAdaptation,
    needsNew,
    coveredByExisting: covered + needsAdaptation,
  };
}

/** How many essays a user would actually have to sit down and write. */
export function coreEssaysNeeded(groups: MasterEssayGroup[]): number {
  return groups.length;
}

export type PriorityItem = {
  typeKey: string;
  typeLabel: string;
  schoolCount: number;
  /** The school with the nearest deadline still needing this essay. */
  soonestSchoolName: string | null;
  soonestDueOn: string | null;
  daysUntilDue: number | null;
};

/**
 * Ranks the essays still worth doing: nearest deadline first, then whichever
 * covers the most schools. A group that is already fully covered drops out —
 * there is nothing left to recommend writing.
 */
export function smartPriorities(
  schools: TrackedSchool[],
  groups: MasterEssayGroup[],
  today: Date,
): PriorityItem[] {
  const schoolBySlug = new Map(schools.map((s) => [s.slug, s]));

  const items: PriorityItem[] = [];

  for (const group of groups) {
    if (group.needsNew === 0 && group.needsAdaptation === 0) continue;

    let soonestSchoolName: string | null = null;
    let soonestDueOn: string | null = null;
    let soonestDays: number | null = null;

    for (const { schoolSlug, schoolName, essay } of group.essays) {
      if (essay.status === "done" || essay.status === "submitted") continue;
      const school = schoolBySlug.get(schoolSlug);
      const dueOn = essay.dueOn ?? school?.dueOn;
      const days = daysUntil(dueOn, today);
      if (days === null) continue;
      if (soonestDays === null || days < soonestDays) {
        soonestDays = days;
        soonestDueOn = dueOn ?? null;
        soonestSchoolName = schoolName;
      }
    }

    items.push({
      typeKey: group.typeKey,
      typeLabel: group.typeLabel,
      schoolCount: group.schoolCount,
      soonestSchoolName,
      soonestDueOn,
      daysUntilDue: soonestDays,
    });
  }

  return items.sort((a, b) => {
    // Undated groups sink to the bottom rather than being treated as urgent.
    if (a.daysUntilDue === null && b.daysUntilDue === null) {
      return b.schoolCount - a.schoolCount;
    }
    if (a.daysUntilDue === null) return 1;
    if (b.daysUntilDue === null) return -1;
    if (a.daysUntilDue !== b.daysUntilDue) return a.daysUntilDue - b.daysUntilDue;
    return b.schoolCount - a.schoolCount;
  });
}

export type ExperienceTagCount = {
  tag: string;
  count: number;
  essayRefs: EssayRef[];
};

/** Tallies which activities/stories show up across essays, and where. */
export function usedExperiences(schools: TrackedSchool[]): ExperienceTagCount[] {
  const byTag = new Map<string, EssayRef[]>();

  for (const school of schools) {
    for (const essay of school.essays ?? []) {
      for (const tag of essay.experienceTags ?? []) {
        const list = byTag.get(tag) ?? [];
        list.push({ schoolSlug: school.slug, schoolName: school.name, essay });
        byTag.set(tag, list);
      }
    }
  }

  return [...byTag.entries()]
    .map(([tag, essayRefs]) => ({ tag, count: essayRefs.length, essayRefs }))
    .sort((a, b) => b.count - a.count);
}

export type Insight = {
  id: string;
  severity: "info" | "warn";
  text: string;
};

/**
 * Diagnostic-only observations, never advice framed as certain. Every
 * threshold here is a plain count a user could verify by hand — the point is
 * to save them the counting, not to claim judgment we don't have.
 */
export function applicationInsights(
  schools: TrackedSchool[],
  groups: MasterEssayGroup[],
  tagCounts: ExperienceTagCount[],
  primaryExperienceTitles: string[],
): Insight[] {
  const insights: Insight[] = [];

  const totalTagUsages = tagCounts.reduce((n, t) => n + t.count, 0);

  const overused = tagCounts.filter((t) => t.count >= 4);
  for (const t of overused) {
    insights.push({
      id: `overused-${t.tag}`,
      severity: "warn",
      text: `"${t.tag}" shows up in ${t.count} essays. Worth checking your application doesn't read as one story told six ways.`,
    });
  }

  if (totalTagUsages >= 4 && tagCounts.length > 0) {
    const top = tagCounts[0];
    if (top.count / totalTagUsages > 0.5) {
      insights.push({
        id: "dominant-tag",
        severity: "warn",
        text: `Over half of your tagged essays lean on "${top.tag}". Consider whether another experience could carry one of those instead.`,
      });
    }
  }

  if (totalTagUsages >= 3 && primaryExperienceTitles.length > 0) {
    const tagged = new Set(tagCounts.map((t) => t.tag.toLowerCase()));
    for (const title of primaryExperienceTitles) {
      const used = [...tagged].some(
        (t) => t.includes(title.toLowerCase()) || title.toLowerCase().includes(t),
      );
      if (!used) {
        insights.push({
          id: `unused-${title}`,
          severity: "info",
          text: `"${title}" hasn't been tagged in any essay yet. If it's a strong entry, it might be worth working in somewhere.`,
        });
      }
    }
  }

  for (const g of groups) {
    if (g.schoolCount >= 2 && g.covered === 0) {
      insights.push({
        id: `unconsolidated-${g.typeKey}`,
        severity: "info",
        text: `${g.schoolCount} schools ask a ${g.typeLabel} question and none of them have a draft started. That's your biggest single opportunity to write once and reuse.`,
      });
    }
  }

  return insights.slice(0, 8);
}
