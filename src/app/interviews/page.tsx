import type { Metadata } from "next";
import { InterviewsClient } from "@/components/InterviewsClient";
import { SyncPanel } from "@/components/SyncPanel";
import {
  TOTAL_QUESTIONS,
} from "@/lib/interview-questions";
import { ToolHeader } from "@/components/ToolHeader";

export const metadata: Metadata = {
  title: "Interviews",
  description:
    "Track every interview invite from offer to decision, and prepare with a question bank that explains what each question is actually testing.",
};

export default function InterviewsPage() {
  return (
    <div className="space-y-8">
      <ToolHeader kicker="Stop 04 · September through March" title="Interviews">
        Track your invites, dates, and thank-you notes, and practice with{" "}
        {TOTAL_QUESTIONS} common interview questions.
      </ToolHeader>

      <InterviewsClient />

      <SyncPanel />
    </div>
  );
}
