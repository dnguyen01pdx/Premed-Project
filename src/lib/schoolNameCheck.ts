/**
 * Catches the single most expensive mistake in reusing an essay: pasting a
 * paragraph written for one school into another school's secondary and
 * leaving the wrong name in it. This never rewrites anything — it only
 * points at the sentence so the person can fix it themselves.
 */

export type SchoolNameHit = {
  slug: string;
  name: string;
  matchedOn: string;
};

export type SchoolForCheck = {
  slug: string;
  name: string;
  shortName: string | null;
};

/** Generic institutional words that would false-positive on almost every essay. */
const STOPWORDS = new Set([
  "school",
  "of",
  "medicine",
  "medical",
  "college",
  "university",
  "the",
  "at",
  "and",
  "st",
  "health",
  "sciences",
  "science",
  "center",
  "institute",
  "state",
  "campus",
  "program",
]);

/**
 * Distinctive tokens for a school: its short name whole, plus any word in the
 * full name that is not a generic institutional word and is long enough to
 * not collide by accident ("Brown", "Northwestern", "Einstein" — not "Health").
 */
function distinctiveTokens(s: SchoolForCheck): string[] {
  const tokens = new Set<string>();
  if (s.shortName && s.shortName.trim().length >= 3) {
    tokens.add(s.shortName.trim());
  }
  for (const word of s.name.split(/[\s,-]+/)) {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (clean.length >= 4 && !STOPWORDS.has(clean.toLowerCase())) {
      tokens.add(clean);
    }
  }
  return [...tokens];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scans text for other schools' distinctive names. The target school is
 * always excluded — its own name appearing in its own essay is expected, not
 * a mistake. Word-boundary, case-insensitive, whole-token matches only, so
 * "Brown" the surname doesn't collide with everything else on the page — that
 * residual false-positive rate is an acceptable cost for never missing a real
 * one, since a human reviews every hit before it means anything.
 */
export function checkSchoolNames(
  text: string,
  targetSlug: string,
  allSchools: SchoolForCheck[],
): SchoolNameHit[] {
  if (!text.trim()) return [];
  const hits: SchoolNameHit[] = [];

  for (const school of allSchools) {
    if (school.slug === targetSlug) continue;
    for (const token of distinctiveTokens(school)) {
      const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, "i");
      if (re.test(text)) {
        hits.push({ slug: school.slug, name: school.name, matchedOn: token });
        break; // one hit per school is enough to flag it
      }
    }
  }

  return hits;
}
