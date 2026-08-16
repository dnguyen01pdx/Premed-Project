import type { MetadataRoute } from "next";
import { listPromptTypes, listSchools } from "@/lib/queries";
import { SITE_URL } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [schools, types] = await Promise.all([
    listSchools(),
    listPromptTypes(),
  ]);

  const staticRoutes = ["", "/prompts", "/schools", "/how-feedback-works"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  // Per-school pages are the primary search surface: people google
  // "<school> secondary essay prompts", not "secondary prompt database".
  const schoolRoutes = schools.map((s) => ({
    url: `${SITE_URL}/schools/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const typeRoutes = types
    .filter((t) => t.key !== "administrative")
    .map((t) => ({
      url: `${SITE_URL}/prompts?type=${t.key}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...schoolRoutes, ...typeRoutes];
}
