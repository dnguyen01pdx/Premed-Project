/**
 * App-wide constants. Bump CURRENT_CYCLE once a year.
 *
 * Anything in the database whose cycleYear !== CURRENT_CYCLE is presented as
 * a prior-cycle prompt, never as current.
 */
export const CURRENT_CYCLE = "2026-2027";

export const SITE_NAME = "Secondary Prompt Library";

export const SITE_TAGLINE =
  "Every US MD secondary essay prompt, searchable and free.";

/**
 * Canonical origin, used for sitemap and robots. Set NEXT_PUBLIC_SITE_URL in
 * production; Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
