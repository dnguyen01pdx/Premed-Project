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
 * Pricing is not a place you work, so it stays out of NAV above — it sits to
 * the side, dimmer, on both the desktop bar and the mobile menu. Living only
 * in the footer buried it; a visitor deciding whether to bother signing up
 * should not have to scroll to the bottom of the page to find out it's free.
 */
const PRICING = { href: "/pricing", label: "Pricing" };

/**
 * Links to /account either way. Signed out, that page is the sign-in form;
 * signed in, it's account management — so one link covers both without this
 * component needing to know the auth state itself.
 */
const ACCOUNT = { href: "/account", label: "Sign in" };

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
      className={`sticky top-0 z-40 border-b bg-surface/95 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${
        scrolled
          ? "border-line shadow-[0_4px_16px_-8px_rgb(12_42_40/0.18)]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="text-navy-900" aria-label="MD Atlas home">
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
                    className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent-soft font-semibold text-accent"
                        : "text-muted hover:bg-sunken hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={PRICING.href}
            aria-current={pathname === PRICING.href ? "page" : undefined}
            className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
              pathname === PRICING.href
                ? "bg-accent-soft font-semibold text-accent"
                : "text-muted hover:bg-sunken hover:text-foreground"
            }`}
          >
            {PRICING.label}
          </Link>
          <Link
            href={ACCOUNT.href}
            aria-current={pathname === ACCOUNT.href ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              pathname === ACCOUNT.href
                ? "bg-accent-hover text-on-accent"
                : "bg-accent text-on-accent hover:bg-accent-hover"
            }`}
          >
            {ACCOUNT.label}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="rounded-full border border-line-strong px-3.5 py-1.5 text-sm font-medium text-foreground hover:bg-sunken md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="anim-slide border-t border-line md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-2 py-3 text-base text-foreground hover:bg-sunken"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <Link
                href={PRICING.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-2 py-3 text-base text-muted hover:bg-sunken"
              >
                {PRICING.label}
              </Link>
            </li>
            <li>
              <Link
                href={ACCOUNT.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-2 py-3 text-base font-semibold text-accent hover:bg-sunken"
              >
                {ACCOUNT.label}
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Reading progress. Driven by a CSS variable, so it updates without a
          React render on every scroll frame. */}
      <div
        aria-hidden="true"
        className="h-0.5 origin-left bg-accent"
        style={{ transform: "scaleX(var(--scroll-progress, 0))" }}
      />
    </header>
  );
}
