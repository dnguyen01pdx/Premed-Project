"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, OutlineBadge } from "./Badge";
import promptTypesData from "../../data/prompt-types.json";
import { guessPromptType } from "@/lib/promptTypeGuess";
import {
  STATUSES,
  STATUS_META,
  type Status,
  type TrackedEssay,
  type TrackedSchool,
  daysUntil,
  newId,
  rollUpStatus,
} from "@/lib/tracker";

export type SchoolPrompt = {
  id: string;
  text: string;
  typeKey: string | null;
  typeLabel: string | null;
  limitValue: number | null;
  limitUnit: "words" | "characters" | "none";
};

function limitText(
  value: number | null | undefined,
  unit: string | undefined,
): string | null {
  if (!unit || unit === "none" || typeof value !== "number") return null;
  return `${value.toLocaleString()} ${unit === "words" ? "words" : "characters"}`;
}

const PROMPT_TYPES = promptTypesData as Array<{ key: string; label: string }>;

export function SchoolTrackerCard({
  school,
  prompts,
  today,
  onPatch,
  onRemove,
}: {
  school: TrackedSchool;
  /** Prompts we hold for this school, for the import button. */
  prompts: SchoolPrompt[];
  today: Date;
  onPatch: (slug: string, changes: Partial<TrackedSchool>) => void;
  onRemove: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftOpenId, setDraftOpenId] = useState<string | null>(null);

  // Phase 2: optional detail captured at the moment a custom prompt is added,
  // instead of only after the fact. Collapsed by default so quick-adding a
  // prompt stays a one-line action; the fields below are exactly what makes a
  // custom prompt fully participate in the Master Essay Map, overlap, Essay
  // Coverage, and Smart Prioritization the same as an imported one.
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [addTypeKey, setAddTypeKey] = useState("");
  const [addLimitValue, setAddLimitValue] = useState("");
  const [addLimitUnit, setAddLimitUnit] = useState<"words" | "characters">("words");
  const [addDueOn, setAddDueOn] = useState("");
  const [addNotes, setAddNotes] = useState("");

  const liveGuess = draft.trim() ? guessPromptType(draft.trim()) : null;

  const essays = school.essays ?? [];
  const rolled = rollUpStatus(school);
  const days = daysUntil(school.dueOn, today);
  const overdue = days !== null && days < 0 && rolled !== "submitted";
  const soon = days !== null && days >= 0 && days <= 7 && rolled !== "submitted";

  const doneCount = essays.filter(
    (e) => e.status === "done" || e.status === "submitted",
  ).length;

  const importedIds = new Set(essays.map((e) => e.promptId).filter(Boolean));
  const importable = prompts.filter((p) => !importedIds.has(p.id));

  function setEssays(next: TrackedEssay[]) {
    onPatch(school.slug, { essays: next });
  }

  function importAll() {
    setEssays([
      ...essays,
      ...importable.map((p) => ({
        id: newId(),
        label: p.text,
        status: "not_started" as Status,
        promptId: p.id,
        typeKey: p.typeKey ?? undefined,
        typeLabel: p.typeLabel ?? undefined,
        limitValue: p.limitValue,
        limitUnit: p.limitUnit,
      })),
    ]);
    setOpen(true);
  }

  function addManual() {
    const label = draft.trim();
    if (!label) return;
    // A guessed category beats none: it's what lets a essay someone typed
    // by hand join the Master Essay Map instead of landing in
    // "Uncategorized" forever. Marked "auto" so the UI can say it's a guess,
    // and the essay row always lets it be corrected in Phase 2's category
    // picker below (or later, per-essay).
    const guess = guessPromptType(label);
    const manualType = addTypeKey
      ? PROMPT_TYPES.find((t) => t.key === addTypeKey)
      : undefined;
    const limitValue = addLimitValue.trim() ? Number(addLimitValue) : undefined;
    const validLimit =
      typeof limitValue === "number" && Number.isFinite(limitValue) && limitValue > 0
        ? limitValue
        : undefined;

    setEssays([
      ...essays,
      {
        id: newId(),
        label,
        status: "not_started",
        typeKey: manualType?.key ?? guess?.key,
        typeLabel: manualType?.label ?? guess?.label,
        typeSource: manualType ? "manual" : guess ? "auto" : undefined,
        limitValue: validLimit,
        limitUnit: validLimit ? addLimitUnit : undefined,
        dueOn: addDueOn || undefined,
        notes: addNotes.trim() || undefined,
      },
    ]);
    setDraft("");
    setAddTypeKey("");
    setAddLimitValue("");
    setAddDueOn("");
    setAddNotes("");
    setAddMoreOpen(false);
    setOpen(true);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="p-4 sm:p-5">
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
              <Badge tone={STATUS_META[rolled].tone}>
                {STATUS_META[rolled].label}
              </Badge>
              {essays.length > 0 && (
                <OutlineBadge>
                  {doneCount} of {essays.length} essays done
                </OutlineBadge>
              )}
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
            onClick={() => onRemove(school.slug)}
            className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-danger"
          >
            Remove
          </button>
        </div>

        {essays.length > 0 && (
          <div className="mt-3">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-sunken"
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={essays.length}
              aria-label={`${doneCount} of ${essays.length} essays done`}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${(doneCount / essays.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">
              Status{essays.length > 0 && " (from essays)"}
            </span>
            <select
              value={essays.length > 0 ? rolled : school.status}
              disabled={essays.length > 0}
              onChange={(e) =>
                onPatch(school.slug, { status: e.target.value as Status })
              }
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm disabled:bg-sunken disabled:text-muted"
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
              value={school.receivedOn ?? ""}
              onChange={(e) =>
                onPatch(school.slug, {
                  receivedOn: e.target.value || undefined,
                })
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
              value={school.dueOn ?? ""}
              onChange={(e) =>
                onPatch(school.slug, { dueOn: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
          >
            {open ? "Hide essays" : `Essays (${essays.length})`}
          </button>

          {importable.length > 0 && (
            <button
              type="button"
              onClick={importAll}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              + Add the {importable.length} prompt
              {importable.length === 1 ? "" : "s"} we have
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-sunken p-4 sm:p-5">
          {essays.length === 0 ? (
            <p className="text-sm text-muted">
              No essays yet.{" "}
              {prompts.length === 0 &&
                "We do not have this school's prompts on file, so add them yourself as they arrive."}
            </p>
          ) : (
            <ul className="space-y-2">
              {essays.map((essay) => (
                <li
                  key={essay.id}
                  className="rounded-xl border border-line bg-surface p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">{essay.label}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {essay.typeLabel && (
                          <Badge tone="accent">
                            {essay.typeLabel}
                            {essay.typeSource === "auto" && " (guessed)"}
                          </Badge>
                        )}
                        {limitText(essay.limitValue, essay.limitUnit) && (
                          <OutlineBadge>
                            {limitText(essay.limitValue, essay.limitUnit)}
                          </OutlineBadge>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <label className="sr-only" htmlFor={`st-${essay.id}`}>
                        Status for this essay
                      </label>
                      <select
                        id={`st-${essay.id}`}
                        value={essay.status}
                        onChange={(e) =>
                          setEssays(
                            essays.map((x) =>
                              x.id === essay.id
                                ? { ...x, status: e.target.value as Status }
                                : x,
                            ),
                          )
                        }
                        className="rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
                      >
                        {STATUSES.map((v) => (
                          <option key={v} value={v}>
                            {STATUS_META[v].label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setEssays(essays.filter((x) => x.id !== essay.id))
                        }
                        aria-label="Remove this essay"
                        className="rounded-lg px-2 py-1.5 text-xs text-muted hover:text-danger"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDraftOpenId(draftOpenId === essay.id ? null : essay.id)
                    }
                    className="mt-2.5 text-xs font-medium text-accent underline underline-offset-2 hover:no-underline"
                  >
                    {draftOpenId === essay.id
                      ? "Hide details"
                      : essay.draftText ||
                          essay.experienceTags?.length ||
                          essay.notes ||
                          essay.dueOn ||
                          essay.limitValue
                        ? "Details"
                        : "+ Add details (draft, limit, deadline, notes)"}
                  </button>

                  {draftOpenId === essay.id && (
                    <div className="mt-2.5 space-y-2.5 rounded-lg border border-line bg-sunken p-3">
                      <label className="block text-xs">
                        <span className="mb-1 block font-medium text-muted">
                          Category (used for the Master Essay Map — override
                          our guess any time)
                        </span>
                        <select
                          value={essay.typeKey ?? ""}
                          onChange={(e) => {
                            const key = e.target.value || undefined;
                            const match = PROMPT_TYPES.find((t) => t.key === key);
                            setEssays(
                              essays.map((x) =>
                                x.id === essay.id
                                  ? {
                                      ...x,
                                      typeKey: key,
                                      typeLabel: match?.label,
                                      typeSource: key ? "manual" : undefined,
                                    }
                                  : x,
                              ),
                            );
                          }}
                          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                        >
                          <option value="">Uncategorized</option>
                          {PROMPT_TYPES.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        <label className="col-span-1 block text-xs">
                          <span className="mb-1 block font-medium text-muted">
                            Limit
                          </span>
                          <input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            value={essay.limitValue ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              const n = raw ? Number(raw) : undefined;
                              const valid =
                                typeof n === "number" && Number.isFinite(n) && n > 0
                                  ? n
                                  : undefined;
                              setEssays(
                                essays.map((x) =>
                                  x.id === essay.id
                                    ? {
                                        ...x,
                                        limitValue: valid,
                                        limitUnit: valid
                                          ? x.limitUnit && x.limitUnit !== "none"
                                            ? x.limitUnit
                                            : "words"
                                          : undefined,
                                      }
                                    : x,
                                ),
                              );
                            }}
                            placeholder="e.g. 250"
                            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                          />
                        </label>
                        <label className="col-span-1 block text-xs">
                          <span className="mb-1 block font-medium text-muted">
                            Unit
                          </span>
                          <select
                            value={essay.limitUnit && essay.limitUnit !== "none" ? essay.limitUnit : "words"}
                            onChange={(e) =>
                              setEssays(
                                essays.map((x) =>
                                  x.id === essay.id
                                    ? {
                                        ...x,
                                        limitUnit: e.target.value as "words" | "characters",
                                      }
                                    : x,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                          >
                            <option value="words">Words</option>
                            <option value="characters">Characters</option>
                          </select>
                        </label>
                        <label className="col-span-2 block text-xs sm:col-span-2">
                          <span className="mb-1 block font-medium text-muted">
                            Deadline (if different from the school&apos;s)
                          </span>
                          <input
                            type="date"
                            value={essay.dueOn ?? ""}
                            onChange={(e) =>
                              setEssays(
                                essays.map((x) =>
                                  x.id === essay.id
                                    ? { ...x, dueOn: e.target.value || undefined }
                                    : x,
                                ),
                              )
                            }
                            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                          />
                        </label>
                      </div>

                      <label className="block text-xs">
                        <span className="mb-1 block font-medium text-muted">
                          Notes (optional, just for you)
                        </span>
                        <input
                          value={essay.notes ?? ""}
                          onChange={(e) =>
                            setEssays(
                              essays.map((x) =>
                                x.id === essay.id
                                  ? { ...x, notes: e.target.value || undefined }
                                  : x,
                              ),
                            )
                          }
                          placeholder="Anything you want to remember about this one"
                          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                        />
                      </label>

                      <label className="block text-xs">
                        <span className="mb-1 block font-medium text-muted">
                          Your draft (stays in this browser only — used for the
                          school-name safety check and the Essay Map)
                        </span>
                        <textarea
                          value={essay.draftText ?? ""}
                          onChange={(e) =>
                            setEssays(
                              essays.map((x) =>
                                x.id === essay.id
                                  ? {
                                      ...x,
                                      draftText: e.target.value,
                                      // Typing a draft here means they are no
                                      // longer purely reusing someone else's —
                                      // it is now this essay's own text.
                                      linkedToId: e.target.value.trim()
                                        ? undefined
                                        : x.linkedToId,
                                    }
                                  : x,
                              ),
                            )
                          }
                          rows={4}
                          placeholder="Paste your answer here, whenever you have one"
                          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                        />
                      </label>
                      <label className="block text-xs">
                        <span className="mb-1 block font-medium text-muted">
                          Experiences this draws on (comma separated — e.g. Free
                          clinic, Research)
                        </span>
                        <input
                          value={(essay.experienceTags ?? []).join(", ")}
                          onChange={(e) =>
                            setEssays(
                              essays.map((x) =>
                                x.id === essay.id
                                  ? {
                                      ...x,
                                      experienceTags: e.target.value
                                        .split(",")
                                        .map((t) => t.trim())
                                        .filter(Boolean)
                                        .slice(0, 20),
                                    }
                                  : x,
                              ),
                            )
                          }
                          placeholder="Free clinic, Research, Music"
                          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                        />
                      </label>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor={`add-${school.slug}`}>
              Add an essay for {school.name}
            </label>
            <input
              id={`add-${school.slug}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !addMoreOpen) {
                  e.preventDefault();
                  addManual();
                }
              }}
              placeholder="Paste or describe another essay prompt"
              className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
            />
            <button
              type="button"
              onClick={addManual}
              disabled={!draft.trim()}
              className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
            >
              + Add
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAddMoreOpen((v) => !v)}
            className="mt-2 text-xs font-medium text-accent underline underline-offset-2 hover:no-underline"
          >
            {addMoreOpen
              ? "Hide word limit, deadline, category & notes"
              : "+ Set word limit, deadline, category or notes"}
          </button>

          {addMoreOpen && (
            <div className="mt-2.5 grid gap-2.5 rounded-lg border border-line bg-sunken p-3 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-muted">
                  Category
                  {!addTypeKey && liveGuess ? ` (guessing: ${liveGuess.label})` : ""}
                </span>
                <select
                  value={addTypeKey}
                  onChange={(e) => setAddTypeKey(e.target.value)}
                  className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                >
                  <option value="">
                    {liveGuess ? `Use our guess (${liveGuess.label})` : "Uncategorized"}
                  </option>
                  {PROMPT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block text-xs">
                  <span className="mb-1 block font-medium text-muted">Limit</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={addLimitValue}
                    onChange={(e) => setAddLimitValue(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium text-muted">Unit</span>
                  <select
                    value={addLimitUnit}
                    onChange={(e) =>
                      setAddLimitUnit(e.target.value as "words" | "characters")
                    }
                    className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                  >
                    <option value="words">Words</option>
                    <option value="characters">Characters</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs">
                <span className="mb-1 block font-medium text-muted">
                  Deadline (only if this prompt has its own, separate from the
                  school&apos;s)
                </span>
                <input
                  type="date"
                  value={addDueOn}
                  onChange={(e) => setAddDueOn(e.target.value)}
                  className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-xs">
                <span className="mb-1 block font-medium text-muted">
                  Notes (optional)
                </span>
                <input
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Anything you want to remember about this one"
                  className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
