/**
 * "Export everything" for the account page — a JSON and a CSV option, next
 * to the delete controls. This is the P0 promise made concrete: whatever is
 * entered here is the user's, in a form they can open with no dependency on
 * this site staying up, this account existing, or Pro ever being purchased.
 *
 * JSON is the complete, lossless copy — every field, ready to be re-imported
 * or just kept as a backup. CSV reuses the same per-area tables the .xlsx
 * "export everything" button on the dashboard already builds (see
 * exportWorkbook.ts), stacked into one flat file, for anyone who wants to
 * open their data somewhere that is not this site and does not read .xlsx.
 */

import {
  getTrackerSnapshot,
  schoolsExportTable,
  trackerExportTable,
  interviewsExportTable,
  TRACKER_STORAGE_KEY,
} from "./tracker";
import {
  getPlannerSnapshot,
  hoursExportTable,
  PLANNER_STORAGE_KEY,
} from "./planner";
import {
  getPrimarySnapshot,
  activitiesExportTable,
  essaysExportTable,
  lettersExportTable,
  PRIMARY_STORAGE_KEY,
} from "./primary";
import { getPrepSnapshot, PREP_STORAGE_KEY } from "./prep";
import type { ExportTable } from "./xlsxExport";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJsonExport(): void {
  const data = {
    exportedFrom: "MD Atlas",
    exportedAt: new Date().toISOString(),
    tracker: getTrackerSnapshot(),
    primary: getPrimarySnapshot(),
    planner: getPlannerSnapshot(),
    prep: getPrepSnapshot(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, "md-atlas-data.json");
}

/** Quotes a cell only when it needs it, per RFC 4180. */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function tableToCsvBlock(title: string, table: ExportTable): string | null {
  if (table.rows.length === 0) return null;
  return [
    `# ${title}`,
    table.headers.map(csvCell).join(","),
    ...table.rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}

export function downloadCsvExport(): void {
  const tracker = getTrackerSnapshot();
  const planner = getPlannerSnapshot();
  const primary = getPrimarySnapshot();

  const blocks = [
    tableToCsvBlock("Activities", activitiesExportTable(primary)),
    tableToCsvBlock("Hours", hoursExportTable(planner)),
    tableToCsvBlock("Schools", schoolsExportTable(tracker.schools)),
    tableToCsvBlock("Secondaries", trackerExportTable(tracker.schools)),
    tableToCsvBlock("Essays", essaysExportTable(primary)),
    tableToCsvBlock("Interviews", interviewsExportTable(tracker.schools)),
    tableToCsvBlock("Letters", lettersExportTable(primary)),
  ].filter((b): b is string => b !== null);

  // A CSV with nothing tracked yet is still a valid, honest export.
  const csv =
    blocks.length > 0
      ? blocks.join("\n\n")
      : "# MD Atlas export\nNothing tracked yet.";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, "md-atlas-data.csv");
}

/** Whether there is any local data at all, so the buttons can say so honestly
 *  rather than silently downloading a file with nothing in it. */
export function hasAnyLocalData(): boolean {
  const tracker = getTrackerSnapshot();
  const primary = getPrimarySnapshot();
  const planner = getPlannerSnapshot();
  const prep = getPrepSnapshot();
  return (
    tracker.schools.length > 0 ||
    primary.experiences.length > 0 ||
    primary.personalStatement.trim().length > 0 ||
    primary.letters.length > 0 ||
    planner.events.length > 0 ||
    Object.keys(prep.notes).length > 0
  );
}

/** Wipes every local store. Used by the "clear this browser's data" control
 *  on the account page — a signed-in user's server copy is untouched. */
export function clearAllLocalData(): void {
  for (const key of [
    PRIMARY_STORAGE_KEY,
    PLANNER_STORAGE_KEY,
    PREP_STORAGE_KEY,
    TRACKER_STORAGE_KEY,
  ]) {
    window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new CustomEvent("mda:local-change"));
}
