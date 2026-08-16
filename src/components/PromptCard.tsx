import Link from "next/link";
import type { PromptRow } from "@/lib/queries";
import { CURRENT_CYCLE } from "@/lib/config";

function limitLabel(p: PromptRow): string {
  if (p.limitUnit === "none" || p.limitValue === null) return "No stated limit";
  const unit = p.limitUnit === "words" ? "words" : "characters";
  return `${p.limitValue.toLocaleString()} ${unit}`;
}

/**
 * Renders one prompt. The cycle badge is deliberately loud: a prompt carried
 * over from a prior cycle must never read as confirmed for the current one.
 */
export function PromptCard({
  prompt,
  showSchool = true,
}: {
  prompt: PromptRow;
  showSchool?: boolean;
}) {
  const isCurrentCycle = prompt.cycleYear === CURRENT_CYCLE;

  return (
    <article className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {showSchool && (
          <Link
            href={`/schools/${prompt.schoolSlug}`}
            className="font-medium text-accent underline underline-offset-2 hover:no-underline"
          >
            {prompt.schoolShortName ?? prompt.schoolName}
          </Link>
        )}

        {prompt.typeLabel && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
            {prompt.typeLabel}
          </span>
        )}

        <span className="rounded-full border border-line px-2 py-0.5 text-muted">
          {limitLabel(prompt)}
        </span>

        {prompt.optional && (
          <span className="rounded-full border border-line px-2 py-0.5 text-muted">
            Optional
          </span>
        )}
      </div>

      <p className="text-[15px] leading-relaxed">{prompt.text}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        {isCurrentCycle && prompt.confirmed ? (
          <span className="rounded bg-ok-soft px-2 py-0.5 font-medium text-ok">
            Confirmed for {CURRENT_CYCLE}
          </span>
        ) : isCurrentCycle ? (
          <span className="rounded bg-warn-soft px-2 py-0.5 font-medium text-warn">
            Reported for {CURRENT_CYCLE} &middot; not yet verified
          </span>
        ) : (
          <span className="rounded bg-warn-soft px-2 py-0.5 font-medium text-warn">
            From the {prompt.cycleYear} cycle &middot; may not repeat
          </span>
        )}

        {prompt.notes && <span>{prompt.notes}</span>}
      </div>
    </article>
  );
}
