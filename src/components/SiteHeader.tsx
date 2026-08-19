"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

/**
 * The stages, in the order the year happens. Five items, nothing else.
 *
 * "Prompts" and "Schools" used to sit up here as peers of the stages, which is
 * what made the site read as a prompt library wearing a dashboard costume. They
 * are reference material for exactly one stage, so they now live inside
 * Secondaries and in the footer, and the top nav only holds places you *work*.
 * About moved to the footer too — the same "who built this and why" question a
 * new visitor might have, just not important enough to outrank the five things
 * this product actually does.
 */
const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planner", label: "Planner" },
  { href: "/primary", label: "Primary" },
  { href: "/secondaries", label: "Secondaries" },
  { href: "/interviews", label: "Interviews" },
];

/**
 * Sticky header that gains a shadow and a reading-progress bar once you scroll.
 *
 * The scroll listener is passive and only ever flips a boolean plus a CSS
 * custom property, so it never blocks scrolling or triggers React re-renders
 * per frame for the progress bar.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled((prev) => (prev !== y > 8 ? y > 8 : prev));

        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(1, y / max) : 0;
        document.documentElement.style.setProperty(
          "--scroll-progress",
          String(pct),
        );
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={`on-navy sticky top-0 z-40 bg-navy-900 text-white transition-shadow duration-300 ${
        scrolled ? "shadow-lg shadow-navy-900/20" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5">
        <Link href="/" className="text-white" aria-label="MD Atlas home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-white/15 font-medium text-white"
                        : "text-navy-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="rounded-lg px-3 py-1.5 text-sm text-navy-100 hover:bg-white/10 hover:text-white md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="anim-slide border-t border-white/10 md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-sm text-navy-100 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Reading progress. Driven by a CSS variable, so it updates without a
          React render on every scroll frame. */}
      <div
        aria-hidden="true"
        className="h-0.5 origin-left bg-white/70"
        style={{ transform: "scaleX(var(--scroll-progress, 0))" }}
      />
    </header>
  );
}
