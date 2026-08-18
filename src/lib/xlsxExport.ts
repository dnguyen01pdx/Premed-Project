/**
 * Shared .xlsx export helper.
 *
 * Every client store that offers a spreadsheet export (tracker, planner) used
 * to hand-roll a CSV string. CSV works, but it hands Excel raw text and lets
 * Excel "helpfully" reinterpret it — a 10-digit id becomes scientific
 * notation, "3-1" becomes March 1st, a leading zero disappears. A real
 * workbook says what each cell is instead of leaving Excel to guess, and it
 * opens already laid out rather than prompting an import wizard.
 *
 * `write-excel-file` is imported lazily, inside the function, rather than at
 * module scope. These stores (tracker.ts, planner.ts) are read during SSR via
 * their `getXSnapshot`/`getXServerSnapshot` pair, so anything imported at the
 * top of a module they pull in runs in Node during the server render, not
 * just in the browser. `write-excel-file/browser` only touches `document`
 * inside function bodies — not at import time — so a static import would
 * likely be fine too, but a dynamic import costs nothing and removes the
 * question entirely, plus keeps the library out of the initial bundle.
 */

export type ExportTable = {
  headers: string[];
  rows: string[][];
};

export type XlsxColumn = {
  header: string;
  /** Column width in characters. Defaults to 18, wide enough for most cells
   *  here without the sheet opening comically wide. */
  width?: number;
};

/**
 * Downloads `rows` as a single-sheet .xlsx workbook: a bold header row, sized
 * columns, and every cell forced to text (`format: "@"`) so Excel displays
 * exactly what is in the cell instead of auto-converting it.
 */
export async function downloadXlsx(
  filename: string,
  sheetName: string,
  columns: XlsxColumn[],
  rows: string[][],
): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const header = columns.map((c) => ({
    value: c.header,
    fontWeight: "bold" as const,
  }));
  const body = rows.map((row) =>
    row.map((value) => ({ value, type: String, format: "@" })),
  );

  await writeXlsxFile([header, ...body], {
    sheet: sheetName,
    columns: columns.map((c) => ({ width: c.width ?? 18 })),
  }).toFile(filename);
}
