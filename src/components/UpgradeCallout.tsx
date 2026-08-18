import Link from "next/link";

/**
 * The one place Pro gets advertised: at the exact moment someone hits a
 * premium surface, saying specifically what they'd unlock. Never a banner,
 * never on every page — AGENTS.md's "do not constantly advertise Pro" rule.
 */
export function UpgradeCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-accent-soft p-5">
      <p className="leading-relaxed">{children}</p>
      <Link
        href="/pricing"
        className="mt-3 inline-block text-sm font-semibold text-accent underline underline-offset-2 hover:no-underline"
      >
        See MD Atlas Pro
      </Link>
    </div>
  );
}
