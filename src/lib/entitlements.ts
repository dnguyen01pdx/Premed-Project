/**
 * Free vs Pro, stored the same way as everything else: this browser only.
 *
 * There is no payment processor wired up yet (see /pricing) — this flag
 * exists so the Pro-gated surfaces can be built and reviewed honestly before
 * checkout exists, not so anyone can quietly unlock Pro for free. The one
 * place it is set today is a clearly-labeled "preview" toggle on /account,
 * not a purchase flow.
 */

export const ENTITLEMENTS_STORAGE_KEY = "mda.entitlements.v1";

/** How many full examples a free user sees before a feature locks the rest. */
export const FREE_PREVIEW_LIMIT = 2;

export type EntitlementState = {
  version: 1;
  pro: boolean;
  updatedAt: string;
};

const EMPTY: EntitlementState = { version: 1, pro: false, updatedAt: "" };

export function emptyEntitlements(): EntitlementState {
  return { ...EMPTY, updatedAt: new Date().toISOString() };
}

export function parseEntitlements(raw: unknown): EntitlementState {
  if (!raw || typeof raw !== "object") return emptyEntitlements();
  const obj = raw as Record<string, unknown>;
  return {
    version: 1,
    pro: obj.pro === true,
    updatedAt:
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString(),
  };
}

let cachedRaw: string | null = null;
let cachedState: EntitlementState = EMPTY;
const listeners = new Set<() => void>();

export function subscribeToEntitlements(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === ENTITLEMENTS_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getEntitlementsSnapshot(): EntitlementState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ENTITLEMENTS_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? parseEntitlements(JSON.parse(raw)) : EMPTY;
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

export function getEntitlementsServerSnapshot(): EntitlementState {
  return EMPTY;
}

export function commitEntitlements(next: EntitlementState): boolean {
  const withStamp = { ...next, updatedAt: new Date().toISOString() };
  let ok = true;
  try {
    window.localStorage.setItem(
      ENTITLEMENTS_STORAGE_KEY,
      JSON.stringify(withStamp),
    );
    cachedRaw = window.localStorage.getItem(ENTITLEMENTS_STORAGE_KEY);
    cachedState = parseEntitlements(withStamp);
  } catch {
    ok = false;
    cachedRaw = null;
    cachedState = parseEntitlements(withStamp);
  }
  for (const l of listeners) l();
  return ok;
}

export function setPro(pro: boolean): boolean {
  return commitEntitlements({ ...getEntitlementsSnapshot(), pro });
}

export function subscribeNever(): () => void {
  return () => {};
}
