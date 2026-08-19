import Link from "next/link";

/**
 * The whole cycle as one arc, meant to be read in five seconds before the
 * detailed stage cards below spell each one out. "Build" and "Primary" both
 * point at /primary on purpose — they are the same page but different
 * moments: logging activities for years, then submitting the application
 * built from them. MCAT is the one stop that leaves the site entirely, so it
 * is styled and labeled as external rather than blending in as a fifth
 * in-product stage.
 */
const STOPS = [
  { label: "Plan", href: "/planner", external: false },
  { label: "Build", href: "/primary", external: false },
  { label: "MCAT", href: "https://mcatpulse.com", external: true },
  { label: "Primary", href: "/primary", external: false },
  { label: "Secondaries", href: "/secondaries", external: false },
  { label: "Interviews", href: "/interviews", external: false },
] as const;

export function JourneyTimeline() {
  return (
    <section aria-label="The application cycle, in order">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-4">
        {STOPS.map((stop, i) => (
          <li key={stop.label} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-muted">
                &rarr;
              </span>
            )}
            {stop.external ? (
              <a
                href={stop.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
              >
                {stop.label}
                <span className="text-xs font-normal text-muted">
                  (external — MCAT Pulse)
                </span>
                <span aria-hidden="true" className="text-xs">
                  &#8599;
                </span>
              </a>
            ) : (
              <Link
                href={stop.href}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:bg-accent-soft hover:text-accent"
              >
                {stop.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
