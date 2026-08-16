"use client";

import Link from "next/link";
import { useState } from "react";
import { CURRENT_CYCLE } from "@/lib/config";

type SchoolOption = { slug: string; name: string };

const PRIOR_CYCLE = (() => {
  const [a, b] = CURRENT_CYCLE.split("-").map(Number);
  return `${a - 1}-${b - 1}`;
})();

export function SubmitForm({ schools }: { schools: SchoolOption[] }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [limitUnit, setLimitUnit] = useState<"words" | "characters" | "none">(
    "characters",
  );
  const [schoolSlug, setSchoolSlug] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const chosen = String(fd.get("schoolSlug") ?? "");
    const payload = {
      schoolSlug: chosen || null,
      schoolNameRaw:
        schools.find((s) => s.slug === chosen)?.name ??
        String(fd.get("schoolNameRaw") ?? ""),
      cycleYear: String(fd.get("cycleYear") ?? ""),
      promptText: String(fd.get("promptText") ?? ""),
      limitUnit: String(fd.get("limitUnit") ?? "none"),
      limitValue: String(fd.get("limitValue") ?? ""),
      note: String(fd.get("note") ?? ""),
      contactEmail: String(fd.get("contactEmail") ?? ""),
      website: String(fd.get("website") ?? ""),
    };

    setSending(true);
    setErrors({});
    setFormError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.errors ?? {});
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      setSentCount((n) => n + 1);
      // Keep school and cycle: people usually submit several prompts from the
      // same secondary in a row.
      form.querySelector<HTMLTextAreaElement>('[name="promptText"]')!.value = "";
      form.querySelector<HTMLInputElement>('[name="limitValue"]')!.value = "";
      form.querySelector<HTMLTextAreaElement>('[name="note"]')!.value = "";
    } catch {
      setFormError("Could not reach the server. Check your connection.");
    } finally {
      setSending(false);
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p className="mt-1 text-sm text-danger" role="alert">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {sentCount > 0 && (
        <div
          role="status"
          className="rounded-xl border border-ok/30 bg-ok-soft p-4 text-sm text-ok"
        >
          <strong>
            Thank you. {sentCount} prompt{sentCount === 1 ? "" : "s"} sent.
          </strong>{" "}
          It will be reviewed before it appears on the site. If your secondary
          had more essays, add the next one below — the school and cycle are
          still filled in.
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
        >
          {formError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="schoolSlug"
            className="mb-1.5 block text-sm font-medium"
          >
            School
          </label>
          <select
            id="schoolSlug"
            name="schoolSlug"
            value={schoolSlug}
            onChange={(e) => setSchoolSlug(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm"
          >
            <option value="">Not in this list</option>
            {schools.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          {err("schoolSlug")}
        </div>

        <div>
          <label
            htmlFor="cycleYear"
            className="mb-1.5 block text-sm font-medium"
          >
            Which cycle?
          </label>
          <select
            id="cycleYear"
            name="cycleYear"
            defaultValue={CURRENT_CYCLE}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm"
          >
            <option value={CURRENT_CYCLE}>{CURRENT_CYCLE}</option>
            <option value={PRIOR_CYCLE}>{PRIOR_CYCLE}</option>
          </select>
          {err("cycleYear")}
        </div>
      </div>

      {schoolSlug === "" && (
        <div>
          <label
            htmlFor="schoolNameRaw"
            className="mb-1.5 block text-sm font-medium"
          >
            School name
          </label>
          <input
            id="schoolNameRaw"
            name="schoolNameRaw"
            placeholder="Type the school's name"
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm placeholder:text-muted"
          />
          {err("schoolNameRaw")}
        </div>
      )}

      <div>
        <label htmlFor="promptText" className="mb-1.5 block text-sm font-medium">
          The prompt, word for word
        </label>
        <p className="mb-2 text-sm text-muted">
          Copy and paste it exactly as the school wrote it. Exact wording is the
          entire point — a paraphrase is worse than nothing here.
        </p>
        <textarea
          id="promptText"
          name="promptText"
          rows={5}
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm placeholder:text-muted"
          placeholder="Paste the full prompt here"
        />
        {err("promptText")}
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Length limit</legend>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="limitUnit" className="sr-only">
              Limit unit
            </label>
            <select
              id="limitUnit"
              name="limitUnit"
              value={limitUnit}
              onChange={(e) =>
                setLimitUnit(e.target.value as typeof limitUnit)
              }
              className="rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm"
            >
              <option value="characters">Characters</option>
              <option value="words">Words</option>
              <option value="none">No stated limit</option>
            </select>
          </div>
          {limitUnit !== "none" && (
            <div>
              <label htmlFor="limitValue" className="sr-only">
                Limit value
              </label>
              <input
                id="limitValue"
                name="limitValue"
                type="number"
                min={1}
                placeholder="e.g. 1500"
                className="w-36 rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm placeholder:text-muted"
              />
            </div>
          )}
        </div>
        {err("limitValue")}
      </fieldset>

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
          Anything else? <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          placeholder="Was it optional? Which number essay was it? When did the secondary arrive?"
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm placeholder:text-muted"
        />
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="mb-1.5 block text-sm font-medium"
        >
          Your email <span className="text-muted">(optional)</span>
        </label>
        <p className="mb-2 text-sm text-muted">
          Only so we can ask a follow-up question if something is unclear. Never
          shown on the site, never added to a mailing list.
        </p>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm"
        />
        {err("contactEmail")}
      </div>

      {/* Honeypot. Hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send prompt"}
        </button>
        <Link href="/prompts" className="text-sm text-accent hover:underline">
          Back to prompts
        </Link>
      </div>
    </form>
  );
}
