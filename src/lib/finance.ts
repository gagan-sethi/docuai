import type {
  DocType,
  ExpenseCategory,
  ExtractedField,
  FinancialSummary,
  ProcessedDocument,
} from "./types";

// ─── Doc-type metadata ──────────────────────────────────────────

export const DOC_TYPE_OPTIONS: Array<{
  value: DocType;
  label: string;
  short: string;
  emoji: string;
  /** Tailwind classes for badges/pills. */
  badge: string;
  dot: string;
  /** Affects revenue/expenses/VAT? */
  affectsFinancials: boolean;
}> = [
  {
    value: "sales_invoice",
    label: "Sales Invoice",
    short: "Sales",
    emoji: "🟢",
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    affectsFinancials: true,
  },
  {
    value: "expense_invoice",
    label: "Expense Invoice",
    short: "Expense",
    emoji: "🔴",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    affectsFinancials: true,
  },
  {
    value: "purchase_order",
    label: "Purchase Order",
    short: "PO",
    emoji: "🟡",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    affectsFinancials: false,
  },
  {
    value: "receipt",
    label: "Receipt",
    short: "Receipt",
    emoji: "🔵",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    affectsFinancials: true,
  },
  {
    value: "unknown",
    label: "Unclassified",
    short: "Unknown",
    emoji: "⚪",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    affectsFinancials: false,
  },
];

export function getDocTypeMeta(code: DocType | undefined) {
  return (
    DOC_TYPE_OPTIONS.find((o) => o.value === code) ??
    DOC_TYPE_OPTIONS[DOC_TYPE_OPTIONS.length - 1]
  );
}

// ─── Expense category metadata ──────────────────────────────────

export const EXPENSE_CATEGORY_OPTIONS: Array<{
  value: ExpenseCategory;
  label: string;
}> = [
  { value: "logistics", label: "Logistics" },
  { value: "marketing", label: "Marketing" },
  { value: "printing", label: "Printing" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "transport", label: "Transport" },
  { value: "raw_materials", label: "Raw Materials" },
  { value: "other", label: "Other" },
];

export function getCategoryLabel(c: ExpenseCategory | undefined): string {
  return EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? "—";
}

// ─── Legacy-label normaliser ────────────────────────────────────

const LEGACY_TYPE_PATTERNS: Array<{ rx: RegExp; code: DocType }> = [
  { rx: /sales|tax invoice|invoice to customer/i, code: "sales_invoice" },
  { rx: /expense|vendor invoice|supplier invoice|bill/i, code: "expense_invoice" },
  { rx: /purchase order|^po\b/i, code: "purchase_order" },
  { rx: /receipt/i, code: "receipt" },
];

/**
 * Best-effort mapping from the old free-text docType string to the new
 * canonical code. Used only when backend has not yet populated docTypeCode.
 */
export function resolveDocTypeCode(doc: Pick<ProcessedDocument, "docType" | "docTypeCode">): DocType {
  if (doc.docTypeCode) return doc.docTypeCode;
  const t = doc.docType ?? "";
  for (const { rx, code } of LEGACY_TYPE_PATTERNS) {
    if (rx.test(t)) return code;
  }
  return "unknown";
}

// ─── Number / currency parsing ──────────────────────────────────

/**
 * Parse a string that may contain currency symbols, thousands separators,
 * and trailing percent signs into a finite number. Returns 0 on failure.
 */
export function parseAmount(value: string | number | undefined | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[^0-9.,\-]/g, "")
    .replace(/(\d),(?=\d{3}(\D|$))/g, "$1") // strip thousand separators
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const FIELD_ALIASES: Record<keyof FinancialSummary | "vatPercent", RegExp[]> = {
  currency: [/currency/i],
  subtotal: [/sub\s*total|net\s*amount|amount\s*before|excluding\s*vat|net\s*total/i],
  vatRate: [/vat\s*%|vat\s*rate|tax\s*rate/i],
  vatPercent: [/vat\s*%|vat\s*rate|tax\s*rate/i],
  vatAmount: [/vat\s*amount|tax\s*amount|^vat$/i],
  grandTotal: [/grand\s*total|total\s*amount|total\s*due|invoice\s*total|amount\s*payable|^total$/i],
  invoiceDate: [/invoice\s*date|date\s*of\s*issue|^date$/i],
  trn: [/\btrn\b|vat\s*number|tax\s*reg|tax\s*id|gstin/i],
  counterparty: [/supplier|vendor|seller|customer|buyer|client|bill\s*to|sold\s*to/i],
  invoiceNumber: [/invoice\s*(no|number|#)|inv\s*no|inv\s*#/i],
};

function findField(fields: ExtractedField[], aliases: RegExp[]): string | undefined {
  for (const rx of aliases) {
    const hit = fields.find((f) => rx.test(f.label));
    if (hit?.value) return hit.value;
  }
  return undefined;
}

/**
 * Build a FinancialSummary from a document's extracted fields when the
 * backend hasn't supplied one. Best-effort — values default to 0 / undefined.
 */
export function deriveFinancialSummary(doc: ProcessedDocument): FinancialSummary {
  if (doc.financial) return doc.financial;
  const fields = doc.fields ?? [];

  const subtotal = parseAmount(findField(fields, FIELD_ALIASES.subtotal));
  const vatAmount = parseAmount(findField(fields, FIELD_ALIASES.vatAmount));
  const grandTotal = parseAmount(findField(fields, FIELD_ALIASES.grandTotal));
  const vatRateRaw = findField(fields, FIELD_ALIASES.vatRate);
  let vatRate = parseAmount(vatRateRaw);
  if (vatRate === 0 && subtotal > 0 && vatAmount > 0) {
    vatRate = Math.round((vatAmount / subtotal) * 10000) / 100; // 2dp
  }

  return {
    currency: (findField(fields, FIELD_ALIASES.currency) || "AED").toUpperCase().slice(0, 3),
    subtotal,
    vatRate,
    vatAmount,
    grandTotal: grandTotal || subtotal + vatAmount,
    invoiceDate: findField(fields, FIELD_ALIASES.invoiceDate),
    trn: findField(fields, FIELD_ALIASES.trn),
    counterparty: findField(fields, FIELD_ALIASES.counterparty),
    invoiceNumber: findField(fields, FIELD_ALIASES.invoiceNumber),
  };
}

// ─── Aggregation ────────────────────────────────────────────────

export interface FinancialTotals {
  revenue: number;
  expenses: number;
  netProfit: number;
  vatCollected: number;
  vatPaid: number;
  vatPayable: number;
  salesCount: number;
  expenseCount: number;
  poCount: number;
  receiptCount: number;
  currency: string; // first non-empty currency we saw
}

/** Documents that should be counted at all (approved or reviewed). */
export function isFinanciallyCounted(doc: ProcessedDocument): boolean {
  return doc.status === "approved" || doc.status === "review";
}

export function aggregateTotals(docs: ProcessedDocument[]): FinancialTotals {
  const totals: FinancialTotals = {
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    vatCollected: 0,
    vatPaid: 0,
    vatPayable: 0,
    salesCount: 0,
    expenseCount: 0,
    poCount: 0,
    receiptCount: 0,
    currency: "",
  };

  for (const d of docs) {
    const code = resolveDocTypeCode(d);
    if (code === "purchase_order") {
      totals.poCount += 1;
      continue;
    }
    if (!isFinanciallyCounted(d)) continue;

    const fin = deriveFinancialSummary(d);
    if (!totals.currency && fin.currency) totals.currency = fin.currency;

    if (code === "sales_invoice") {
      totals.revenue += fin.subtotal || fin.grandTotal - fin.vatAmount;
      totals.vatCollected += fin.vatAmount;
      totals.salesCount += 1;
    } else if (code === "expense_invoice") {
      totals.expenses += fin.subtotal || fin.grandTotal - fin.vatAmount;
      totals.vatPaid += fin.vatAmount;
      totals.expenseCount += 1;
    } else if (code === "receipt") {
      // Receipts are operational expenses, no VAT separation by default
      totals.expenses += fin.grandTotal || fin.subtotal;
      totals.vatPaid += fin.vatAmount;
      totals.receiptCount += 1;
    }
  }

  totals.netProfit = totals.revenue - totals.expenses;
  totals.vatPayable = totals.vatCollected - totals.vatPaid;
  if (!totals.currency) totals.currency = "AED";
  return totals;
}

// ─── Monthly buckets (for VAT summary report) ───────────────────

export interface MonthlyBucket {
  month: string;             // "YYYY-MM"
  monthLabel: string;        // "Jan 2026"
  salesAmount: number;
  salesVat: number;
  expenseAmount: number;
  expenseVat: number;
  netVat: number;
  netProfit: number;
}

function monthKey(iso?: string): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  if (key === "unknown") return "Undated";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-GB", { month: "short", year: "numeric" });
}

export function buildMonthlyBuckets(docs: ProcessedDocument[]): MonthlyBucket[] {
  const map = new Map<string, MonthlyBucket>();
  for (const d of docs) {
    const code = resolveDocTypeCode(d);
    if (code === "purchase_order" || code === "unknown") continue;
    if (!isFinanciallyCounted(d)) continue;

    const fin = deriveFinancialSummary(d);
    const key = monthKey(fin.invoiceDate || d.createdAt);
    if (!map.has(key)) {
      map.set(key, {
        month: key,
        monthLabel: monthLabel(key),
        salesAmount: 0,
        salesVat: 0,
        expenseAmount: 0,
        expenseVat: 0,
        netVat: 0,
        netProfit: 0,
      });
    }
    const bucket = map.get(key)!;
    if (code === "sales_invoice") {
      bucket.salesAmount += fin.subtotal || fin.grandTotal - fin.vatAmount;
      bucket.salesVat += fin.vatAmount;
    } else {
      bucket.expenseAmount += fin.subtotal || fin.grandTotal - fin.vatAmount;
      bucket.expenseVat += fin.vatAmount;
    }
    bucket.netVat = bucket.salesVat - bucket.expenseVat;
    bucket.netProfit = bucket.salesAmount - bucket.expenseAmount;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.month === "unknown" ? 1 : b.month === "unknown" ? -1 : a.month.localeCompare(b.month)
  );
}

// ─── Expense-by-category breakdown ──────────────────────────────

export interface CategoryBucket {
  category: ExpenseCategory;
  label: string;
  amount: number;
  vat: number;
  count: number;
}

export function buildCategoryBuckets(docs: ProcessedDocument[]): CategoryBucket[] {
  const map = new Map<ExpenseCategory, CategoryBucket>();
  for (const d of docs) {
    const code = resolveDocTypeCode(d);
    if (code !== "expense_invoice" && code !== "receipt") continue;
    if (!isFinanciallyCounted(d)) continue;

    const fin = deriveFinancialSummary(d);
    const cat: ExpenseCategory = d.expenseCategory ?? "other";
    if (!map.has(cat)) {
      map.set(cat, {
        category: cat,
        label: getCategoryLabel(cat),
        amount: 0,
        vat: 0,
        count: 0,
      });
    }
    const b = map.get(cat)!;
    b.amount += fin.subtotal || fin.grandTotal - fin.vatAmount;
    b.vat += fin.vatAmount;
    b.count += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

// ─── Formatting ────────────────────────────────────────────────

export function formatMoney(value: number, currency = "AED"): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(value);
}
