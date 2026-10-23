import { apiFetch, apiUrl, handleUnauthorized } from "./api";
import type { ProcessedDocument } from "./types";
import type { CategoryBucket, FinancialTotals, MonthlyBucket, SupportedCurrency } from "./finance";
import { formatShortMonthUtc } from "./dates";

type BackendTotals = {
  currency: SupportedCurrency;
  revenue: number;
  cogs?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  expenses: number;
  netProfit: number;
  grossRevenue: number;
  grossExpenses: number;
  vatCollected: number;
  vatPaid: number;
  vatPayable: number;
  documentCount: number;
};

type BackendMonth = BackendTotals & { month: string };

export type ExcludedDocument = {
  id: string;
  documentId: string;
  fileName: string;
  docTypeCode: string;
  docType: string;
  currency: string;
  total: number;
  reason: string;
  createdAt: string;
};

export type FinancialReport = {
  definition: {
    source: "financialReporting";
    version: number;
    eligibility: "approved_and_reconciled";
  };
  totalsByCurrency: BackendTotals[];
  monthly: BackendMonth[];
  categories: Array<{
    category: string;
    categoryLabel: string;
    group: string;
    groupLabel: string;
    currency: SupportedCurrency;
    netAmount: number;
    grossAmount: number;
    vatAmount: number;
    documentCount: number;
    percentage: number;
  }>;
  documents: ProcessedDocument[];
  excludedDocuments?: ExcludedDocument[];
  excludedCount?: number;
};

export async function fetchFinancialReport(params: URLSearchParams = new URLSearchParams()) {
  const res = await apiFetch(apiUrl(`/api/finance/report?${params}`), { credentials: "include" });
  if (await handleUnauthorized(res)) return null;
  if (!res.ok) throw new Error(`Financial report failed (${res.status})`);
  return (await res.json()) as FinancialReport;
}

export function selectFinancialReport(report: FinancialReport | null, currency: SupportedCurrency) {
  const totalsRow = report?.totalsByCurrency.find((row) => row.currency === currency);
  const revenue = totalsRow?.revenue ?? 0;
  const expenses = totalsRow?.expenses ?? 0;
  const cogs = totalsRow?.cogs ?? 0;
  const grossProfit = totalsRow?.grossProfit ?? (revenue - cogs);
  const operatingExpenses = totalsRow?.operatingExpenses ?? (expenses - cogs);

  const totals: FinancialTotals = {
    currency,
    revenue,
    cogs,
    grossProfit,
    operatingExpenses,
    expenses,
    netProfit: totalsRow?.netProfit ?? (revenue - expenses),
    vatCollected: totalsRow?.vatCollected ?? 0,
    vatPaid: totalsRow?.vatPaid ?? 0,
    vatPayable: totalsRow?.vatPayable ?? 0,
    salesCount: 0,
    expenseCount: 0,
    receiptCount: 0,
    poCount: 0,
  };
  const monthly: MonthlyBucket[] = (report?.monthly ?? [])
    .filter((row) => row.currency === currency)
    .map((row) => {
      const rowRev = row.revenue;
      const rowExp = row.expenses;
      const rowCogs = row.cogs ?? 0;
      return {
        month: row.month,
        monthLabel: formatShortMonthUtc(`${row.month}-01T00:00:00Z`),
        salesAmount: rowRev,
        salesVat: row.vatCollected,
        cogsAmount: rowCogs,
        grossProfit: row.grossProfit ?? (rowRev - rowCogs),
        operatingExpenses: row.operatingExpenses ?? (rowExp - rowCogs),
        expenseAmount: rowExp,
        expenseVat: row.vatPaid,
        netVat: row.vatPayable,
        netProfit: row.netProfit,
      };
    });
  const categories: CategoryBucket[] = (report?.categories ?? [])
    .filter((row) => row.currency === currency)
    .map((row) => ({
      category: row.category as CategoryBucket["category"],
      label: row.categoryLabel,
      group: row.group as CategoryBucket["group"],
      groupLabel: row.groupLabel,
      amount: row.netAmount,
      vat: row.vatAmount,
      count: row.documentCount,
    }));
  return { totals, monthly, categories };
}
