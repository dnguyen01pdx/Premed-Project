import "server-only";
import { MED_MAPPED } from "./config";

export type BlogPost = {
  title: string;
  url: string;
  description: string;
  date: string | null;
};

/**
 * Shown when the feed can't be reached at build or revalidate time, so the
 * homepage section never renders empty. Update it now and then; the live feed
 * normally wins.
 */
const FALLBACK: BlogPost[] = [
  {
    title: "How to Pre-Write Med School Secondary Essays (Free Prompt-by-Prompt Plan)",
    url: `${MED_MAPPED.url}/secondary-essay-prompts-prewriting/`,
    description:
      "The secondary prompt types med schools reuse every year, how to pre-write each one before they arrive, and a free printable pre-writing checklist.",
    date: "2026-10-26T11:30:00Z",
  },
  {
    title: "How Much Does It Cost to Apply to Med School? The Real Numbers",
    url: `${MED_MAPPED.url}/how-much-does-it-cost-to-apply-to-med-school/`,
    description:
      "What applying to med school costs in 2027: MCAT and AMCAS fees, secondaries, interviews, Fee Assistance, and a free budget worksheet.",
    date: "2026-10-24T23:05:00Z",
  },
  {
    title: "The Med School Application Timeline, Month by Month (Free Checklist)",
    url: `${MED_MAPPED.url}/med-school-application-timeline/`,
    description:
      "A month-by-month med school application timeline from MCAT to acceptance, with real AMCAS dates and a free printable checklist.",
    date: "2026-10-24T23:00:00Z",
  },
];

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(item: string, name: string) {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
}

/**
 * Newest posts from medmapped.com's RSS feed. The blog is a static site that
 * rebuilds hourly, so revalidating on the same hour keeps this current with no
 * cron. Only links on the blog's own origin are accepted.
 */
export async function getLatestPosts(limit = 3): Promise<BlogPost[]> {
  try {
    const res = await fetch(MED_MAPPED.feed, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const xml = await res.text();
    const posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map(([, item]) => ({
        title: tag(item, "title"),
        url: tag(item, "link"),
        description: tag(item, "description"),
        date: tag(item, "pubDate") || null,
      }))
      .filter((p) => p.title && p.url.startsWith(MED_MAPPED.url + "/"));
    return posts.length ? posts.slice(0, limit) : FALLBACK.slice(0, limit);
  } catch {
    return FALLBACK.slice(0, limit);
  }
}
