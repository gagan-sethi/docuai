"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Banknote,
  Percent,
  FileText,
  Download,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  PieChart,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl, handleUnauthorized } from "@/lib/api";
import type { ProcessedDocument } from "@/lib/types";
import {
  aggregateTotals,
  buildCategoryBuckets,
  buildMonthlyBuckets,
  deriveFinancialSummary,
  formatCompactMoney,
  formatMoney,
  getDocTypeMeta,
  resolveDocTypeCode,
} from "@/lib/finance";
import { DocTypeBadge } from "@/components/dashboard/DocTypeBadge";
import {
  downloadLedgerCsv,
  downloadPnlCsv,
  downloadPnlXlsx,
  downloadVatSummaryCsv,
  downloadVatSummaryXlsx,
  printVatSummary,
} from "@/lib/financeExport";

// ─── Sparkline ──────────────────────────────────────────────────

function Sparkline({
  values,
  color,
  height = 36,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  Icon,
  tone,
  helper,
  trend,
}: {
  label: string;
  value: string;
  Icon: typeof Wallet;
  tone: "emerald" | "rose" | "indigo" | "amber" | "slate";
  helper?: string;
  trend?: number[];
}) {
  const tones: Record<typeof tone, { iconBg: string; iconFg: string; spark: string }> = {
    emerald: { iconBg: "bg-emerald-100", iconFg: "text-emerald-600", spark: "#10b981" },
    rose: { iconBg: "bg-rose-100", iconFg: "text-rose-600", spark: "#f43f5e" },
    indigo: { iconBg: "bg-indigo-100", iconFg: "text-indigo-600", spark: "#6366f1" },
    amber: { iconBg: "bg-amber-100", iconFg: "text-amber-600", spark: "#f59e0b" },
    slate: { iconBg: "bg-slate-100", iconFg: "text-slate-600", spark: "#64748b" },
  };
  const t = tones[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1 mt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 tabular-nums break-words leading-tight text-nowrap">
            {value}
          </p>
          {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${t.iconBg}`}>
          <Icon className={`w-5 h-5 ${t.iconFg}`} />
        </div>
      </div>
      {trend && trend.length > 0 && <Sparkline values={trend} color={t.spark} />}
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.offsetWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const fetchDocs = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/documents?limit=1000"), { credentials: "include" });
      if (await handleUnauthorized(res)) return;
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDocs();
    const t = setInterval(() => fetchDocs(), 30000);
    return () => clearInterval(t);
  }, []);

  const totals = useMemo(() => aggregateTotals(docs), [docs]);
  const monthly = useMemo(() => buildMonthlyBuckets(docs), [docs]);
  const categories = useMemo(() => buildCategoryBuckets(docs), [docs]);

  const revenueTrend = monthly.map((m) => m.salesAmount);
  const expenseTrend = monthly.map((m) => m.expenseAmount);
  const profitTrend = monthly.map((m) => m.netProfit);
  const vatTrend = monthly.map((m) => m.netVat);

  const recentSales = useMemo(
    () =>
      docs
        .filter((d) => resolveDocTypeCode(d) === "sales_invoice")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [docs]
  );
  const recentExpenses = useMemo(
    () =>
      docs
        .filter((d) => resolveDocTypeCode(d) === "expense_invoice" || resolveDocTypeCode(d) === "receipt")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [docs]
  );
  const pendingPos = useMemo(
    () =>
      docs
        .filter((d) => resolveDocTypeCode(d) === "purchase_order")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [docs]
  );

  const totalProcessed = docs.filter((d) => d.status === "approved" || d.status === "review").length;
  const maxCategory = Math.max(...categories.map((c) => c.amount), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Financial Dashboard" />

        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
              <p className="text-sm text-slate-500 mt-1">
                Automatic P&amp;L and VAT computed from processed invoices &middot; Currency{" "}
                <span className="font-semibold">{totals.currency}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDocs(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/dashboard/finance/vat"
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition"
              >
                <Percent className="w-4 h-4" />
                VAT Report
              </Link>
              <Link
                href="/dashboard/finance/pnl"
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
              >
                <FileText className="w-4 h-4" />
                P&amp;L Report
              </Link>
              <div className="relative">
                <button
                  onClick={() => setExportOpen((p) => !p)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {exportOpen && (
                  <div className="absolute right-0 mt-2 z-30 min-w-[220px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    {[
                      { label: "VAT Summary (Excel)", icon: FileSpreadsheet, run: () => downloadVatSummaryXlsx(docs) },
                      { label: "VAT Summary (CSV)", icon: FileText, run: () => downloadVatSummaryCsv(docs) },
                      { label: "VAT Summary (PDF)", icon: Printer, run: () => printVatSummary(docs) },
                      { label: "P&L (Excel)", icon: FileSpreadsheet, run: () => downloadPnlXlsx(docs) },
                      { label: "P&L (CSV)", icon: FileText, run: () => downloadPnlCsv(docs) },
                      { label: "Accounting Ledger (CSV)", icon: FileText, run: () => downloadLedgerCsv(docs) },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setExportOpen(false);
                          item.run();
                        }}
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <item.icon className="w-4 h-4 text-slate-400" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* TOP — KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard
                  label="Total Revenue"
                  value={formatCompactMoney(totals.revenue, totals.currency)}
                  Icon={TrendingUp}
                  tone="emerald"
                  helper={`${totals.salesCount} sales invoice${totals.salesCount === 1 ? "" : "s"}`}
                  trend={revenueTrend}
                />
                <KpiCard
                  label="Total Expenses"
                  // value={formatMoney(totals.expenses, totals.currency)}
                 value={formatCompactMoney(totals.expenses, totals.currency)}
                  Icon={TrendingDown}
                  tone="rose"
                  helper={`${totals.expenseCount + totals.receiptCount} expense docs`}
                  trend={expenseTrend}
                />
                <KpiCard
                  label="Net Profit"
                  // value={formatMoney(totals.netProfit, totals.currency)}
                  value={formatCompactMoney(totals.netProfit, totals.currency)}
                  Icon={Wallet}
                  tone={totals.netProfit >= 0 ? "emerald" : "rose"}
                  helper="Revenue − Expenses"
                  trend={profitTrend}
                />
                <KpiCard
                  label="VAT Payable"
                  // value={formatMoney(totals.vatPayable, totals.currency)}
                  value={formatCompactMoney(totals.vatPayable, totals.currency)}
                  Icon={Percent}
                  tone="indigo"
                  helper={`Collected − Paid`}
                  trend={vatTrend}
                />
                <KpiCard
                  label="Processed Documents"
                  value={String(totalProcessed)}
                  Icon={FileText}
                  tone="slate"
                  helper={`${totals.poCount} purchase order${totals.poCount === 1 ? "" : "s"} pending`}
                />
              </div>

              {/* VAT mini block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-wider opacity-80">VAT Engine</p>
                    <Banknote className="w-5 h-5 opacity-80" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="opacity-80">VAT Collected (Sales)</span>
                      <span className="font-semibold tabular-nums">{formatMoney(totals.vatCollected, totals.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="opacity-80">VAT Paid (Expenses)</span>
                      <span className="font-semibold tabular-nums">{formatMoney(totals.vatPaid, totals.currency)}</span>
                    </div>
                    <div className="border-t border-white/20 mt-3 pt-3 flex items-center justify-between">
                      <span className="font-medium">Total VAT Payable</span>
                      <span className="text-lg font-bold tabular-nums">{formatMoney(totals.vatPayable, totals.currency)}</span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/finance/vat"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium opacity-90 hover:opacity-100"
                  >
                    View full VAT report <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Expense by category */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-bold text-slate-900">Expenses by Category</h3>
                    </div>
                    <span className="text-xs text-slate-500">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</span>
                  </div>
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate-400 py-6 text-center">No expenses categorized yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {categories.map((c) => (
                        <div key={c.category}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700">{c.label}</span>
                            <span className="tabular-nums text-slate-600">
                              {formatMoney(c.amount, totals.currency)} <span className="text-slate-400">· {c.count}</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${(c.amount / maxCategory) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MIDDLE — Trends row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TrendCard title="Revenue Trend" color="#10b981" months={monthly} accessor={(m) => m.salesAmount} currency={totals.currency} />
                <TrendCard title="Expense Trend" color="#f43f5e" months={monthly} accessor={(m) => m.expenseAmount} currency={totals.currency} />
                <TrendCard title="Net Profit Trend" color="#6366f1" months={monthly} accessor={(m) => m.netProfit} currency={totals.currency} />
                <TrendCard title="VAT Trend" color="#a855f7" months={monthly} accessor={(m) => m.netVat} currency={totals.currency} />
              </div>

              {/* BOTTOM — recent lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <RecentList
                  title="Recent Sales Invoices"
                  icon={TrendingUp}
                  empty="No sales invoices yet."
                  docs={recentSales}
                  currency={totals.currency}
                  tone="emerald"
                />
                <RecentList
                  title="Recent Expense Invoices"
                  icon={Receipt}
                  empty="No expense documents yet."
                  docs={recentExpenses}
                  currency={totals.currency}
                  tone="rose"
                />
                <RecentList
                  title="Pending Purchase Orders"
                  icon={FileText}
                  empty="No open POs."
                  docs={pendingPos}
                  currency={totals.currency}
                  tone="amber"
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Trend Card ─────────────────────────────────────────────────

function TrendCard({
  title,
  color,
  months,
  accessor,
  currency,
}: {
  title: string;
  color: string;
  months: ReturnType<typeof buildMonthlyBuckets>;
  accessor: (m: ReturnType<typeof buildMonthlyBuckets>[number]) => number;
  currency: string;
}) {
  const vals = months.map(accessor);
  const total = vals.reduce((a, b) => a + b, 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <span className="text-xs font-semibold tabular-nums text-slate-700">
          {formatMoney(total, currency)}
        </span>
      </div>
      {months.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">Not enough data.</p>
      ) : (
        <>
          <div className="flex items-end gap-1 h-24">
            {months.map((m) => {
              const v = accessor(m);
              const max = Math.max(...vals.map(Math.abs), 1);
              const h = Math.abs(v) / max;
              return (
                <div
                  key={m.month}
                  className="flex-1 rounded-t-md transition-all"
                  title={`${m.monthLabel}: ${formatMoney(v, currency)}`}
                  style={{
                    height: `${Math.max(h * 100, 2)}%`,
                    background: v < 0 ? "#f43f5e80" : color,
                    opacity: 0.85,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            <span>{months[0].monthLabel}</span>
            <span>{months[months.length - 1].monthLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Recent List ────────────────────────────────────────────────

function RecentList({
  title,
  icon: Icon,
  empty,
  docs,
  currency,
  tone,
}: {
  title: string;
  icon: typeof FileText;
  empty: string;
  docs: ProcessedDocument[];
  currency: string;
  tone: "emerald" | "rose" | "amber";
}) {
  const toneCls = {
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-600",
  }[tone];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${toneCls}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <Link href="/dashboard/documents" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">{empty}</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => {
            const fin = deriveFinancialSummary(d);
            const code = resolveDocTypeCode(d);
            return (
              <Link
                key={d.id}
                href={`/dashboard/review?doc=${d.id}`}
                className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-slate-50 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {fin.counterparty || d.fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {fin.invoiceNumber || d.fileName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold tabular-nums text-slate-900">
                    {formatMoney(fin.grandTotal, fin.currency || currency)}
                  </p>
                  <div className="mt-0.5">
                    <DocTypeBadge code={code} size="xs" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
