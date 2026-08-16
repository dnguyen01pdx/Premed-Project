/**
 * Storage for interview prep notes.
 *
 * Same design as the tracker: an external store backed by localStorage, read
 * through useSyncExternalStore so there is no cascading render on mount and
 * edits in one tab appear in another. Nothing here reaches a server.
 */

export const PREP_STORAGE_KEY = "mda.prep.v1";

export type PrepState = {
  version: 1;
  updatedAt: string;
  /** Keyed by the question text itself, so notes survive reordering. */
  notes: Record<string, string>;
};

const EMPTY: PrepState = { version: 1, updatedAt: "", notes: {} };

export function emptyPrep(): PrepState {
  return { version: 1, updatedAt: new Date().toISOString(), notes: {} };
}

export function parsePrep(raw: unknown): PrepState {
  if (!raw || typeof raw !== "object") return emptyPrep();
  const obj = raw as Record<string, unknown>;
  const notes: Record<string, string> = {};
  if (obj.notes && typeof obj.notes === "object") {
    for (const [k, v] of Object.entries(obj.notes as Record<string, unknown>)) {
      if (typeof k === "string" && typeof v === "string" && v.trim()) {
        notes[k.slice(0, 500)] = v.slice(0, 8000);
      }
    }
  }
  return {
    version: 1,
    updatedAt:
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
    notes,
  };
}

let cachedRaw: string | null = null;
let cachedState: PrepState = EMPTY;
const listeners = new Set<() => void>();

export function subscribeToPrep(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === PREP_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getPrepSnapshot(): PrepState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREP_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? parsePrep(JSON.parse(raw)) : EMPTY;
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

export function getPrepServerSnapshot(): PrepState {
  return EMPTY;
}

export function commitPrep(next: PrepState): boolean {
  const withStamp = { ...next, updatedAt: new Date().toISOString() };
  let ok = true;
  try {
    window.localStorage.setItem(PREP_STORAGE_KEY, JSON.stringify(withStamp));
    cachedRaw = window.localStorage.getItem(PREP_STORAGE_KEY);
    cachedState = parsePrep(withStamp);
  } catch {
    ok = false;
    cachedRaw = null;
    cachedState = parsePrep(withStamp);
  }
  for (const l of listeners) l();
  // Lets the sync panel push without polling. Same-tab localStorage writes do
  // not fire the native `storage` event, so we raise our own.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mda:local-change"));
  }
  return ok;
}

/** Subscribe/snapshot pair used purely to detect that hydration finished. */
export function subscribeNever(): () => void {
  return () => {};
}
