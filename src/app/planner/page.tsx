import type { Metadata } from "next";
import { PlannerBoard } from "@/components/PlannerBoard";
import { SyncPanel } from "@/components/SyncPanel";
import { getCurrentUser } from "@/lib/auth";
import { ToolHeader } from "@/components/ToolHeader";

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
      <ToolHeader kicker="Stop 01 · Every week, all four years" title="Planner">
        Add what repeats each week, like classes, shifts, and lab, plus
        one-time dates like your MCAT. Switch between week, month, and year
        view.
      </ToolHeader>

      <PlannerBoard signedIn={!!user} />

      <SyncPanel />
    </div>
  );
}
