import type { Metadata } from "next";
import { InterviewsClient } from "@/components/InterviewsClient";
import { SyncPanel } from "@/components/SyncPanel";
import {
  TOTAL_QUESTIONS,
} from "@/lib/interview-questions";

export const metadata: Metadata = {
  title: "Interviews",
  description:
    "Track every interview invite from offer to decision, and prepare with a question bank that explains what each question is actually testing.",
};

export default function InterviewsPage() {
  return (
    <div className="space-y-8">
      <header className="anim-rise">
        <h1 className="text-4xl font-semibold tracking-tight">Interviews</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Track your invites, dates, and thank-you notes, and practice with{" "}
          {TOTAL_QUESTIONS} common interview questions.
        </p>
      </header>

      <InterviewsClient />

      <SyncPanel />
    </div>
  );
}
