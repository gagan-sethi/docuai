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

// ─── Accounting-ready transformation ────────────────────────────

/**
 * Canonical column order for the accountant-ready export.
 * The Excel sheet and the preview table both render columns in this
 * exact order — anything not mapped is dropped, keeping the output
 * tight and predictable.
 */
export const ACCOUNTING_COLUMNS = [
  "Invoice Date",
  "Invoice Number",
  "Supplier Name",
  "TRN",
  "Description",
  "Subtotal",
  "Tax %",
  "VAT",
  "Total",
  "Currency",
  "Category",
] as const;

export type AccountingColumn = (typeof ACCOUNTING_COLUMNS)[number];

/** Columns that should be formatted as money in Excel. */
const MONEY_COLUMNS: AccountingColumn[] = ["Subtotal", "VAT", "Total"];
/** Columns that hold a parsed number (money + tax %). */
const NUMERIC_COLUMNS: AccountingColumn[] = [
  "Subtotal",
  "Tax %",
  "VAT",
  "Total",
];

/**
 * Header → canonical column matcher. The first regex that matches a
 * source header wins, so order matters (more-specific patterns first).
 */
const HEADER_MAP: Array<{ col: AccountingColumn; rx: RegExp }> = [
  // Invoice Number — must come before generic "number"
  { col: "Invoice Number", rx: /\b(invoice|inv|bill|tax\s*invoice|document)[\s_-]*(no|num(ber)?|#|id)\b/i },
  { col: "Invoice Number", rx: /^(invoice|inv|bill)[\s_-]*(no|num(ber)?|#|id)?$/i },
  // Invoice Date
  { col: "Invoice Date", rx: /\b(invoice|inv|bill|document|issue|issued)[\s_-]*date\b/i },
  { col: "Invoice Date", rx: /^date$/i },
  // Supplier — order matters: prefer explicit "supplier name" / "vendor name"
  // over generic "company"/"from" so address-ish fields don't win.
  { col: "Supplier Name", rx: /\b(supplier|vendor|seller|merchant|payee|biller)[\s_-]*name\b/i },
  { col: "Supplier Name", rx: /^(supplier|vendor|seller|merchant|payee|biller)$/i },
  { col: "Supplier Name", rx: /\b(issued[\s_-]*by|billed[\s_-]*from|sold[\s_-]*by)\b/i },
  { col: "Supplier Name", rx: /\b(company[\s_-]*name|business[\s_-]*name|trade[\s_-]*name|legal[\s_-]*name)\b/i },
  { col: "Supplier Name", rx: /^(from|company|business|merchant)$/i },
  // TRN / Tax registration / VAT number
  { col: "TRN", rx: /\b(trn|tax[\s_-]*reg(istration)?|tax[\s_-]*id|vat[\s_-]*(no|num(ber)?|reg|id)|gstin|tin)\b/i },
  // Description
  { col: "Description", rx: /\b(description|particulars|item[\s_-]*description|service|details|narration|line[\s_-]*description|remarks?)\b/i },
  // Tax %
  { col: "Tax %", rx: /\b(tax|vat|gst)[\s_-]*(rate|%|percent(age)?|pct)\b/i },
  { col: "Tax %", rx: /^(tax|vat|gst)\s*%$/i },
  // VAT amount — prefer "VAT amount" over generic "VAT"
  { col: "VAT", rx: /\b(vat|tax|gst)[\s_-]*amount\b/i },
  { col: "VAT", rx: /^(vat|tax|gst)$/i },
  // Subtotal — before "total"
  { col: "Subtotal", rx: /\b(sub[\s_-]?total|net[\s_-]*amount|amount[\s_-]*before[\s_-]*tax|taxable[\s_-]*amount|net[\s_-]*total)\b/i },
  // Total
  { col: "Total", rx: /\b(grand[\s_-]*total|total[\s_-]*amount|invoice[\s_-]*total|amount[\s_-]*due|gross[\s_-]*total|total[\s_-]*due)\b/i },
  { col: "Total", rx: /^(total|amount)$/i },
  // Currency
  { col: "Currency", rx: /\b(currency|curr|ccy)\b/i },
];

function matchAccountingColumn(header: string): AccountingColumn | null {
  const h = header.trim();
  if (!h) return null;
  for (const { col, rx } of HEADER_MAP) {
    if (rx.test(h)) return col;
  }
  return null;
}

/**
 * Auto-detect a spending category from the description / supplier text.
 * Used to populate the Category column. Order matters: the first rule
 * that matches wins, so put more-specific keywords first.
 */
const CATEGORY_RULES: Array<{ name: string; rx: RegExp }> = [
  { name: "Printing", rx: /print|stationery|paper|toner|cartridge|photocopy|copier/i },
  { name: "Food & Beverage", rx: /restaurant|cafe|coffee|catering|food|meal|lunch|dinner|grocery|bakery|kitchen/i },
  { name: "Transport", rx: /taxi|uber|careem|transport|fuel|petrol|diesel|parking|toll|salik|metro|bus|flight|airline|airport|car\s*rental/i },
  { name: "Hotel & Travel", rx: /hotel|stay|accommodation|booking|airbnb|resort|lodge/i },
  { name: "Telecom & Internet", rx: /etisalat|du\b|telecom|mobile|internet|broadband|wifi|sim|airtime/i },
  { name: "Utilities", rx: /dewa|sewa|addc|fewa|electricity|water|gas\s*bill|utility/i },
  { name: "Office Supplies", rx: /office\s*supplies|furniture|chair|desk|stapler|folder|file/i },
  { name: "IT & Software", rx: /software|license|subscription|saas|cloud|aws|azure|google\s*workspace|microsoft|adobe|laptop|computer|hardware|server/i },
  { name: "Marketing", rx: /marketing|advertis|google\s*ads|facebook\s*ads|seo|campaign|branding/i },
  { name: "Professional Services", rx: /consult|legal|lawyer|accountant|audit|advisory|attorney/i },
  { name: "Maintenance & Repair", rx: /maintenance|repair|service\s*fee|cleaning|pest/i },
  { name: "Rent", rx: /rent|lease|tenancy/i },
  { name: "Bank & Finance", rx: /bank\s*charge|finance\s*fee|interest|loan/i },
  { name: "Medical", rx: /medical|clinic|hospital|pharmacy|doctor|health/i },
  { name: "Courier & Shipping", rx: /courier|shipping|aramex|fedex|dhl|delivery|freight|logistics/i },
];

function detectCategory(text: string): string {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return EMPTY_PLACEHOLDER;
  for (const { name, rx } of CATEGORY_RULES) {
    if (rx.test(t)) return name;
  }
  return "Other";
}

/**
 * Heuristic: does this string look like a postal address rather than a
 * supplier/business name? Addresses commonly include things like
 * "PO Box", "Street", "Road", "Floor", building numbers, postal codes,
 * or contain commas separating address parts.
 */
const ADDRESS_HINTS_RX =
  /\b(p\.?\s*o\.?\s*box|po\s*box|street|st\.?|road|rd\.?|avenue|ave\.?|boulevard|blvd|building|bldg|tower|floor|fl\.?|suite|ste\.?|warehouse|unit|behind|opposite|near|villa|apartment|apt|room|sector|district|zone|industrial\s*area|free\s*zone|al\s+\w+|sheikh|emirate|dubai|abu\s*dhabi|sharjah|ajman|fujairah|ras\s*al\s*khaimah|umm\s*al\s*quwain|uae|u\.a\.e\.|p\.box)\b/i;

function looksLikeAddress(s: string): boolean {
  if (!s) return false;
  const v = s.trim();
  if (!v) return false;
  if (ADDRESS_HINTS_RX.test(v)) return true;
  // Multiple comma-separated parts that include digits → likely an address.
  const parts = v.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && /\d/.test(v) && v.length > 25) return true;
  return false;
}

/**
 * Pick the best supplier-name candidate from one or more raw values.
 * Prefers values that don't look like addresses; falls back to the
 * first non-empty value if every candidate is address-like.
 */
function pickSupplierName(candidates: string[]): string {
  const cleaned = candidates
    .map((v) => (v || "").trim())
    .filter((v) => v && v !== EMPTY_PLACEHOLDER);
  if (cleaned.length === 0) return "";
  const nonAddress = cleaned.find((v) => !looksLikeAddress(v));
  return nonAddress ?? cleaned[0];
}

export interface AccountingTable {
  /** Always equal to ACCOUNTING_COLUMNS. */
  headers: AccountingColumn[];
  /** String-formatted rows for display; numeric cols are pretty-printed. */
  rows: string[][];
  /** Parallel rows of raw numbers for numeric columns (null when missing). */
  numericRows: Array<Partial<Record<AccountingColumn, number | null>>>;
  /** Source CSV columns that did not map to any canonical column. */
  unmappedHeaders: string[];
  /** Headline summary used in the on-screen banner and Excel header. */
  summary: {
    totalInvoices: number;
    totalAmount: number;
    totalVat: number;
    currency: string;
  };
}

/**
 * Convert a cleaned CSV table into the accountant-ready, fixed-schema
 * table used for both preview and Excel export.
 */
export function buildAccountingTable(cleaned: CleanedCsv): AccountingTable {
  // Build a map: canonical column → list of source header indices.
  // We keep multiple matches because some sheets have e.g. both a
  // "Tax %" and a "VAT Rate" column; we'll merge non-empty values.
  const colToSrc: Partial<Record<AccountingColumn, number[]>> = {};
  const unmapped: string[] = [];

  for (let i = 0; i < cleaned.headers.length; i++) {
    const canonical = matchAccountingColumn(cleaned.headers[i]);
    if (!canonical) {
      unmapped.push(cleaned.headers[i]);
      continue;
    }
    (colToSrc[canonical] ||= []).push(i);
  }

  const rows: string[][] = [];
  const numericRows: AccountingTable["numericRows"] = [];

  let totalAmount = 0;
  let totalVat = 0;
  const currencyCounts: Record<string, number> = {};

  for (const srcRow of cleaned.rows) {
    const out: string[] = [];
    const numeric: Partial<Record<AccountingColumn, number | null>> = {};

    // First pass: gather raw values for each canonical column.
    const rawByCol: Partial<Record<AccountingColumn, string>> = {};
    for (const col of ACCOUNTING_COLUMNS) {
      const idxs = colToSrc[col];
      if (!idxs || idxs.length === 0) continue;
      // Collect every non-empty candidate across mapped source columns.
      const candidates: string[] = [];
      for (const idx of idxs) {
        const v = srcRow[idx];
        if (v && v !== EMPTY_PLACEHOLDER && v.trim()) {
          candidates.push(v.trim());
        }
      }
      if (candidates.length === 0) {
        rawByCol[col] = "";
      } else if (col === "Supplier Name") {
        // Avoid picking an address when a real business name is also present.
        rawByCol[col] = pickSupplierName(candidates);
      } else {
        rawByCol[col] = candidates[0];
      }
    }

    // If the supplier slot ended up holding an address (e.g. backend
    // mislabelled a column), try to recover from any unmapped source
    // column that doesn't look like an address and isn't already used.
    if (
      (!rawByCol["Supplier Name"] || looksLikeAddress(rawByCol["Supplier Name"]!))
    ) {
      const usedIdxs = new Set<number>();
      for (const idxs of Object.values(colToSrc)) {
        if (idxs) for (const i of idxs) usedIdxs.add(i);
      }
      for (let i = 0; i < cleaned.headers.length; i++) {
        if (usedIdxs.has(i)) continue;
        const h = cleaned.headers[i].toLowerCase();
        if (!/(name|company|business|supplier|vendor|seller|merchant|payee|biller)/i.test(h)) continue;
        const v = (srcRow[i] || "").trim();
        if (v && v !== EMPTY_PLACEHOLDER && !looksLikeAddress(v)) {
          rawByCol["Supplier Name"] = v;
          break;
        }
      }
    }

    // Derive Subtotal when missing but Total + (VAT or Tax %) are known.
    // Many invoices only expose the Total + tax line, leaving Subtotal blank.
    {
      const subRaw = rawByCol["Subtotal"];
      const hasSub = subRaw && subRaw !== EMPTY_PLACEHOLDER && parseAmount(subRaw) != null;
      if (!hasSub) {
        const totalN = parseAmount(rawByCol["Total"] || "");
        const vatN = parseAmount(rawByCol["VAT"] || "");
        const taxN = parseAmount(rawByCol["Tax %"] || "");
        let derived: number | null = null;
        if (totalN != null && vatN != null) {
          derived = totalN - vatN;
        } else if (totalN != null && taxN != null && taxN > -100) {
          derived = totalN / (1 + taxN / 100);
        } else if (vatN != null && taxN != null && taxN > 0) {
          derived = vatN / (taxN / 100);
        }
        if (derived != null && Number.isFinite(derived)) {
          rawByCol["Subtotal"] = formatAmount(derived);
        }
      }
    }

    // Derive VAT when missing but Subtotal + Tax % (or Total) are known.
    {
      const vatRaw = rawByCol["VAT"];
      const hasVat = vatRaw && vatRaw !== EMPTY_PLACEHOLDER && parseAmount(vatRaw) != null;
      if (!hasVat) {
        const subN = parseAmount(rawByCol["Subtotal"] || "");
        const totalN = parseAmount(rawByCol["Total"] || "");
        const taxN = parseAmount(rawByCol["Tax %"] || "");
        let derived: number | null = null;
        if (subN != null && taxN != null && taxN >= 0) {
          derived = subN * (taxN / 100);
        } else if (totalN != null && subN != null) {
          derived = totalN - subN;
        }
        if (derived != null && Number.isFinite(derived) && derived >= 0) {
          rawByCol["VAT"] = formatAmount(derived);
        }
      }
    }

    // Derive Total when missing but Subtotal + VAT are known.
    {
      const totRaw = rawByCol["Total"];
      const hasTot = totRaw && totRaw !== EMPTY_PLACEHOLDER && parseAmount(totRaw) != null;
      if (!hasTot) {
        const subN = parseAmount(rawByCol["Subtotal"] || "");
        const vatN = parseAmount(rawByCol["VAT"] || "");
        if (subN != null && vatN != null) {
          rawByCol["Total"] = formatAmount(subN + vatN);
        }
      }
    }

    // Auto-detect category if not already mapped.
    if (!rawByCol["Category"]) {
      const desc = rawByCol["Description"] || "";
      const supplier = rawByCol["Supplier Name"] || "";
      rawByCol["Category"] = detectCategory(`${desc} ${supplier}`);
    }

    // Second pass: format each canonical column for output.
    for (const col of ACCOUNTING_COLUMNS) {
      const raw = rawByCol[col] ?? "";
      if (NUMERIC_COLUMNS.includes(col)) {
        const n = parseAmount(raw);
        numeric[col] = n;
        if (n == null) {
          out.push(EMPTY_PLACEHOLDER);
        } else if (col === "Tax %") {
          // Display tax % without forcing 2dp (e.g. 5 → "5%").
          const isWhole = Math.abs(n - Math.round(n)) < 0.01;
          out.push(isWhole ? `${Math.round(n)}%` : `${n.toFixed(2)}%`);
        } else {
          out.push(formatAmount(n));
        }
      } else {
        out.push(raw && raw.trim() ? raw : EMPTY_PLACEHOLDER);
      }
    }

    rows.push(out);
    numericRows.push(numeric);

    if (typeof numeric["Total"] === "number") totalAmount += numeric["Total"]!;
    if (typeof numeric["VAT"] === "number") totalVat += numeric["VAT"]!;

    const cur = (rawByCol["Currency"] || "").toUpperCase().trim();
    if (cur && cur !== EMPTY_PLACEHOLDER) {
      currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
    }
  }

  // Most-common currency wins for the summary line.
  const currency =
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  return {
    headers: [...ACCOUNTING_COLUMNS],
    rows,
    numericRows,
    unmappedHeaders: unmapped,
    summary: {
      totalInvoices: rows.length,
      totalAmount,
      totalVat,
      currency,
    },
  };
}

// ─── Excel (XLSX) export ────────────────────────────────────────

/**
 * Generate a styled, accountant-ready `.xlsx` workbook from an
 * AccountingTable and trigger a browser download.
 *
 * Formatting:
 *  - Summary block at the top (Total invoices / Total amount / Total VAT)
 *  - Bold, coloured header row
 *  - Frozen header row
 *  - Money columns formatted with thousands separator + 2 decimals
 *  - Tax % column formatted as a percentage
 *  - Auto-sized columns
 *  - Bold "TOTAL" row at the bottom
 */
export async function downloadAccountingXlsx(
  table: AccountingTable,
  fileName: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "DocuAI";
  wb.created = new Date();

  const ws = wb.addWorksheet("Invoices", {
    views: [{ state: "frozen", ySplit: 5 }], // freeze rows above the data
  });

  const moneyFmt = "#,##0.00";
  const pctFmt = "0.00";

  // ─── Summary block (rows 1–3) ──────────────────────────────────
  const cur = table.summary.currency ? ` ${table.summary.currency}` : "";
  const summaryItems: Array<[string, string | number, string?]> = [
    ["Total Invoices", table.summary.totalInvoices],
    ["Total Amount", table.summary.totalAmount, moneyFmt],
    ["Total VAT", table.summary.totalVat, moneyFmt],
  ];
  for (let i = 0; i < summaryItems.length; i++) {
    const [label, value, fmt] = summaryItems[i];
    const row = ws.getRow(i + 1);
    const labelCell = row.getCell(1);
    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: "FF0F766E" } };
    labelCell.alignment = { vertical: "middle" };
    const valueCell = row.getCell(2);
    valueCell.value = value;
    valueCell.font = { bold: true, size: 12 };
    if (fmt) valueCell.numFmt = fmt;
    if (label !== "Total Invoices" && cur) {
      const curCell = row.getCell(3);
      curCell.value = table.summary.currency;
      curCell.font = { bold: true, color: { argb: "FF64748B" } };
    }
    row.height = 18;
  }
  // Empty spacer row 4
  ws.getRow(4).height = 6;

  // ─── Header row (row 5) ────────────────────────────────────────
  const headerRowIdx = 5;
  const headerRow = ws.getRow(headerRowIdx);
  table.headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // emerald-600
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF047857" } },
      bottom: { style: "thin", color: { argb: "FF047857" } },
    };
  });
  headerRow.height = 22;

  // Freeze rows above headerRow + 1 (so headers stay visible).
  ws.views = [{ state: "frozen", ySplit: headerRowIdx }];

  // ─── Data rows ─────────────────────────────────────────────────
  for (let r = 0; r < table.rows.length; r++) {
    const display = table.rows[r];
    const numeric = table.numericRows[r];
    const row = ws.getRow(headerRowIdx + 1 + r);
    table.headers.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      if (NUMERIC_COLUMNS.includes(col)) {
        const n = numeric[col];
        if (n == null) {
          cell.value = null;
        } else {
          cell.value = n;
          if (col === "Tax %") cell.numFmt = pctFmt;
          else cell.numFmt = moneyFmt;
        }
      } else {
        const v = display[i];
        cell.value = v === EMPTY_PLACEHOLDER ? null : v;
      }
      cell.alignment = { vertical: "middle" };
    });
    // Zebra stripe on alternating rows.
    if (r % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      });
    }
  }

  // ─── TOTAL row at bottom ───────────────────────────────────────
  const totalRowIdx = headerRowIdx + 1 + table.rows.length;
  const totalRow = ws.getRow(totalRowIdx);
  table.headers.forEach((col, i) => {
    const cell = totalRow.getCell(i + 1);
    if (i === 0) {
      cell.value = "TOTAL";
    } else if (col === "Subtotal" || col === "VAT" || col === "Total") {
      let sum = 0;
      for (const numeric of table.numericRows) {
        const n = numeric[col];
        if (typeof n === "number") sum += n;
      }
      cell.value = sum;
      cell.numFmt = moneyFmt;
    }
    cell.font = { bold: true, color: { argb: "FF065F46" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD1FAE5" }, // emerald-100
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF059669" } },
    };
  });
  totalRow.height = 20;

  // ─── Column widths ─────────────────────────────────────────────
  const widths: Record<AccountingColumn, number> = {
    "Invoice Date": 14,
    "Invoice Number": 18,
    "Supplier Name": 28,
    TRN: 18,
    Description: 36,
    Subtotal: 14,
    "Tax %": 10,
    VAT: 14,
    Total: 14,
    Currency: 10,
    Category: 18,
  };
  table.headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = widths[h] ?? 16;
  });

  // ─── Trigger download ──────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const base = fileName.replace(/\.(csv|xlsx)$/i, "");
  a.download = `${base}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Serialise an AccountingTable to plain CSV (still useful as fallback). */
export function serializeAccountingCsv(table: AccountingTable): string {
  const lines: string[] = [];
  lines.push(
    `Total Invoices,${table.summary.totalInvoices}`
  );
  lines.push(
    `Total Amount,${formatAmount(table.summary.totalAmount)}${
      table.summary.currency ? "," + table.summary.currency : ""
    }`
  );
  lines.push(
    `Total VAT,${formatAmount(table.summary.totalVat)}${
      table.summary.currency ? "," + table.summary.currency : ""
    }`
  );
  lines.push("");
  lines.push(table.headers.map(escapeCell).join(","));
  for (const row of table.rows) {
    lines.push(row.map((c) => escapeCell(c === EMPTY_PLACEHOLDER ? "" : c)).join(","));
  }
  // TOTAL row
  const totals: string[] = table.headers.map((col, i) => {
    if (i === 0) return "TOTAL";
    if (col === "Subtotal" || col === "VAT" || col === "Total") {
      let s = 0;
      for (const n of table.numericRows) {
        const v = n[col];
        if (typeof v === "number") s += v;
      }
      return formatAmount(s);
    }
    return "";
  });
  lines.push(totals.map(escapeCell).join(","));
  return lines.join("\n") + "\n";
}
