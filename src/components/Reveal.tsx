import type { ReactNode } from "react";

/**
 * Used to fade and slide sections in on scroll. Switched off in Oct 2026:
 * every section animating in reads as a generated template, and the content
 * should simply be there. Kept as a plain wrapper so the many call sites need
 * no change; `delay` is accepted and ignored for the same reason.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className || undefined}>{children}</div>;
}
