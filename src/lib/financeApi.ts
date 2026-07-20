import { apiFetch, apiUrl, handleUnauthorized } from "./api";
import type { ProcessedDocument } from "./types";
import type { CategoryBucket, FinancialTotals, MonthlyBucket, SupportedCurrency } from "./finance";

type BackendTotals = {
  currency: SupportedCurrency;
  revenue: number;
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
};

export async function fetchFinancialReport(params: URLSearchParams = new URLSearchParams()) {
  const res = await apiFetch(apiUrl(`/api/finance/report?${params}`), { credentials: "include" });
  if (await handleUnauthorized(res)) return null;
  if (!res.ok) throw new Error(`Financial report failed (${res.status})`);
  return (await res.json()) as FinancialReport;
}

export function selectFinancialReport(report: FinancialReport | null, currency: SupportedCurrency) {
  const totalsRow = report?.totalsByCurrency.find((row) => row.currency === currency);
  const totals: FinancialTotals = {
    currency,
    revenue: totalsRow?.revenue ?? 0,
    expenses: totalsRow?.expenses ?? 0,
    netProfit: totalsRow?.netProfit ?? 0,
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
    .map((row) => ({
      month: row.month,
      monthLabel: new Date(`${row.month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }),
      salesAmount: row.revenue,
      salesVat: row.vatCollected,
      expenseAmount: row.expenses,
      expenseVat: row.vatPaid,
      netVat: row.vatPayable,
      netProfit: row.netProfit,
    }));
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
