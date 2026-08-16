"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { OutlineBadge } from "./Badge";
import { QUESTION_CATEGORIES, TOTAL_QUESTIONS } from "@/lib/interview-questions";
import {
  commitPrep,
  getPrepServerSnapshot,
  getPrepSnapshot,
  subscribeNever,
  subscribeToPrep,
  type PrepState,
} from "@/lib/prep";

/**
 * The question bank plus a place to keep your own notes on each one.
 *
 * Notes are stored in the browser exactly like the tracker: this is a place to
 * think, and nothing you write about yourself needs to reach a server.
 *
 * There is no "model answer" anywhere in here on purpose. Handing someone a
 * script for an interview is the same failure as handing them essay prose.
 */
export function PrepBank() {
  const state = useSyncExternalStore(
    subscribeToPrep,
    getPrepSnapshot,
    getPrepServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const [openKey, setOpenKey] = useState<string | null>(
    QUESTION_CATEGORIES[0]?.key ?? null,
  );
  const [query, setQuery] = useState("");
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const answered = useMemo(
    () => Object.values(state.notes).filter((v) => v && v.trim()).length,
    [state.notes],
  );

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUESTION_CATEGORIES.map((c) => ({
      ...c,
      questions: c.questions.filter((item) => {
        if (onlyUnanswered && state.notes[item.q]?.trim()) return false;
        if (!q) return true;
        return (
          item.q.toLowerCase().includes(q) ||
          item.why.toLowerCase().includes(q) ||
          c.label.toLowerCase().includes(q)
        );
      }),
    })).filter((c) => c.questions.length > 0);
  }, [query, onlyUnanswered, state.notes]);

  function setNote(question: string, value: string) {
    const notes = { ...state.notes };
    if (value.trim()) notes[question] = value;
    else delete notes[question];
    commitPrep({ ...state, notes });
  }

  function download() {
    const lines: string[] = ["# My interview prep notes", ""];
    for (const c of QUESTION_CATEGORIES) {
      const withNotes = c.questions.filter((x) => state.notes[x.q]?.trim());
      if (withNotes.length === 0) continue;
      lines.push(`## ${c.label}`, "");
      for (const x of withNotes) {
        lines.push(`**${x.q}**`, "", state.notes[x.q].trim(), "");
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-prep-notes.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-prep-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(file: File) {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as PrepState;
        if (parsed && typeof parsed.notes === "object") commitPrep(parsed);
      } catch {
        // A malformed file should not wipe existing notes.
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="prep-search" className="sr-only">
            Search questions
          </label>
          <input
            id="prep-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions"
            className="w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyUnanswered}
            onChange={(e) => setOnlyUnanswered(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-muted">Only ones I haven&apos;t answered</span>
        </label>
      </div>

      {hydrated && (
        <p className="text-sm text-muted">
          <strong className="text-foreground">{answered}</strong> of{" "}
          {TOTAL_QUESTIONS} questions have your notes.
        </p>
      )}

      <div className="space-y-3">
        {categories.map((c) => {
          const open = openKey === c.key || query.trim().length > 0;
          return (
            <section
              key={c.key}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => setOpenKey(open && !query ? null : c.key)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-accent-soft"
              >
                <span className="min-w-0">
                  <span className="block font-semibold tracking-tight">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {c.blurb}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <OutlineBadge>{c.questions.length}</OutlineBadge>
                  <span aria-hidden="true" className="text-muted">
                    {open ? "−" : "+"}
                  </span>
                </span>
              </button>

              {open && (
                <ul className="divide-y divide-line border-t border-line">
                  {c.questions.map((item) => (
                    <li key={item.q} className="px-5 py-4">
                      <p className="font-medium">{item.q}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        <span className="font-medium text-foreground">
                          What they&apos;re listening for:
                        </span>{" "}
                        {item.why}
                      </p>
                      <label className="mt-3 block">
                        <span className="sr-only">Your notes for: {item.q}</span>
                        <textarea
                          value={state.notes[item.q] ?? ""}
                          onChange={(e) => setNote(item.q, e.target.value)}
                          rows={2}
                          placeholder="Your own notes. Bullet points beat a script."
                          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm placeholder:text-muted"
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {categories.length === 0 && (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
            No questions match that.
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-sunken p-5">
        <h2 className="text-sm font-semibold">Your notes</h2>
        <p className="mt-1 text-sm text-muted">
          Stored in this browser only, same as your tracker. Export before you
          clear your browser data.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            disabled={answered === 0}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Download as a document
          </button>
          <button
            type="button"
            onClick={exportBackup}
            disabled={answered === 0}
            className="rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
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
        </div>
      </section>
    </div>
  );
}
