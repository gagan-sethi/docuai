/**
 * Short date formatting.
 *
 * `toLocaleDateString("en-GB", { month: "short" })` abbreviates September as
 * "Sept" — four letters where every other month gets three — which read as a
 * typo across the finance screens ("01 Sept 2026"). These helpers build the
 * parts explicitly so the abbreviation is always three letters.
 */

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "01 Sep 2026" */
export function formatShortDate(value: Date | string | number, fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${MONTH_ABBREVIATIONS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "01 Sep" */
export function formatDayMonth(value: Date | string | number, fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${MONTH_ABBREVIATIONS[date.getMonth()]}`;
}

/** "Sep 2026" */
export function formatShortMonth(value: Date | string | number, fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${MONTH_ABBREVIATIONS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Sep 2026", read in UTC — for month buckets keyed as "YYYY-MM". */
export function formatShortMonthUtc(value: Date | string | number, fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${MONTH_ABBREVIATIONS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
