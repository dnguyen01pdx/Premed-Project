import type { Metadata } from "next";
import { DashboardOverview } from "@/components/DashboardOverview";
import { SyncPanel } from "@/components/SyncPanel";
import { CURRENT_CYCLE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your whole medical school application in one view: weekly schedule, primary activities, secondary essays, and interviews.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="anim-rise">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          {CURRENT_CYCLE} cycle
        </p>
        <h1 className="mt-1.5 text-4xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Everything that is actually waiting on you, in the order it will bite.
        </p>
      </header>

      <DashboardOverview />

      <SyncPanel />
    </div>
  );
}
