import Link from "next/link";
import { cycleStop, type CycleStopKey } from "@/lib/cycleMoment";

/**
 * The application year drawn as a route, with a "you are here" marker on the
 * stop that matches the current month. It replaced a dashboard screenshot in
 * the hero: a screenshot goes stale every time the UI changes, and a route is
 * the one picture that says what an atlas for this process is for.
 *
 * Server-rendered, no JS. The current stop is decided by the date alone.
 */
const STOPS: Array<{
  key: CycleStopKey;
  title: string;
  when: string;
  href: string;
}> = [
  { key: "build", title: "Plan and log", when: "All year, every year", href: "/planner" },
  { key: "primary", title: "Primary application", when: "April to June", href: "/primary" },
  { key: "secondaries", title: "Secondaries", when: "June to September", href: "/secondaries" },
  { key: "interviews", title: "Interviews", when: "September to March", href: "/interviews" },
];

export function CycleRoute({ now }: { now: Date }) {
  const here = cycleStop(now);

  return (
    <nav
      aria-label="The application year"
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7"
    >
      <p className="text-sm font-medium text-navy-100">Your application year</p>
      <ol className="relative mt-5">
        {STOPS.map((s, i) => {
          const current = s.key === here.key;
          return (
            <li key={s.key} className="relative pb-6 last:pb-0">
              {/* The route: a dashed trail from this stop down to the next,
                  like a path on a map. The last stop has none. */}
              {i < STOPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-7 bottom-0 left-[11px] border-l-2 border-dashed border-white/20"
                />
              )}
              <Link
                href={s.href}
                aria-current={current ? "step" : undefined}
                className={`group flex items-start gap-4 rounded-xl py-1 pr-2 ${
                  current ? "" : "hover:bg-white/[0.04]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    current
                      ? "border-white bg-white"
                      : "border-white/35 bg-navy-900 group-hover:border-white/70"
                  }`}
                >
                  {current && (
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-display text-lg leading-snug ${
                      current ? "font-semibold text-white" : "text-navy-100"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="block text-sm text-navy-100/75">
                    {s.when}
                  </span>
                  {current && (
                    <span className="mt-3 block rounded-lg bg-white px-3.5 py-2.5 text-sm leading-relaxed text-navy-900">
                      <span className="font-semibold">You are here. </span>
                      {here.text}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
