"use client";

import { useState } from "react";
import { Badge, OutlineBadge } from "./Badge";
import {
  DESCRIPTION_LIMIT,
  EXPERIENCE_TYPES,
  MOST_MEANINGFUL_LIMIT,
  type Experience,
  type ExperienceType,
  charCount,
  experienceHours,
} from "@/lib/primary";

/** Character counter that turns red only when actually over. */
function Counter({ text, limit }: { text: string | undefined; limit: number }) {
  const n = charCount(text);
  const over = n > limit;
  return (
    <span
      className={`text-xs tabular-nums ${over ? "font-semibold text-danger" : "text-muted"}`}
    >
      {n.toLocaleString()} / {limit.toLocaleString()}
      {over && ` · ${(n - limit).toLocaleString()} over`}
    </span>
  );
}

export function ExperienceCard({
  experience,
  canMarkMeaningful,
  onChange,
  onRemove,
}: {
  experience: Experience;
  /** False when the 3 most-meaningful slots are already taken. */
  canMarkMeaningful: boolean;
  onChange: (changes: Partial<Experience>) => void;
  onRemove: () => void;
}) {
  const [tab, setTab] = useState<"log" | "write">("log");
  const [open, setOpen] = useState(!experience.title);

  const e = experience;
  const hours = experienceHours(e);
  const noContact = !e.supervisorEmail?.trim() && !e.supervisorPhone?.trim();
  const overDesc = charCount(e.description) > DESCRIPTION_LIMIT;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="font-medium">
            {e.title || (
              <span className="text-muted">Untitled experience</span>
            )}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <OutlineBadge>{e.type}</OutlineBadge>
            {hours.completed > 0 && (
              <OutlineBadge>
                {hours.completed.toLocaleString()} hrs
                {hours.anticipated > 0 &&
                  ` + ${hours.anticipated.toLocaleString()} planned`}
              </OutlineBadge>
            )}
            {e.mostMeaningful && <Badge tone="accent">Most meaningful</Badge>}
            {noContact && <Badge tone="warn">No contact saved</Badge>}
            {overDesc && <Badge tone="danger">Over 700</Badge>}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <span aria-hidden="true" className="text-muted">
            {open ? "−" : "+"}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted underline underline-offset-2 hover:text-danger"
          >
            Remove
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line">
          <div className="flex gap-1 border-b border-line bg-sunken px-4 py-2 sm:px-5">
            {(
              [
                ["log", "Log it"],
                ["write", "Write the entry"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-navy-900 text-white"
                    : "text-muted hover:bg-accent-soft hover:text-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "log" ? (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Experience name
                  </span>
                  <input
                    value={e.title}
                    onChange={(ev) => onChange({ title: ev.target.value })}
                    placeholder="e.g. Emergency Department Volunteer"
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Organization
                  </span>
                  <input
                    value={e.organization ?? ""}
                    onChange={(ev) =>
                      onChange({ organization: ev.target.value || undefined })
                    }
                    placeholder="Where"
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Experience type
                </span>
                <select
                  value={e.type}
                  onChange={(ev) =>
                    onChange({ type: ev.target.value as ExperienceType })
                  }
                  className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                >
                  {EXPERIENCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-4">
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Start
                  </span>
                  <input
                    type="month"
                    value={e.start ?? ""}
                    onChange={(ev) =>
                      onChange({ start: ev.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    End
                  </span>
                  <input
                    type="month"
                    value={e.end ?? ""}
                    disabled={e.ongoing}
                    onChange={(ev) =>
                      onChange({ end: ev.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm disabled:bg-sunken disabled:text-muted"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Hours done
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={e.completedHours ?? ""}
                    onChange={(ev) =>
                      onChange({
                        completedHours: ev.target.value
                          ? Number(ev.target.value)
                          : undefined,
                      })
                    }
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Hours planned
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={e.anticipatedHours ?? ""}
                    onChange={(ev) =>
                      onChange({
                        anticipatedHours: ev.target.value
                          ? Number(ev.target.value)
                          : undefined,
                      })
                    }
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={e.ongoing}
                  onChange={(ev) =>
                    onChange({
                      ongoing: ev.target.checked,
                      end: ev.target.checked ? undefined : e.end,
                    })
                  }
                  className="h-4 w-4"
                />
                <span>Still doing this</span>
              </label>

              {/* The differentiating detail. Everyone remembers their hours;
                  nobody remembers the volunteer coordinator's email. */}
              <fieldset
                className={`rounded-xl border p-4 ${
                  noContact ? "border-warn/40 bg-warn-soft" : "border-line bg-sunken"
                }`}
              >
                <legend className="px-1 text-sm font-medium">
                  Who can verify this?
                </legend>
                <p className={`mb-3 text-xs leading-relaxed ${noContact ? "text-warn" : "text-muted"}`}>
                  Save this now, while you still see this person every week.
                  Tracking down a coordinator three years later is the single
                  most annoying part of filling out AMCAS.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Name
                    </span>
                    <input
                      value={e.supervisorName ?? ""}
                      onChange={(ev) =>
                        onChange({ supervisorName: ev.target.value || undefined })
                      }
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Their title
                    </span>
                    <input
                      value={e.supervisorTitle ?? ""}
                      onChange={(ev) =>
                        onChange({ supervisorTitle: ev.target.value || undefined })
                      }
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Email
                    </span>
                    <input
                      type="email"
                      value={e.supervisorEmail ?? ""}
                      onChange={(ev) =>
                        onChange({ supervisorEmail: ev.target.value || undefined })
                      }
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Phone
                    </span>
                    <input
                      type="tel"
                      value={e.supervisorPhone ?? ""}
                      onChange={(ev) =>
                        onChange({ supervisorPhone: ev.target.value || undefined })
                      }
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </fieldset>

              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Running notes
                </span>
                <p className="mb-2 text-xs leading-relaxed text-muted">
                  Write down specific moments as they happen. These become the
                  raw material for the entry and for interviews, and they are
                  impossible to reconstruct later.
                </p>
                <textarea
                  value={e.notes ?? ""}
                  onChange={(ev) =>
                    onChange({ notes: ev.target.value || undefined })
                  }
                  rows={4}
                  placeholder="March 4: the patient who was scared of the MRI and what the tech said to calm her down."
                  className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-5 p-4 sm:p-5">
              {e.notes?.trim() && (
                <details className="rounded-xl border border-line bg-sunken p-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Your notes from when this was happening
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                    {e.notes}
                  </p>
                </details>
              )}

              <label className="block text-sm">
                <span className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">
                    AMCAS description
                  </span>
                  <Counter text={e.description} limit={DESCRIPTION_LIMIT} />
                </span>
                <textarea
                  value={e.description ?? ""}
                  onChange={(ev) =>
                    onChange({ description: ev.target.value || undefined })
                  }
                  rows={6}
                  placeholder="What you did, and what it meant. Specifics beat adjectives."
                  className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm placeholder:text-muted ${
                    overDesc ? "border-danger" : "border-line-strong"
                  }`}
                />
              </label>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={e.mostMeaningful}
                  disabled={!e.mostMeaningful && !canMarkMeaningful}
                  onChange={(ev) =>
                    onChange({ mostMeaningful: ev.target.checked })
                  }
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Mark as most meaningful
                  <span className="block text-xs text-muted">
                    {!e.mostMeaningful && !canMarkMeaningful
                      ? "You already have three. Unmark another first."
                      : "Adds 1,325 characters. AMCAS allows three."}
                  </span>
                </span>
              </label>

              {e.mostMeaningful && (
                <label className="block text-sm">
                  <span className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted">
                      Most meaningful essay
                    </span>
                    <Counter
                      text={e.mostMeaningfulEssay}
                      limit={MOST_MEANINGFUL_LIMIT}
                    />
                  </span>
                  <p className="mb-2 text-xs leading-relaxed text-muted">
                    Different job from the description above: this one is about
                    impact and what changed in you, not what the role was.
                  </p>
                  <textarea
                    value={e.mostMeaningfulEssay ?? ""}
                    onChange={(ev) =>
                      onChange({
                        mostMeaningfulEssay: ev.target.value || undefined,
                      })
                    }
                    rows={8}
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm ${
                      charCount(e.mostMeaningfulEssay) > MOST_MEANINGFUL_LIMIT
                        ? "border-danger"
                        : "border-line-strong"
                    }`}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
