/**
 * App-wide constants. Bump CURRENT_CYCLE once a year.
 *
 * Anything in the database whose cycleYear !== CURRENT_CYCLE is presented as
 * a prior-cycle prompt, never as current.
 */
export const CURRENT_CYCLE = "2026-2027";

/**
 * Prompts from cycles older than this are hidden on /prompts unless the
 * visitor asks for them. Schools rewrite secondaries often enough that text
 * this old is more noise than head start. School pages still show everything,
 * since someone on a school's page asked about that school specifically.
 */
export const OLDEST_DEFAULT_CYCLE = "2023-2024";

export const SITE_NAME = "MD Atlas";

/** Where people write in: corrections, deletion requests, questions. */
export const CONTACT_EMAIL = "mdatlas.help@gmail.com";

export const SITE_TAGLINE =
  "The operating system for your medical school application.";

/**
 * Canonical origin, used for sitemap and robots. Set NEXT_PUBLIC_SITE_URL in
 * production; Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
