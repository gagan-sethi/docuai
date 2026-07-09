import type { ProcessedDocument } from "./types";
import { deriveFinancialSummary } from "./finance";

export type FinancialPeriodValue =
  | "all_time"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface CustomDateRange {
  from: string;
  to: string;
}

export const FINANCIAL_PERIOD_STORAGE_KEY = "docuai.financialPeriod.v2";
export const FINANCIAL_PERIOD_CUSTOM_STORAGE_KEY = "docuai.financialPeriod.custom";

export const FINANCIAL_PERIOD_OPTIONS: Array<{ value: FinancialPeriodValue; label: string }> = [
  { value: "all_time", label: "All Time" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom Date Range" },
];

function atStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function atEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseInputDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return fallback;
  return new Date(year, month - 1, day);
}

export function parseDocumentDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const nativeDate = new Date(raw);
  if (!Number.isNaN(nativeDate.getTime())) return nativeDate;

  const numericDate = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (numericDate) {
    const [, first, second, yearPart] = numericDate;
    const year = Number(yearPart.length === 2 ? `20${yearPart}` : yearPart);
    const a = Number(first);
    const b = Number(second);
    const day = a > 12 ? a : b > 12 ? b : a;
    const month = a > 12 ? b : b > 12 ? a : b;
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const namedDate = raw.match(/^(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{2,4})$/i);
  if (namedDate) {
    const [, dayPart, monthName, yearPart] = namedDate;
    const month = new Date(`${monthName} 1, 2000`).getMonth();
    const year = Number(yearPart.length === 2 ? `20${yearPart}` : yearPart);
    const parsed = new Date(year, month, Number(dayPart));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function dateToInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calculateFinancialPeriod(
  value: FinancialPeriodValue,
  custom?: CustomDateRange,
  now = new Date()
): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarterStart = Math.floor(month / 3) * 3;

  if (value === "last_month") {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { from: atStartOfDay(start), to: atEndOfDay(end) };
  }

  if (value === "this_quarter") {
    const start = new Date(year, quarterStart, 1);
    const end = new Date(year, quarterStart + 3, 0);
    return { from: atStartOfDay(start), to: atEndOfDay(end) };
  }

  if (value === "last_quarter") {
    const start = new Date(year, quarterStart - 3, 1);
    const end = new Date(year, quarterStart, 0);
    return { from: atStartOfDay(start), to: atEndOfDay(end) };
  }

  if (value === "this_year") {
    return {
      from: atStartOfDay(new Date(year, 0, 1)),
      to: atEndOfDay(new Date(year, 11, 31)),
    };
  }

  if (value === "last_year") {
    return {
      from: atStartOfDay(new Date(year - 1, 0, 1)),
      to: atEndOfDay(new Date(year - 1, 11, 31)),
    };
  }

  if (value === "custom") {
    const from = parseInputDate(custom?.from, new Date(year, month, 1));
    const to = parseInputDate(custom?.to, now);
    return { from: atStartOfDay(from), to: atEndOfDay(to) };
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { from: atStartOfDay(start), to: atEndOfDay(end) };
}

export function getDocumentFinancialDate(doc: ProcessedDocument): Date {
  const fin = deriveFinancialSummary(doc);
  return (
    parseDocumentDateValue(fin.invoiceDate) ??
    parseDocumentDateValue(doc.batchUploadedAt) ??
    parseDocumentDateValue(doc.createdAt) ??
    new Date()
  );
}

export function getDocumentUploadDate(doc: ProcessedDocument): Date {
  return (
    parseDocumentDateValue(doc.batchUploadedAt) ??
    parseDocumentDateValue(doc.createdAt) ??
    new Date()
  );
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const t = date.getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}

export function filterDocumentsByFinancialPeriod(
  docs: ProcessedDocument[],
  value: FinancialPeriodValue,
  custom?: CustomDateRange
): ProcessedDocument[] {
  if (value === "all_time") return docs;
  const range = calculateFinancialPeriod(value, custom);
  return docs.filter((doc) => isDateInRange(getDocumentFinancialDate(doc), range));
}

export function filterDocumentsByDateRange(
  docs: ProcessedDocument[],
  range: DateRange,
  mode: "financial" | "upload" = "financial"
): ProcessedDocument[] {
  return docs.filter((doc) =>
    isDateInRange(mode === "upload" ? getDocumentUploadDate(doc) : getDocumentFinancialDate(doc), range)
  );
}

export function formatDateRangeLabel(range: DateRange): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(range.from)} - ${fmt.format(range.to)}`;
}

export function periodLabel(value: FinancialPeriodValue, custom?: CustomDateRange): string {
  if (value === "all_time") return "All Time";
  if (value !== "custom") {
    return FINANCIAL_PERIOD_OPTIONS.find((opt) => opt.value === value)?.label ?? "This Month";
  }
  return `Custom: ${formatDateRangeLabel(calculateFinancialPeriod(value, custom))}`;
}
