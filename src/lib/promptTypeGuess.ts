/**
 * Guesses a prompt's category from its text, for custom prompts a user types
 * in themselves rather than importing from our database.
 *
 * Deliberately a keyword scorer, not a model call: it has to run instantly,
 * offline, on a phone, for free, and the categories it is guessing among are
 * a fixed list of fourteen (data/prompt-types.json) rather than open text. A
 * wrong guess costs the user one click to fix in a dropdown; that is a much
 * smaller failure mode than a network call that can fail, cost money, or lag.
 *
 * This is a suggestion, never an assertion: callers must always let the user
 * override it, and must record that the category came from a guess
 * (TrackedEssay.typeSource) so the UI can say so honestly.
 */

import promptTypesData from "../../data/prompt-types.json";

export type TypeGuess = { key: string; label: string; confidence: number };

const LABELS = new Map(
  (promptTypesData as Array<{ key: string; label: string }>).map((t) => [
    t.key,
    t.label,
  ]),
);

const KEYWORDS: Record<string, string[]> = {
  why_this_school: [
    "why do you want to attend",
    "why our school",
    "why our program",
    "why are you interested in",
    "what draws you to",
    "specifically to our",
    "fit our mission",
  ],
  diversity: [
    "diversity",
    "diverse",
    "different backgrounds",
    "underrepresented",
    "unique perspective",
    "contribute to our community",
    "what will you add",
  ],
  adversity: [
    "adversity",
    "challenge",
    "setback",
    "failure",
    "struggled",
    "difficult feedback",
    "obstacle",
    "hardship",
  ],
  gap_year: [
    "gap year",
    "since you submitted",
    "since applying",
    "update us",
    "what have you been doing since",
    "new information",
  ],
  ethical_dilemma: [
    "ethical dilemma",
    "ethical situation",
    "competing values",
    "difficult decision",
    "moral",
  ],
  leadership: [
    "leadership",
    "led a team",
    "advocate",
    "advocacy",
    "organized",
    "initiative you led",
  ],
  future_goals: [
    "future goals",
    "career goals",
    "where do you see yourself",
    "years from now",
    "long-term",
    "why medicine",
    "why you want to become a physician",
    "why a career in medicine",
  ],
  community_service: [
    "community service",
    "volunteer",
    "underserved",
    "give back",
    "service to others",
  ],
  clinical_experience: [
    "clinical experience",
    "shadowing",
    "patient interaction",
    "patient care",
    "observed a physician",
  ],
  research: ["research", "laboratory", "your role in the project", "publication"],
  personal_background: [
    "tell us about yourself",
    "upbringing",
    "background",
    "family",
    "who you are",
    "outside of medicine",
  ],
  reapplicant: [
    "reapplicant",
    "reapplying",
    "changed since your last application",
    "previous application",
  ],
  administrative: [
    "course list",
    "transcript",
    "disciplinary",
    "criminal",
    "scheduling",
    "felony",
    "misdemeanor",
  ],
};

/**
 * Scores every category by counting keyword hits in the prompt text and
 * returns the best match, or null when nothing scores above the noise floor
 * (in which case the caller should fall back to "open_ended" without
 * pretending to be sure).
 */
export function guessPromptType(text: string): TypeGuess | null {
  const needle = text.toLowerCase();
  let best: TypeGuess | null = null;

  for (const [key, words] of Object.entries(KEYWORDS)) {
    let hits = 0;
    for (const w of words) {
      if (needle.includes(w)) hits++;
    }
    if (hits === 0) continue;
    // Confidence is a simple ratio, capped well under 1 so the UI never
    // implies certainty a keyword count cannot back up.
    const confidence = Math.min(0.85, 0.35 + hits * 0.15);
    if (!best || confidence > best.confidence) {
      best = { key, label: LABELS.get(key) ?? key, confidence };
    }
  }

  return best;
}
