/**
 * Lightweight CSV utilities used by the merge-preview UI.
 *
 * Responsibilities:
 *  - Parse RFC-4180-ish CSV text into a header + rows table.
 *  - Drop columns that are entirely empty / null-ish.
 *  - Replace remaining null-ish cells with a friendly placeholder so the
 *    final spreadsheet never shows "null", "undefined" or "N/A".
 *  - Detect numeric / amount columns (Total, Subtotal, VAT, Tax, etc.) and
 *    compute a per-column total so we can append a single "TOTAL" row at
 *    the bottom of the merged sheet.
 *  - Serialise the cleaned table (with the totals row) back to CSV text.
 *
 * Kept dependency-free so it works in both the browser and any Node
 * runtime without pulling in a CSV library.
 */

export interface CsvTable {
  /** Column headers in display order. */
  headers: string[];
  /** Data rows aligned to `headers`. Cells are always strings. */
  rows: string[][];
}

export interface CleanedCsv extends CsvTable {
  /** Column-name → numeric total. Only present for detected amount columns. */
  totals: Record<string, number>;
  /** Headers that were dropped because every value was empty. */
  droppedColumns: string[];
  /** Number of rows in `rows` after cleaning (excludes the totals row). */
  rowCount: number;
}

const NULLISH = new Set([
  "",
  "null",
  "undefined",
  "n/a",
  "na",
  "none",
  "-",
  "—",
  "nil",
]);

/** Friendly placeholder used to fill cells that were null / blank. */
export const EMPTY_PLACEHOLDER = "—";

const AMOUNT_COLUMN_RX =
  /(total|amount|subtotal|sub[\s_-]?total|tax|vat|gst|net|gross|balance|due|paid|grand|invoice[\s_-]?value|line[\s_-]?total)/i;

const NEGATIVE_PARENS_RX = /^\((.+)\)$/;

// ─── Parsing ────────────────────────────────────────────────────

/**
 * Parse a CSV string into rows of strings.
 * Handles quoted fields, escaped quotes (`""`), commas/newlines inside
 * quotes, and both CRLF and LF line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      // finish row on \n; swallow the \n in a \r\n pair
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  // flush trailing cell/row
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // drop trailing fully-empty rows
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === "")) {
    rows.pop();
  }
  return rows;
}

// ─── Numeric helpers ────────────────────────────────────────────

/** Strip currency symbols / thousands separators and parse a number. */
export function parseAmount(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s || NULLISH.has(s.toLowerCase())) return null;

  let negative = false;
  const m = NEGATIVE_PARENS_RX.exec(s);
  if (m) {
    negative = true;
    s = m[1];
  }

  // remove anything that isn't a digit, minus, dot or comma
  s = s.replace(/[^\d.,-]/g, "");
  if (!s) return null;

  // If both `,` and `.` are present, assume `,` is thousands sep.
  // Otherwise, if only `,` is present and there are exactly 2 digits after
  // the last comma, treat it as a decimal separator (EU style).
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    const parts = s.split(",");
    const tail = parts[parts.length - 1];
    if (parts.length === 2 && tail.length === 2) {
      s = parts[0] + "." + tail;
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Format a number back to a comma-grouped, 2-dp string. */
export function formatAmount(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isNullishCell(v: string): boolean {
  return NULLISH.has(String(v ?? "").trim().toLowerCase());
}

// ─── Cleaning + totals ──────────────────────────────────────────

/**
 * Decide if a column is an "amount" column we should sum.
 *
 * We require BOTH:
 *  - the header to look like a money column, AND
 *  - at least half of the non-empty cells to parse as numbers
 *
 * This avoids accidentally summing things like an "Invoice Number"
 * column that happens to contain digits.
 */
function isAmountColumn(header: string, values: string[]): boolean {
  if (!AMOUNT_COLUMN_RX.test(header)) return false;
  let numeric = 0;
  let nonEmpty = 0;
  for (const v of values) {
    if (isNullishCell(v)) continue;
    nonEmpty++;
    if (parseAmount(v) != null) numeric++;
  }
  return nonEmpty > 0 && numeric / nonEmpty >= 0.5;
}

/**
 * Take the raw CSV text returned by the merge API and produce a clean,
 * user-ready table:
 *  - drops columns where every cell is empty
 *  - replaces remaining empty cells with `—` so the sheet never shows
 *    `null` / `undefined` / blank gaps
 *  - sums detected amount columns
 */
export function cleanMergedCsv(csvText: string): CleanedCsv {
  const raw = parseCsv(csvText);
  if (raw.length === 0) {
    return { headers: [], rows: [], totals: {}, droppedColumns: [], rowCount: 0 };
  }

  const headers = raw[0].map((h) => h.trim());
  const dataRows = raw.slice(1);

  // Normalise row widths.
  const width = headers.length;
  const padded = dataRows.map((r) => {
    if (r.length === width) return r;
    if (r.length < width) return [...r, ...Array(width - r.length).fill("")];
    return r.slice(0, width);
  });

  // Find columns that are entirely empty.
  const keepIdx: number[] = [];
  const dropped: string[] = [];
  for (let c = 0; c < width; c++) {
    const hasValue = padded.some((row) => !isNullishCell(row[c]));
    if (hasValue) keepIdx.push(c);
    else dropped.push(headers[c] || `col_${c + 1}`);
  }

  const cleanHeaders = keepIdx.map((c) => headers[c]);
  const cleanRows = padded.map((row) =>
    keepIdx.map((c) => (isNullishCell(row[c]) ? EMPTY_PLACEHOLDER : row[c].trim()))
  );

  // Compute totals on the cleaned table.
  const totals: Record<string, number> = {};
  for (let c = 0; c < cleanHeaders.length; c++) {
    const header = cleanHeaders[c];
    const colValues = cleanRows.map((r) => r[c]);
    if (!isAmountColumn(header, colValues)) continue;
    let sum = 0;
    for (const v of colValues) {
      const n = parseAmount(v);
      if (n != null) sum += n;
    }
    totals[header] = sum;
  }

  return {
    headers: cleanHeaders,
    rows: cleanRows,
    totals,
    droppedColumns: dropped,
    rowCount: cleanRows.length,
  };
}

// ─── Serialisation ──────────────────────────────────────────────

function escapeCell(v: string): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Serialise a cleaned table back to CSV text, appending a single
 * `TOTAL` row at the bottom that contains the per-column sums.
 *
 * The first column's totals cell shows the literal label `TOTAL` so the
 * row is unmistakable when opened in Excel / Numbers / Sheets.
 */
export function serializeCleanedCsv(table: CleanedCsv): string {
  const lines: string[] = [];
  lines.push(table.headers.map(escapeCell).join(","));
  for (const row of table.rows) {
    lines.push(row.map(escapeCell).join(","));
  }

  if (Object.keys(table.totals).length > 0) {
    const totalsRow = table.headers.map((h, i) => {
      if (i === 0) return "TOTAL";
      if (h in table.totals) return formatAmount(table.totals[h]);
      return "";
    });
    lines.push(totalsRow.map(escapeCell).join(","));
  }

  return lines.join("\n") + "\n";
}

/**
 * Pick the "headline" total to surface in the preview UI. We prefer
 * `Total`, then `Grand Total`, then `Amount`, then the largest sum —
 * which is almost always the invoice grand total.
 */
export function pickHeadlineTotal(
  totals: Record<string, number>
): { header: string; value: number } | null {
  const entries = Object.entries(totals);
  if (entries.length === 0) return null;

  const preference = [
    /^grand[\s_-]?total$/i,
    /^total$/i,
    /^invoice[\s_-]?total$/i,
    /^amount[\s_-]?due$/i,
    /^amount$/i,
    /^net[\s_-]?total$/i,
    /^gross[\s_-]?total$/i,
  ];
  for (const rx of preference) {
    const hit = entries.find(([h]) => rx.test(h));
    if (hit) return { header: hit[0], value: hit[1] };
  }
  // Fall back to the largest sum.
  entries.sort((a, b) => b[1] - a[1]);
  return { header: entries[0][0], value: entries[0][1] };
}
