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
  "Your med school application, in one place.";

/**
 * Canonical origin, used for sitemap and robots. Set NEXT_PUBLIC_SITE_URL in
 * production; Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * The address search engines and shared links should use. This is separate
 * from SITE_URL on purpose: SITE_URL also drives the Google sign-in and Stripe
 * redirects, which stay on the vercel.app host until atlas.medmapped.com is
 * registered as an OAuth redirect URI. Without this, the sitemap and social
 * previews pointed Google at the vercel.app copy of every page.
 */
export const PUBLIC_URL =
  process.env.NEXT_PUBLIC_PUBLIC_URL ?? "https://atlas.medmapped.com";

/** Hosts that serve the same pages but must stay out of search results. */
export const NOINDEX_HOSTS = ["premed-project-vert.vercel.app"];

/**
 * MD Atlas is the free app half of Med Mapped (medmapped.com), Dylan's blog
 * about the road to med school. The header, footer and homepage link there,
 * and the homepage pulls the newest posts from its RSS feed.
 */
export const MED_MAPPED = {
  name: "Med Mapped",
  url: "https://medmapped.com",
  feed: "https://medmapped.com/feed.xml",
  tagline: "The road to med school, mapped out by a first-year med student",
};
