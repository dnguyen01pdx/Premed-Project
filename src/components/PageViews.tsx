"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PAGE_VIEWS } from "@/lib/config";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless/i;

/**
 * Counts one page view per route change. No cookies, no storage, no IP or
 * user agent leaves the browser: just the path, the referring site's domain,
 * any utm_* tags, a rough screen size, and (server-side) the time. Failures
 * are swallowed; counting must never affect the page.
 */
export function PageViews() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PAGE_VIEWS.url || !PAGE_VIEWS.key || !pathname) return;
    if (pathname.startsWith("/admin")) return;
    const host = location.hostname;
    if (navigator.webdriver || BOT.test(navigator.userAgent)) return;
    if (host === "localhost" || host === "127.0.0.1") return;

    const query = new URLSearchParams(location.search);
    const tag = (key: string) => query.get(key)?.slice(0, 100) || null;
    let referrer: string | null = null;
    try {
      const from = new URL(document.referrer);
      if (from.hostname !== host) {
        referrer = from.hostname.replace(/^www\./, "").slice(0, 200);
      }
    } catch {}
    const width = window.innerWidth;

    fetch(`${PAGE_VIEWS.url.replace(/\/$/, "")}/rest/v1/page_views`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: PAGE_VIEWS.key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        site: "atlas",
        path: pathname.slice(0, 300),
        referrer,
        utm_source: tag("utm_source"),
        utm_medium: tag("utm_medium"),
        utm_campaign: tag("utm_campaign"),
        utm_content: tag("utm_content"),
        device: width < 768 ? "mobile" : width < 1100 ? "tablet" : "desktop",
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
