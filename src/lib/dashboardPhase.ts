/**
 * "Where are you right now?" — the one dashboard preference that decides what
 * dominates the page. A sophomore three years out and an applicant drowning
 * in secondaries need almost opposite dashboards; showing both at once is
 * what made the old four-equal-panels layout feel busy no matter how good
 * each panel was on its own.
 *
 * Same shape as the other client stores: localStorage behind
 * useSyncExternalStore, a cached snapshot, no server sync — this is a display
 * preference, not application data, so it never needs to follow an account
 * between devices the way tracker/primary/planner/prep do.
 */

export const DASHBOARD_PHASE_KEY = "mda.dashboardPhase.v1";

export type Phase = "building" | "applying" | "secondaries" | "interviewing";

export const PHASES: { key: Phase; label: string; sub: string }[] = [
  {
    key: "building",
    label: "Building my application",
    sub: "1+ years out",
  },
  {
    key: "applying",
    label: "Applying this cycle",
    sub: "Primary is open now",
  },
  {
    key: "secondaries",
    label: "Secondaries in flight",
    sub: "Writing and tracking essays",
  },
  {
    key: "interviewing",
    label: "Interviewing",
    sub: "Invites are coming in",
  },
];

export function isPhase(v: unknown): v is Phase {
  return (
    v === "building" ||
    v === "applying" ||
    v === "secondaries" ||
    v === "interviewing"
  );
}

let cachedRaw: string | null = null;
let cachedState: Phase | null = null;
const listeners = new Set<() => void>();

export function subscribeToPhase(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === DASHBOARD_PHASE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** null means "not chosen yet" — the first-visit question should show. */
export function getPhaseSnapshot(): Phase | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(DASHBOARD_PHASE_KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  cachedState = isPhase(raw) ? raw : null;
  return cachedState;
}

export function getPhaseServerSnapshot(): Phase | null {
  return null;
}

export function setPhase(phase: Phase): void {
  try {
    window.localStorage.setItem(DASHBOARD_PHASE_KEY, phase);
    cachedRaw = window.localStorage.getItem(DASHBOARD_PHASE_KEY);
    cachedState = phase;
  } catch {
    cachedRaw = null;
    cachedState = phase;
  }
  for (const l of listeners) l();
}
