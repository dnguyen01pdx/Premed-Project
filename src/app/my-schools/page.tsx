import type { Metadata } from "next";
import { SyncPanel } from "@/components/SyncPanel";
import { TrackerBoard } from "@/components/TrackerBoard";
import { getPromptsBySchool, listSchoolsForTracker } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "My dashboard",
  description:
    "Track every secondary essay and every interview in one place. Works with no account; add an email to sync across devices.",
};

export default async function MySchoolsPage() {
  const [schools, promptsBySchool] = await Promise.all([
    listSchoolsForTracker(),
    getPromptsBySchool(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">My dashboard</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          The hardest part of this stretch is not the writing, it is remembering
          what is still sitting there. Add your schools, break each into its
          essays, find the ones that overlap, and track every interview invite
          through to a decision.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Works with no account at all. Add an email only if you want it on your
          phone too.
        </p>
      </header>

      <SyncPanel />

      <TrackerBoard schools={schools} promptsBySchool={promptsBySchool} />
    </div>
  );
}
