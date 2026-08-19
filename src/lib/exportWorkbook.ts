/**
 * The "export everything" workbook — one .xlsx file covering the whole
 * application, not just whatever page you happen to be on. Tracker and
 * Planner each already have their own single-sheet export for someone who
 * only wants that page's data; this pulls straight from every store's own
 * localStorage snapshot and lays out a sheet per area:
 *
 *   Activities, Hours, Schools, Secondaries, Essays, Interviews, Letters
 *
 * Reading each store's snapshot function directly (rather than taking state
 * as an argument) is deliberate: this is meant to be callable from one place
 * — the dashboard — without every caller having to first mount three other
 * stores just to hand their state through.
 */

import { getTrackerSnapshot, schoolsExportTable, trackerExportTable, interviewsExportTable } from "./tracker";
import { getPlannerSnapshot, hoursExportTable } from "./planner";
import { getPrimarySnapshot, activitiesExportTable, essaysExportTable, lettersExportTable } from "./primary";
import { downloadXlsxWorkbook, type XlsxSheet } from "./xlsxExport";

const WIDE = 40;

export async function downloadFullWorkbook(): Promise<void> {
  const tracker = getTrackerSnapshot();
  const planner = getPlannerSnapshot();
  const primary = getPrimarySnapshot();

  const activities = activitiesExportTable(primary);
  const hours = hoursExportTable(planner);
  const schools = schoolsExportTable(tracker.schools);
  const secondaries = trackerExportTable(tracker.schools);
  const essays = essaysExportTable(primary);
  const interviews = interviewsExportTable(tracker.schools);
  const letters = lettersExportTable(primary);

  const sheets: XlsxSheet[] = [
    {
      name: "Activities",
      rows: activities.rows,
      columns: activities.headers.map((header) => ({
        header,
        width: header === "My notes" ? WIDE : undefined,
      })),
    },
    {
      name: "Hours",
      rows: hours.rows,
      columns: hours.headers.map((header) => ({ header })),
    },
    {
      name: "Schools",
      rows: schools.rows,
      columns: schools.headers.map((header) => ({
        header,
        width: header === "Notes" ? WIDE : undefined,
      })),
    },
    {
      name: "Secondaries",
      rows: secondaries.rows,
      columns: secondaries.headers.map((header) => ({
        header,
        width: header === "Notes" ? WIDE : undefined,
      })),
    },
    {
      name: "Essays",
      rows: essays.rows,
      columns: essays.headers.map((header) => ({
        header,
        width: header === "Text" ? 80 : undefined,
      })),
    },
    {
      name: "Interviews",
      rows: interviews.rows,
      columns: interviews.headers.map((header) => ({
        header,
        width: header === "Notes" ? WIDE : undefined,
      })),
    },
    {
      name: "Letters",
      rows: letters.rows,
      columns: letters.headers.map((header) => ({
        header,
        width: header === "Notes" ? WIDE : undefined,
      })),
    },
  ];

  await downloadXlsxWorkbook("md-atlas-export.xlsx", sheets);
}
