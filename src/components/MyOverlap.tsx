"use client";

import { Badge, OutlineBadge } from "./Badge";
import { UpgradeCallout } from "./UpgradeCallout";
import { FREE_PREVIEW_LIMIT } from "@/lib/entitlements";
import {
  STATUS_META,
  overlapClusters,
  type TrackedSchool,
} from "@/lib/tracker";

/**
 * Overlap across the user's OWN list.
 *
 * The public /overlap page answers "which schools ask a diversity essay". This
 * answers the question that actually matters while you are writing: "which of
 * the schools I applied to ask it, and what is the shortest one I have to fit
 * inside". Write to that limit once, then expand for the rest.
 *
 * Free accounts see that the overlap exists and get a couple of full
 * examples; the full cross-school map with reuse tools lives in the Essay Map
 * tab, which is Pro.
 */
export function MyOverlap({
  schools,
  pro,
}: {
  schools: TrackedSchool[];
  pro: boolean;
}) {
  const clusters = overlapClusters(schools);
  const essayCount = schools.reduce((n, s) => n + (s.essays?.length ?? 0), 0);

  if (essayCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <h2 className="font-semibold">No essays added yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Add the essays under each school above. Once two or more of your
          schools ask the same kind of question, they show up here grouped
          together so you can write one essay and adapt it.
        </p>
      </section>
    );
  }

  if (clusters.length === 0) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-8 text-center">
        <h2 className="font-semibold">No overlap yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          None of your schools currently share a question type. Add more essays,
          or use the import button on a school to pull in every prompt we have
          for it, and this will fill in.
        </p>
      </section>
    );
  }

  const reusable = clusters.reduce((n, c) => n + c.essays.length - 1, 0);
  const visible = pro ? clusters : clusters.slice(0, FREE_PREVIEW_LIMIT);
  const locked = pro ? [] : clusters.slice(FREE_PREVIEW_LIMIT);
  const lockedSchools = new Set(
    locked.flatMap((c) => c.essays.map((e) => e.schoolSlug)),
  ).size;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-navy-100 bg-accent-soft p-5 sm:p-6">
        <p className="text-lg leading-relaxed">
          <strong>
            {clusters.length}{" "}
            {clusters.length === 1 ? "question repeats" : "questions repeat"}
          </strong>{" "}
          across your schools, covering {essayCount} essays. If you write each
          one once and adapt it, that is roughly{" "}
          <strong>{reusable} fewer essays</strong> to write from scratch.
        </p>
      </div>

      {visible.map((c) => (
        <article
          key={c.typeKey}
          className="overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line bg-navy-900 px-5 py-3.5 text-white">
            <h3 className="font-semibold tracking-tight">{c.typeLabel}</h3>
            <p className="text-sm text-navy-100">
              {c.schoolCount} of your schools · {c.essays.length} essays
            </p>
          </div>

          {(c.minWords !== null || c.minChars !== null) && (
            <p className="border-b border-line bg-sunken px-5 py-2.5 text-sm">
              <span className="font-medium">Write to:</span>{" "}
              <span className="text-muted">
                {[
                  c.minWords !== null && `${c.minWords.toLocaleString()} words`,
                  c.minChars !== null &&
                    `${c.minChars.toLocaleString()} characters`,
                ]
                  .filter(Boolean)
                  .join(" or ")}
                , the tightest limit among your schools.
              </span>
            </p>
          )}

          <ul className="divide-y divide-line">
            {c.essays.map(({ schoolSlug, schoolName, essay }) => (
              <li key={schoolSlug + essay.id} className="px-5 py-3.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{schoolName}</span>
                  <Badge tone={STATUS_META[essay.status].tone}>
                    {STATUS_META[essay.status].label}
                  </Badge>
                  {essay.limitUnit &&
                    essay.limitUnit !== "none" &&
                    typeof essay.limitValue === "number" && (
                      <OutlineBadge>
                        {essay.limitValue.toLocaleString()}{" "}
                        {essay.limitUnit === "words" ? "words" : "characters"}
                      </OutlineBadge>
                    )}
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  {essay.label}
                </p>
              </li>
            ))}
          </ul>
        </article>
      ))}

      {!pro && locked.length > 0 && (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sunken">
            {locked.map((c) => (
              <li
                key={c.typeKey}
                className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm text-muted"
              >
                <span className="font-medium text-foreground/70">
                  {c.typeLabel}
                </span>
                <span>{c.schoolCount} of your schools · locked</span>
              </li>
            ))}
          </ul>
          <UpgradeCallout>
            You have {locked.length} additional prompt overlap
            {locked.length === 1 ? "" : "s"} across {lockedSchools} more{" "}
            {lockedSchools === 1 ? "school" : "schools"}. Unlock your full
            Essay Map with MD Atlas Pro.
          </UpgradeCallout>
        </>
      )}
    </section>
  );
}
