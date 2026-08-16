import type { ReactNode } from "react";

export type Tone = "neutral" | "warn" | "info" | "ok" | "accent" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-neutral",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  ok: "bg-ok-soft text-ok",
  accent: "bg-accent-soft text-accent",
  danger: "bg-danger-soft text-danger",
};

/**
 * Status pill. Color is never the only signal: the label always says the same
 * thing the color does, so this reads correctly in grayscale and to a screen
 * reader.
 */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Outlined variant for neutral metadata like word limits. */
export function OutlineBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}
