import type { Metadata } from "next";
import { PlannerBoard } from "@/components/PlannerBoard";
import { SyncPanel } from "@/components/SyncPanel";

export const metadata: Metadata = {
  title: "Weekly planner",
  description:
    "Lay out your recurring week — classes, shifts, lab hours, volunteering — and see exactly how many hours a week each commitment actually takes.",
};

export default function PlannerPage() {
  return (
    <div className="space-y-8">
      <header className="anim-rise">
        <h1 className="text-4xl font-semibold tracking-tight">My week</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Your week repeats. Put it in once — lectures, shifts, lab, standing
          meetings, the gym — and the planner keeps a running total of where
          your time actually goes.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          The totals are not decoration. Hours per week is the number your
          application asks for, and the one nobody can reconstruct two years
          later from memory.
        </p>
      </header>

      <PlannerBoard />

      <SyncPanel />
    </div>
  );
}
