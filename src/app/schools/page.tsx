import Link from "next/link";
import type { Metadata } from "next";
import { listSchools } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Medical schools",
  description:
    "Browse secondary essay prompts by medical school. Every US MD program in our database, with prompt counts.",
};

export default async function SchoolsPage() {
  const schools = await listSchools();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Schools in the database
        </h1>
        <p className="mt-2 text-sm text-muted">
          {schools.length} programs. More added as prompts are verified.
        </p>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {schools.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/schools/${s.slug}`}
              className="flex items-baseline justify-between gap-4 px-5 py-4 hover:bg-accent-soft"
            >
              <span>
                <span className="text-sm font-medium">{s.name}</span>
                {(s.city || s.state) && (
                  <span className="ml-2 text-xs text-muted">
                    {[s.city, s.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {s.promptCount} {s.promptCount === 1 ? "prompt" : "prompts"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
