"use client";

import { useSyncExternalStore, useState } from "react";
import {
  clearAllLocalData,
  downloadCsvExport,
  downloadJsonExport,
  hasAnyLocalData,
} from "@/lib/accountExport";

/** Detects hydration finishing so the initial server-rendered pass (which
 *  cannot see localStorage) does not flash "nothing to export" for a second
 *  before the real state shows. */
function subscribeNever() {
  return () => {};
}

export function ExportDataButtons() {
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [cleared, setCleared] = useState(false);
  const hasData = hydrated && hasAnyLocalData() && !cleared;

  function clearLocal() {
    const ok = window.confirm(
      "Clear everything MD Atlas has stored in this browser? This does not " +
        "touch anything already saved to your account. If you are signed " +
        "in, it comes right back next time you load the site. If you are " +
        "not signed in, this is the only copy, and this cannot be undone.",
    );
    if (!ok) return;
    clearAllLocalData();
    setCleared(true);
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-semibold">Export everything</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Every school, essay, activity, hour, and interview in one file. This
        is your data, in a form that works with no dependency on this site.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!hasData}
          onClick={downloadJsonExport}
          className="rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download JSON
        </button>
        <button
          type="button"
          disabled={!hasData}
          onClick={downloadCsvExport}
          className="rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download CSV
        </button>
      </div>
      {!hasData && (
        <p className="mt-2 text-xs text-muted">
          Nothing tracked in this browser yet.
        </p>
      )}

      <div className="mt-5 border-t border-line pt-5">
        <h3 className="text-sm font-semibold">Clear this browser&apos;s data</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Removes everything MD Atlas has stored on this device. Sign in
          first if you want a copy kept safe, and export it too, just in
          case.
        </p>
        <button
          type="button"
          disabled={!hasData}
          onClick={clearLocal}
          className="mt-3 rounded-lg border border-danger/40 bg-surface px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear local data
        </button>
      </div>
    </section>
  );
}
