import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The review queue is password-gated, but it should not be in an index
      // either. Belt and braces.
      disallow: ["/admin/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
