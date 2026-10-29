import type { Metadata } from "next";
import { PrimaryBoard } from "@/components/PrimaryBoard";
import { SyncPanel } from "@/components/SyncPanel";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Primary application",
  description:
    "Log your hours and supervisor contacts as you go, then draft your AMCAS Work & Activities entries and personal statement with live character counts.",
};

export default function PrimaryPage() {
  return (
    <div className="space-y-8">
      <ToolHeader
        kicker="Stop 02 · Sophomore year through May"
        title="Primary application"
      >
        Log your activities as you do them. When you apply, turn them into
        your Work &amp; Activities entries and personal statement.
      </ToolHeader>

      <PrimaryBoard />
      <SyncPanel />
    </div>
  );
}
