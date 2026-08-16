import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/Badge";
import { listSchools } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All US MD schools",
  description:
    "Every accredited US MD program, with secondary essay prompts where we have them and an honest note where we do not.",
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", PR: "Puerto Rico",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
};

export default async function SchoolsPage() {
  const schools = await listSchools();

  const byState = new Map<string, typeof schools>();
  for (const s of schools) {
    const key = s.state ?? "Other";
    byState.set(key, [...(byState.get(key) ?? []), s]);
  }
  const states = [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const withPrompts = schools.filter((s) => s.promptCount > 0).length;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          All US MD schools
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Every accredited MD-granting program in the United States and Puerto
          Rico. {withPrompts} have prompts on file so far; the rest are listed
          so you can find them, and their pages say plainly that we do not have
          their prompts yet.
        </p>
      </header>

      <nav aria-label="Jump to state" className="flex flex-wrap gap-1.5">
        {states.map(([code]) => (
          <a
            key={code}
            href={`#state-${code}`}
            className="rounded-md border border-line-strong bg-surface px-2.5 py-1 text-xs font-medium hover:border-accent hover:bg-accent-soft hover:text-accent"
          >
            {code}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {states.map(([code, list]) => (
          <section
            key={code}
            id={`state-${code}`}
            aria-labelledby={`state-${code}-heading`}
            className="scroll-mt-6"
          >
            <h2
              id={`state-${code}-heading`}
              className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted"
            >
              {STATE_NAMES[code] ?? code}
              <span className="ml-2 font-normal normal-case">
                ({list.length})
              </span>
            </h2>

            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {list.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/schools/${s.slug}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-accent-soft"
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.city && (
                        <span className="ml-2 text-xs text-muted">{s.city}</span>
                      )}
                    </span>
                    <span className="shrink-0">
                      {s.promptCount > 0 ? (
                        <Badge tone="info">
                          {s.promptCount}{" "}
                          {s.promptCount === 1 ? "prompt" : "prompts"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">No prompts yet</Badge>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
