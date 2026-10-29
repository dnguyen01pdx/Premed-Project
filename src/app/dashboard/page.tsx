import type { Metadata } from "next";
import { DashboardOverview } from "@/components/DashboardOverview";
import { SyncPanel } from "@/components/SyncPanel";
import { CURRENT_CYCLE } from "@/lib/config";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your whole medical school application in one view: weekly schedule, primary activities, secondary essays, and interviews.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <ToolHeader kicker={`${CURRENT_CYCLE} cycle · Your hub`} title="Dashboard">
        What needs your attention next, most urgent first. One step at a
        time, you&apos;ve got this!
      </ToolHeader>

      <DashboardOverview />

      <SyncPanel />
    </div>
  );
}
