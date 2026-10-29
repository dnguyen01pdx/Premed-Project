import Link from "next/link";
import type { Metadata } from "next";
import { ProSync } from "@/components/ProSync";
import { SyncPanel } from "@/components/SyncPanel";
import { TrackerBoard } from "@/components/TrackerBoard";
import { getCurrentUser } from "@/lib/auth";
import {
  getPromptsBySchool,
  getStats,
  listSchoolsForTracker,
} from "@/lib/queries";
import { ToolHeader } from "@/components/ToolHeader";

// ProSync needs this visitor's real Pro status, so this page is rendered per
// request rather than cached from whoever loaded it last.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secondaries",
  description:
    "Track every secondary essay across every school you applied to, see which prompts overlap, and write once instead of twenty times.",
};

export default async function SecondariesPage() {
  const [schools, promptsBySchool, stats, user] = await Promise.all([
    listSchoolsForTracker(),
    getPromptsBySchool(),
    getStats(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <ToolHeader kicker="Stop 03 · June through September" title="Secondaries">
        Add the schools you applied to. Each one gets its essay prompts, so
        you can track every essay and see which schools ask the same
        question.
      </ToolHeader>

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
            Search all prompts
          </Link>
          <Link
            href="/schools"
            className="link-sweep text-sm font-semibold text-accent"
          >
            Browse by school
          </Link>
        </div>
      </section>

      <ProSync isPro={!!user?.isPro || !!user?.onTrial} signedIn={!!user} />

      <TrackerBoard schools={schools} promptsBySchool={promptsBySchool} />

      <SyncPanel />
    </div>
  );
}
