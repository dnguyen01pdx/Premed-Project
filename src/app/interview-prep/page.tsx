import type { Metadata } from "next";
import { PrepBank } from "@/components/PrepBank";
import { QUESTION_CATEGORIES, TOTAL_QUESTIONS } from "@/lib/interview-questions";

export const metadata: Metadata = {
  title: "Interview prep",
  description:
    "Medical school interview questions by category, what each one is really testing, and a place to keep your own notes.",
};

export default function InterviewPrepPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Interview prep</h1>
        <p className="mt-4 leading-relaxed text-muted">
          {TOTAL_QUESTIONS} questions across {QUESTION_CATEGORIES.length}{" "}
          categories, with what the interviewer is actually listening for in
          each. Keep your notes next to the question.
        </p>
      </header>

      <section className="rounded-2xl border border-navy-100 bg-accent-soft p-5 text-sm leading-relaxed">
        <p>
          <strong>Two things to know.</strong> These are question types, not a
          claim about what any specific school asks. School-by-school question
          lists floating around online are mostly rumor, and preparing for the
          wrong one is worse than preparing for none.
        </p>
        <p className="mt-3">
          And there are no model answers here, on purpose. Same rule as our
          essay feedback: we will show you what the question is testing, never
          hand you the words. Memorized answers are audible.
        </p>
      </section>

      <PrepBank />
    </div>
  );
}
