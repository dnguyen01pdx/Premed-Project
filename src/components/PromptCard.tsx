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

  // Two independent signals, because either one alone misses cases: the seed
  // data marks known truncations in `notes`, and the text itself sometimes
  // trails off in sources we scraped after that note was written.
  const truncated =
    /truncated/i.test(prompt.notes ?? "") ||
    /(\.\.\.|…)\s*$/.test(prompt.text.trim());

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

      {/* A prompt that was cut off at the source is the one genuinely dangerous
          thing we can show: it reads as complete, and writing to half a question
          wastes the essay. So this is a block-level warning, not footnote text
          sharing a line with the badges. */}
      {truncated && (
        <p className="mt-3 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-xs leading-relaxed text-warn">
          <strong>This text is incomplete.</strong> The source we found it on cut
          it off. Read the full question on your actual secondary before you
          write to it.
        </p>
      )}

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

        {prompt.notes && !truncated && <span>{prompt.notes}</span>}

        {prompt.source?.startsWith("http") && (
          <a
            href={prompt.source}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="link-sweep font-medium text-accent"
          >
            Where we got this
          </a>
        )}
      </div>
    </article>
  );
}
