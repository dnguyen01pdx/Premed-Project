import Link from "next/link";
import type { Metadata } from "next";
import { Badge, OutlineBadge } from "@/components/Badge";
import { CURRENT_CYCLE } from "@/lib/config";
import { getOverlapGroups, type OverlapGroup } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find overlap between secondaries",
  description:
    "See which medical schools ask the same secondary essay question, and at what length, so you can write one essay and adapt it.",
};

function limitLabel(value: number | null, unit: string) {
  if (unit === "none" || value === null) return "No stated limit";
  return `${value.toLocaleString()} ${unit === "words" ? "words" : "characters"}`;
}

/**
 * The tightest limit in a group is the one worth writing to first: it is
 * easier to expand a short essay than to cut a long one down.
 */
function tightest(group: OverlapGroup) {
  const withLimits = group.prompts.filter(
    (p) => p.limitValue !== null && p.limitUnit !== "none",
  );
  const words = withLimits.filter((p) => p.limitUnit === "words");
  const chars = withLimits.filter((p) => p.limitUnit === "characters");
  const minWords = words.length
    ? Math.min(...words.map((p) => p.limitValue!))
    : null;
  const minChars = chars.length
    ? Math.min(...chars.map((p) => p.limitValue!))
    : null;
  return { minWords, minChars };
}

export default async function OverlapPage() {
  const groups = await getOverlapGroups();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Find the overlap
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Secondaries look like twenty different applications. They are mostly
          the same eight questions in different words. Here is every school
          asking each one, with the length each expects.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Write to the tightest limit in a group first. Expanding a short essay
          is easy; cutting a long one is not.
        </p>
      </header>

      {groups.length === 0 && (
        <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
          No prompts on file for the {CURRENT_CYCLE} cycle yet.
        </p>
      )}

      <nav aria-label="Question types" className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <a
            key={g.typeKey}
            href={`#${g.typeKey}`}
            className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            {g.typeLabel}{" "}
            <span className="text-muted">({g.schoolCount})</span>
          </a>
        ))}
      </nav>

      {groups.map((g) => {
        const { minWords, minChars } = tightest(g);
        return (
          <section
            key={g.typeKey}
            id={g.typeKey}
            aria-labelledby={`${g.typeKey}-heading`}
            className="scroll-mt-6 overflow-hidden rounded-xl border border-line bg-surface"
          >
            <div className="border-b border-line bg-navy-900 px-5 py-4 text-white sm:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2
                  id={`${g.typeKey}-heading`}
                  className="text-lg font-semibold tracking-tight"
                >
                  {g.typeLabel}
                </h2>
                <p className="text-sm text-navy-100">
                  {g.schoolCount} {g.schoolCount === 1 ? "school" : "schools"} ·{" "}
                  {g.prompts.length}{" "}
                  {g.prompts.length === 1 ? "prompt" : "prompts"}
                </p>
              </div>
              {g.description && (
                <p className="mt-1.5 max-w-2xl text-sm text-navy-100">
                  {g.description}
                </p>
              )}
            </div>

            {(minWords !== null || minChars !== null) && (
              <p className="border-b border-line bg-sunken px-5 py-3 text-sm sm:px-6">
                <span className="font-medium">Write to:</span>{" "}
                <span className="text-muted">
                  {[
                    minWords !== null && `${minWords.toLocaleString()} words`,
                    minChars !== null &&
                      `${minChars.toLocaleString()} characters`,
                  ]
                    .filter(Boolean)
                    .join(" or ")}{" "}
                  — the tightest limit in this group.
                </span>
              </p>
            )}

            <ul className="divide-y divide-line">
              {g.prompts.map((p) => (
                <li key={p.id} className="px-5 py-4 sm:px-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/schools/${p.schoolSlug}`}
                      className="text-sm font-medium text-accent underline underline-offset-2 hover:no-underline"
                    >
                      {p.schoolShortName ?? p.schoolName}
                    </Link>
                    <OutlineBadge>
                      {limitLabel(p.limitValue, p.limitUnit)}
                    </OutlineBadge>
                    {p.optional && <OutlineBadge>Optional</OutlineBadge>}
                    {!p.confirmed && <Badge tone="warn">Not verified</Badge>}
                  </div>
                  <p className="text-[15px] leading-relaxed">{p.text}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
