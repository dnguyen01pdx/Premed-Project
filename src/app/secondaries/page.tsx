import Link from "next/link";
import type { Metadata } from "next";
import { SyncPanel } from "@/components/SyncPanel";
import { TrackerBoard } from "@/components/TrackerBoard";
import {
  getPromptsBySchool,
  getStats,
  listSchoolsForTracker,
} from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Secondaries",
  description:
    "Track every secondary essay across every school you applied to, see which prompts overlap, and write once instead of twenty times.",
};

export default async function SecondariesPage() {
  const [schools, promptsBySchool, stats] = await Promise.all([
    listSchoolsForTracker(),
    getPromptsBySchool(),
    getStats(),
  ]);

  return (
    <div className="space-y-8">
      <header className="anim-rise">
        <h1 className="text-4xl font-semibold tracking-tight">Secondaries</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          The hardest part of this stretch is not the writing, it is remembering
          what is still sitting there. Add your schools, break each into its
          individual essays, and let the overlap view show you which ones are
          really the same essay.
        </p>
      </header>

      {/* The prompt library is a reference tool, not a second product. It sits
          here, inside the stage that needs it, rather than in the top nav. */}
      <section className="anim-rise flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-navy-100 bg-accent-soft p-5">
        <p className="text-sm leading-relaxed">
          <strong>{stats.prompts.toLocaleString()} prompts</strong> collected
          across <strong>{stats.schools}</strong> programs. Add a school below
          and we will drop its prompts straight in.
        </p>
        <div className="ml-auto flex flex-wrap gap-4">
          <Link
            href="/prompts"
            className="link-sweep text-sm font-semibold text-accent"
          >
            Search all prompts &rarr;
          </Link>
          <Link
            href="/schools"
            className="link-sweep text-sm font-semibold text-accent"
          >
            Browse by school &rarr;
          </Link>
        </div>
      </section>

      <TrackerBoard schools={schools} promptsBySchool={promptsBySchool} />

      <SyncPanel />
    </div>
  );
}
