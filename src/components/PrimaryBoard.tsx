"use client";

import { useState, useSyncExternalStore } from "react";
import { Badge } from "./Badge";
import { ExperienceCard } from "./ExperienceCard";
import {
  MAX_ENTRIES,
  MAX_MOST_MEANINGFUL,
  PERSONAL_STATEMENT_LIMIT,
  type Experience,
  type LetterWriter,
  type PrimaryState,
  charCount,
  commitPrimary,
  experiencesToCsv,
  getPrimaryServerSnapshot,
  getPrimarySnapshot,
  newExperience,
  newLetter,
  primaryTotals,
  subscribeNever,
  subscribeToPrimary,
} from "@/lib/primary";

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PrimaryBoard() {
  const state = useSyncExternalStore(
    subscribeToPrimary,
    getPrimarySnapshot,
    getPrimaryServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const [tab, setTab] = useState<"experiences" | "statement" | "letters">(
    "experiences",
  );
  const [storageOk, setStorageOk] = useState(true);

  function update(next: PrimaryState) {
    setStorageOk(commitPrimary(next));
  }

  const totals = primaryTotals(state);

  function patchExperience(id: string, changes: Partial<Experience>) {
    update({
      ...state,
      experiences: state.experiences.map((e) =>
        e.id === id ? { ...e, ...changes } : e,
      ),
    });
  }

  function patchLetter(id: string, changes: Partial<LetterWriter>) {
    update({
      ...state,
      letters: state.letters.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    });
  }

  if (!hydrated) {
    return (
      <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
        Loading...
      </p>
    );
  }

  const psCount = charCount(state.personalStatement);
  const psOver = psCount > PERSONAL_STATEMENT_LIMIT;

  return (
    <div className="space-y-6">
      {!storageOk && (
        <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          Your browser is blocking local storage, so changes will not survive a
          refresh. Export a copy to be safe.
        </p>
      )}

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: `${totals.entries}/${MAX_ENTRIES}`, label: "Activities" },
          { n: totals.completed.toLocaleString(), label: "Hours logged" },
          {
            n: `${totals.mostMeaningful}/${MAX_MOST_MEANINGFUL}`,
            label: "Most meaningful",
          },
          { n: `${totals.lettersIn}/${totals.lettersAsked}`, label: "Letters in" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <span className="block text-2xl font-semibold tabular-nums">
              {s.n}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {totals.missingSupervisor > 0 && (
        <p className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm leading-relaxed text-warn">
          <strong>
            {totals.missingSupervisor}{" "}
            {totals.missingSupervisor === 1 ? "activity has" : "activities have"}{" "}
            no verifier contact saved.
          </strong>{" "}
          AMCAS asks for one per entry. Getting it now, while you still see these
          people, is far easier than tracking them down at application time.
        </p>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Primary application sections"
        className="flex gap-1 rounded-xl border border-line bg-surface p-1"
      >
        {(
          [
            ["experiences", "Work & Activities"],
            ["statement", "Personal statement"],
            ["letters", "Letters"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-navy-900 text-white"
                : "text-muted hover:bg-accent-soft hover:text-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "experiences" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {totals.entriesLeft > 0
                ? `${totals.entriesLeft} more you can add.`
                : "You have used all 15 slots."}
              {totals.described > 0 &&
                ` ${totals.described} of ${totals.entries} written up.`}
            </p>
            <button
              type="button"
              disabled={totals.entriesLeft <= 0}
              onClick={() =>
                update({
                  ...state,
                  experiences: [...state.experiences, newExperience()],
                })
              }
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              + Add an activity
            </button>
          </div>

          {state.experiences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
              <h2 className="font-semibold">Nothing logged yet</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
                Add anything you are doing now, even if applying is years away.
                Log the hours and the supervisor&apos;s email while it is easy,
                and jot down specific moments as they happen. When you apply,
                the writing part starts from something instead of nothing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.experiences.map((e) => (
                <ExperienceCard
                  key={e.id}
                  experience={e}
                  canMarkMeaningful={totals.mostMeaningfulLeft > 0}
                  onChange={(changes) => patchExperience(e.id, changes)}
                  onRemove={() =>
                    update({
                      ...state,
                      experiences: state.experiences.filter((x) => x.id !== e.id),
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "statement" && (
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Personal statement</h2>
            <span
              className={`text-sm tabular-nums ${psOver ? "font-semibold text-danger" : "text-muted"}`}
            >
              {psCount.toLocaleString()} /{" "}
              {PERSONAL_STATEMENT_LIMIT.toLocaleString()}
              {psOver && ` · ${(psCount - PERSONAL_STATEMENT_LIMIT).toLocaleString()} over`}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            AMCAS gives you 5,300 characters, spaces included. Draft it here and
            the count updates as you type.
          </p>
          <textarea
            value={state.personalStatement}
            onChange={(e) =>
              update({ ...state, personalStatement: e.target.value })
            }
            rows={20}
            placeholder="Why medicine, in your own words."
            className={`mt-4 w-full rounded-lg border bg-surface px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted ${
              psOver ? "border-danger" : "border-line-strong"
            }`}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Saved in your browser as you type. We never read it, and when essay
            feedback launches it will point at what is not working rather than
            rewriting it for you.
          </p>
        </section>
      )}

      {tab === "letters" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {totals.lettersIn} of {totals.lettersAsked} submitted
              {totals.thankYouOwed > 0 &&
                ` · ${totals.thankYouOwed} thank-you note${totals.thankYouOwed === 1 ? "" : "s"} owed`}
            </p>
            <button
              type="button"
              onClick={() =>
                update({ ...state, letters: [...state.letters, newLetter()] })
              }
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              + Add a letter writer
            </button>
          </div>

          {state.letters.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">
              No letter writers yet. Add the people you plan to ask, so you can
              see who has agreed and who has actually submitted.
            </p>
          ) : (
            <div className="space-y-3">
              {state.letters.map((l) => (
                <article
                  key={l.id}
                  className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <input
                        value={l.name}
                        onChange={(e) =>
                          patchLetter(l.id, { name: e.target.value })
                        }
                        placeholder="Their name"
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm font-medium placeholder:font-normal placeholder:text-muted"
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {l.submitted ? (
                        <Badge tone="ok">Submitted</Badge>
                      ) : l.agreed ? (
                        <Badge tone="warn">Agreed, waiting</Badge>
                      ) : (
                        <Badge tone="neutral">Asked</Badge>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            ...state,
                            letters: state.letters.filter((x) => x.id !== l.id),
                          })
                        }
                        className="text-xs text-muted underline underline-offset-2 hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Their role
                      </span>
                      <input
                        value={l.role ?? ""}
                        onChange={(e) =>
                          patchLetter(l.id, { role: e.target.value || undefined })
                        }
                        placeholder="Professor, PI, supervisor"
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        How they know you
                      </span>
                      <input
                        value={l.relationship ?? ""}
                        onChange={(e) =>
                          patchLetter(l.id, {
                            relationship: e.target.value || undefined,
                          })
                        }
                        placeholder="Orgo II, two years in her lab"
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-medium text-muted">
                        Date asked
                      </span>
                      <input
                        type="date"
                        value={l.askedOn ?? ""}
                        onChange={(e) =>
                          patchLetter(l.id, {
                            askedOn: e.target.value || undefined,
                          })
                        }
                        className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    {(
                      [
                        ["agreed", "They agreed"],
                        ["submitted", "Letter submitted"],
                        ["thankYouSent", "Thank-you sent"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={l[key]}
                          onChange={(e) =>
                            patchLetter(l.id, { [key]: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export */}
      <section className="rounded-2xl border border-line bg-sunken p-5">
        <h2 className="text-sm font-semibold">Your data</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Stored in this browser, and synced to your account if you signed in on
          the dashboard. The spreadsheet export is laid out for transcribing
          into AMCAS.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              download(
                "work-and-activities.csv",
                experiencesToCsv(state),
                "text/csv",
              )
            }
            disabled={state.experiences.length === 0}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Export for AMCAS
          </button>
          <button
            type="button"
            onClick={() =>
              download(
                "primary-backup.json",
                JSON.stringify(state, null, 2),
                "application/json",
              )
            }
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Export backup
          </button>
        </div>
      </section>
    </div>
  );
}
