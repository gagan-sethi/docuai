import type { ProcessedDocument } from "./types";
import { deriveFinancialSummary } from "./finance";

export type FinancialPeriodValue =
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

export const FINANCIAL_PERIOD_STORAGE_KEY = "docuai.financialPeriod";
export const FINANCIAL_PERIOD_CUSTOM_STORAGE_KEY = "docuai.financialPeriod.custom";

export const FINANCIAL_PERIOD_OPTIONS: Array<{ value: FinancialPeriodValue; label: string }> = [
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
  const raw = fin.invoiceDate || doc.batchUploadedAt || doc.createdAt;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date(doc.createdAt) : date;
}

export function getDocumentUploadDate(doc: ProcessedDocument): Date {
  const date = new Date(doc.batchUploadedAt || doc.createdAt);
  return Number.isNaN(date.getTime()) ? new Date(doc.createdAt) : date;
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
  if (value !== "custom") {
    return FINANCIAL_PERIOD_OPTIONS.find((opt) => opt.value === value)?.label ?? "This Month";
  }
  return `Custom: ${formatDateRangeLabel(calculateFinancialPeriod(value, custom))}`;
}
