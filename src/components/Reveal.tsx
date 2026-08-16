"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades and lifts a section into place the first time it scrolls into view.
 *
 * Three rules this follows, because scroll animation is easy to get wrong:
 *
 * 1. Content is visible by default in CSS. The hidden state is only applied
 *    once JS confirms it can also un-hide it. No JS, no IntersectionObserver,
 *    an error mid-page — the content is still readable.
 * 2. It fires once and disconnects. Elements that re-animate every time you
 *    scroll past are the single most annoying pattern on the web.
 * 3. Anyone with prefers-reduced-motion set never sees it move at all.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger in ms, for sibling cards. Keep under ~200. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    // Already on screen at mount (above the fold): show it without animating,
    // so the first paint is never a blank hero.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    setState("hidden");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${
        state === "hidden"
          ? "translate-y-6 opacity-0"
          : state === "shown"
            ? "translate-y-0 opacity-100 transition-[opacity,transform] duration-700 ease-out"
            : ""
      }`}
      style={state === "shown" && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
