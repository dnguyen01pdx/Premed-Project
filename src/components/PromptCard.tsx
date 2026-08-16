import Link from "next/link";
import { Badge, OutlineBadge } from "./Badge";
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
    <article className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {showSchool && (
          <Link
            href={`/schools/${prompt.schoolSlug}`}
            className="font-medium text-accent underline underline-offset-2 hover:no-underline"
          >
            {prompt.schoolShortName ?? prompt.schoolName}
          </Link>
        )}

        {prompt.typeLabel && <Badge tone="accent">{prompt.typeLabel}</Badge>}

        <OutlineBadge>{limitLabel(prompt)}</OutlineBadge>

        {prompt.optional && <OutlineBadge>Optional</OutlineBadge>}
      </div>

      <p className="text-[15px] leading-relaxed">{prompt.text}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        {isCurrentCycle && prompt.confirmed ? (
          <Badge tone="ok">Confirmed for {CURRENT_CYCLE}</Badge>
        ) : isCurrentCycle ? (
          <Badge tone="warn">
            Reported for {CURRENT_CYCLE} &middot; not yet verified
          </Badge>
        ) : (
          <Badge tone="warn">
            From the {prompt.cycleYear} cycle &middot; may not repeat
          </Badge>
        )}

        {prompt.notes && <span>{prompt.notes}</span>}
      </div>
    </article>
  );
}
