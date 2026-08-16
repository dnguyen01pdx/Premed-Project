"use client";

import Link from "next/link";
import { Badge, OutlineBadge } from "./Badge";
import {
  DECISIONS,
  DECISION_META,
  INTERVIEW_FORMATS,
  INTERVIEW_FORMAT_LABEL,
  INTERVIEW_STAGES,
  INTERVIEW_STAGE_META,
  type Decision,
  type InterviewFormat,
  type InterviewStage,
  type TrackedInterview,
  type TrackedSchool,
  daysUntil,
  emptyInterview,
  interviewTotals,
} from "@/lib/tracker";

/**
 * The interview half of the dashboard.
 *
 * Secondaries are a writing problem; interviews are a logistics problem. What
 * actually goes wrong is forgetting a thank-you note or losing track of which
 * school you are still waiting to hear from, so those are the two things this
 * surfaces hardest.
 */
export function InterviewBoard({
  schools,
  today,
  onPatch,
}: {
  schools: TrackedSchool[];
  today: Date;
  onPatch: (slug: string, changes: Partial<TrackedSchool>) => void;
}) {
  const totals = interviewTotals(schools);

  if (schools.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <h2 className="font-semibold">No schools yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Add the schools you applied to on the My Schools tab. Once an invite
          arrives, you can track it here.
        </p>
      </section>
    );
  }

  // Anything with an invite floats up; soonest interview first.
  const sorted = [...schools].sort((a, b) => {
    const ai = a.interview,
      bi = b.interview;
    const aActive = ai && ai.stage !== "none";
    const bActive = bi && bi.stage !== "none";
    if (aActive !== bActive) return aActive ? -1 : 1;
    if (ai?.interviewOn && bi?.interviewOn) {
      return ai.interviewOn.localeCompare(bi.interviewOn);
    }
    if (ai?.interviewOn) return -1;
    if (bi?.interviewOn) return 1;
    return a.name.localeCompare(b.name);
  });

  function patchInterview(
    school: TrackedSchool,
    changes: Partial<TrackedInterview>,
  ) {
    onPatch(school.slug, {
      interview: { ...(school.interview ?? emptyInterview()), ...changes },
    });
  }

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: totals.invited, label: "Invites to schedule" },
          { n: totals.scheduled, label: "Scheduled" },
          { n: totals.completed, label: "Interviewed" },
          { n: totals.accepted, label: "Accepted" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <span className="block text-2xl font-semibold tabular-nums">
              {s.n}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {totals.thankYouOwed > 0 && (
        <p className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
          <strong>
            {totals.thankYouOwed} thank-you note
            {totals.thankYouOwed === 1 ? "" : "s"} still unsent.
          </strong>{" "}
          Worth doing within a day or two while the conversation is fresh.
        </p>
      )}

      <section className="space-y-3">
        {sorted.map((school) => {
          const iv = school.interview ?? emptyInterview();
          const active = iv.stage !== "none";
          const days = daysUntil(iv.interviewOn, today);
          const upcoming =
            days !== null && days >= 0 && iv.stage === "scheduled";

          return (
            <article
              key={school.slug}
              className={`rounded-2xl border bg-surface p-4 sm:p-5 ${
                active ? "border-line" : "border-line/60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium">
                    <Link
                      href={`/schools/${school.slug}`}
                      className="text-accent underline underline-offset-2 hover:no-underline"
                    >
                      {school.name}
                    </Link>
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={INTERVIEW_STAGE_META[iv.stage].tone}>
                      {INTERVIEW_STAGE_META[iv.stage].label}
                    </Badge>
                    {active && iv.format !== "unknown" && (
                      <OutlineBadge>
                        {INTERVIEW_FORMAT_LABEL[iv.format]}
                      </OutlineBadge>
                    )}
                    {upcoming && (
                      <Badge tone={days <= 7 ? "warn" : "info"}>
                        {days === 0 ? "Today" : `In ${days} days`}
                      </Badge>
                    )}
                    {iv.stage === "decision" && (
                      <Badge tone={DECISION_META[iv.decision].tone}>
                        {DECISION_META[iv.decision].label}
                      </Badge>
                    )}
                    {iv.stage === "completed" && !iv.thankYouSent && (
                      <Badge tone="warn">Thank-you not sent</Badge>
                    )}
                  </div>
                </div>

                <label className="shrink-0 text-sm">
                  <span className="sr-only">
                    Interview stage for {school.name}
                  </span>
                  <select
                    value={iv.stage}
                    onChange={(e) =>
                      patchInterview(school, {
                        stage: e.target.value as InterviewStage,
                      })
                    }
                    className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                  >
                    {INTERVIEW_STAGES.map((v) => (
                      <option key={v} value={v}>
                        {INTERVIEW_STAGE_META[v].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {active && (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Invite received
                      </span>
                      <input
                        type="date"
                        value={iv.invitedOn ?? ""}
                        onChange={(e) =>
                          patchInterview(school, {
                            invitedOn: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Interview date
                      </span>
                      <input
                        type="date"
                        value={iv.interviewOn ?? ""}
                        onChange={(e) =>
                          patchInterview(school, {
                            interviewOn: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Format
                      </span>
                      <select
                        value={iv.format}
                        onChange={(e) =>
                          patchInterview(school, {
                            format: e.target.value as InterviewFormat,
                          })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      >
                        {INTERVIEW_FORMATS.map((v) => (
                          <option key={v} value={v}>
                            {INTERVIEW_FORMAT_LABEL[v]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Where / link
                      </span>
                      <input
                        type="text"
                        value={iv.location ?? ""}
                        onChange={(e) =>
                          patchInterview(school, {
                            location: e.target.value || undefined,
                          })
                        }
                        placeholder="Zoom link or address"
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={iv.thankYouSent}
                        onChange={(e) =>
                          patchInterview(school, {
                            thankYouSent: e.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      <span>Thank-you note sent</span>
                    </label>

                    {(iv.stage === "completed" || iv.stage === "decision") && (
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted">Outcome</span>
                        <select
                          value={iv.decision}
                          onChange={(e) =>
                            patchInterview(school, {
                              decision: e.target.value as Decision,
                            })
                          }
                          className="rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
                        >
                          {DECISIONS.map((v) => (
                            <option key={v} value={v}>
                              {DECISION_META[v].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>

                  <label className="mt-3 block text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Notes
                    </span>
                    <textarea
                      value={iv.notes ?? ""}
                      onChange={(e) =>
                        patchInterview(school, {
                          notes: e.target.value || undefined,
                        })
                      }
                      rows={2}
                      placeholder="Who you spoke with, what they asked, what you want to mention in the thank-you."
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                    />
                  </label>
                </>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
