/**
 * Where the application cycle is this month. Drives the "you are here" stop
 * on the homepage's route (CycleRoute). A visitor in October and a visitor in
 * July need different first clicks, and the date is enough to know which.
 *
 * Computed on the server. The homepage revalidates hourly, so the marker moves
 * within an hour of a month boundary, which is plenty.
 */
export type CycleStopKey = "build" | "primary" | "secondaries" | "interviews";

export type CycleStop = { key: CycleStopKey; text: string; href: string };

export function cycleStop(now: Date): CycleStop {
  // getUTCMonth is 0-based. A few hours of timezone drift at a month
  // boundary does not matter for a marker this coarse.
  const m = now.getUTCMonth() + 1;
  if (m >= 6 && m <= 9) {
    return {
      key: "secondaries",
      text: "Secondaries are arriving. Track every essay and find where they overlap.",
      href: "/secondaries",
    };
  }
  if (m === 4 || m === 5) {
    return {
      key: "primary",
      text: "AMCAS opens soon. Finish your Work & Activities and personal statement.",
      href: "/primary",
    };
  }
  return {
    key: "interviews",
    text: "Interview season. Track invites, formats, and thank-you notes.",
    href: "/interviews",
  };
}
