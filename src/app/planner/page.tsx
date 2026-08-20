import type { Metadata } from "next";
import { PlannerBoard } from "@/components/PlannerBoard";
import { SyncPanel } from "@/components/SyncPanel";
import { getCurrentUser } from "@/lib/auth";

// Whether someone is signed in can change on every request, so this page can
// no longer be statically generated — see the same note on /secondaries.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planner",
  description:
    "A real calendar for your premed timeline: recurring classes and shifts alongside one-time dates like your MCAT, with week, month, and year views and exactly how many hours each commitment takes.",
};

export default async function PlannerPage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-8">
      <header className="anim-rise">
        <h1 className="text-4xl font-semibold tracking-tight">Planner</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Put in what repeats (lectures, shifts, lab, standing meetings) and
          what doesn&apos;t, like your MCAT date or an application deadline.
          Both live on the same calendar, in week, month, or year view.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          The totals are not decoration. Hours per week is the number your
          application asks for, and the one nobody can reconstruct two years
          later from memory.
        </p>
      </header>

      <PlannerBoard signedIn={!!user} />

      <SyncPanel />
    </div>
  );
}
