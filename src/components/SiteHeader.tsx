"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { MED_MAPPED } from "@/lib/config";

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
 * signed in, it's account management. The label follows the real state
 * (fetched from /api/auth/me) so a signed-in visitor is never told to sign
 * in. Until that answer arrives it reads "Sign in", which is what most
 * visitors are.
 */
const ACCOUNT = { href: "/account", signedOut: "Sign in", signedIn: "Account" };

/**
 * The Med Mapped blog. Off-site, so a plain <a>, and it sits with Pricing
 * on the side rather than in NAV: it's where you read, not where you work.
 */
const BLOG = { href: MED_MAPPED.url, label: "Blog" };

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
  const [signedIn, setSignedIn] = useState(false);
  const accountLabel = signedIn ? ACCOUNT.signedIn : ACCOUNT.signedOut;

  // Re-checked on every navigation: signing out from /account redirects
  // client-side, so the header never remounts to notice on its own.
  // SyncPanel's Sign out fires mda:auth-change without navigating.
  useEffect(() => {
    let cancelled = false;
    const check = () =>
      fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { signedIn: false }))
        .then((d: { signedIn?: boolean }) => {
          if (!cancelled) setSignedIn(!!d.signedIn);
        })
        .catch(() => {});
    check();
    window.addEventListener("mda:auth-change", check);
    return () => {
      cancelled = true;
      window.removeEventListener("mda:auth-change", check);
    };
  }, [pathname]);

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
      className={`sticky top-0 z-40 border-b-2 border-navy-900 bg-background/95 backdrop-blur-md transition-[box-shadow] duration-300 ${
        scrolled ? "shadow-[0_3px_0_var(--navy-100)]" : ""
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
                    className={`nav-label block border-b-2 px-2.5 py-1.5 transition-colors lg:px-3 ${
                      active
                        ? "border-coral-pop text-navy-900"
                        : "border-transparent text-muted hover:border-navy-900 hover:text-navy-900"
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
          <a
            href={BLOG.href}
            className="nav-label px-2.5 py-1.5 text-muted hover:text-coral"
          >
            {BLOG.label}
            <span aria-hidden="true"> &#8599;</span>
          </a>
          <Link
            href={PRICING.href}
            aria-current={pathname === PRICING.href ? "page" : undefined}
            className={`nav-label px-2.5 py-1.5 transition-colors ${
              pathname === PRICING.href
                ? "text-navy-900 underline decoration-coral-pop decoration-2 underline-offset-[6px]"
                : "text-muted hover:text-navy-900"
            }`}
          >
            {PRICING.label}
          </Link>
          <Link
            href={ACCOUNT.href}
            aria-current={pathname === ACCOUNT.href ? "page" : undefined}
            className="lift bg-accent px-4 py-2 text-on-accent transition-colors hover:bg-accent-hover"
          >
            {accountLabel}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="nav-label rounded-md border-2 border-navy-900 px-3 py-1.5 text-navy-900 hover:bg-navy-900 hover:text-white md:hidden"
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
              <a
                href={BLOG.href}
                className="block rounded-lg px-2 py-3 text-base text-muted hover:bg-sunken"
              >
                {MED_MAPPED.name} blog <span aria-hidden="true">&#8599;</span>
              </a>
            </li>
            <li>
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
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Reading progress. Driven by a CSS variable, so it updates without a
          React render on every scroll frame. */}
      <div
        aria-hidden="true"
        className="h-[3px] origin-left bg-coral-pop"
        style={{ transform: "scaleX(var(--scroll-progress, 0))" }}
      />
    </header>
  );
}
