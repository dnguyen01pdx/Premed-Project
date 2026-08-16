import type { Metadata } from "next";
import { TrackerBoard } from "@/components/TrackerBoard";
import { listSchoolsForTracker } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "My schools",
  description:
    "Track every secondary you owe: which are not started, drafting, done, and submitted. Stored in your browser, no account needed.",
};

export default async function MySchoolsPage() {
  const schools = await listSchoolsForTracker();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">My schools</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          The hardest part of secondaries is not writing them. It is remembering
          which ones are still sitting there. Add your schools, set a status on
          each, and the ones with deadlines closing in float to the top.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          No account, no sign-up. Everything stays in your browser.
        </p>
      </header>

      <TrackerBoard schools={schools} />
    </div>
  );
}
