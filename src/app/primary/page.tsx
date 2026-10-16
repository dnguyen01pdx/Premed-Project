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
          Log your activities as you do them. When you apply, turn them into
          your Work &amp; Activities entries and personal statement.
        </p>
      </header>

      <PrimaryBoard />
      <SyncPanel />
    </div>
  );
}
