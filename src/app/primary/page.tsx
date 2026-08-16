import type { Metadata } from "next";
import { PrimaryBoard } from "@/components/PrimaryBoard";
import { SyncPanel } from "@/components/SyncPanel";

export const metadata: Metadata = {
  title: "Primary application",
  description:
    "Log your hours and supervisor contacts as you go, then draft your AMCAS Work & Activities entries and personal statement with live character counts.",
};

export default function PrimaryPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">
          Primary application
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Two jobs, one place. If you are years out, log what you are doing while
          the details are fresh. If you are applying now, turn those entries into
          your fifteen Work &amp; Activities descriptions.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Works with no account. Everything stays in your browser unless you sign
          in to sync.
        </p>
      </header>

      <SyncPanel />
      <PrimaryBoard />
    </div>
  );
}
