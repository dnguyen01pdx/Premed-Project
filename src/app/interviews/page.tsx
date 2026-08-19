import type { Metadata } from "next";
import { InterviewsClient } from "@/components/InterviewsClient";
import { SignInGate } from "@/components/SignInGate";
import { SyncPanel } from "@/components/SyncPanel";
import { getCurrentUser } from "@/lib/auth";
import {
  QUESTION_CATEGORIES,
  TOTAL_QUESTIONS,
} from "@/lib/interview-questions";

// Whether someone is signed in can change on every request, so this page can
// no longer be statically generated — see the same note on /secondaries.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Interviews",
  description:
    "Track every interview invite from offer to decision, and prepare with a question bank that explains what each question is actually testing.",
};

export default async function InterviewsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      <header className="anim-rise">
        <h1 className="text-4xl font-semibold tracking-tight">Interviews</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Invites, dates, formats, and the thank-you notes everybody forgets —
          plus {TOTAL_QUESTIONS} questions across {QUESTION_CATEGORIES.length}{" "}
          categories with what the interviewer is really listening for.
        </p>
      </header>

      <SignInGate signedIn={!!user} feature="interviews">
        <InterviewsClient />
      </SignInGate>

      <SyncPanel />
    </div>
  );
}
