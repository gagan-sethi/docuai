"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl, handleUnauthorized } from "@/lib/api";
import type { ProcessedDocument } from "@/lib/types";
import {
  aggregateTotals,
  buildCategoryBuckets,
  buildMonthlyBuckets,
  filterDocumentsByCurrency,
  formatMoney,
  getDocumentCurrencies,
  type SupportedCurrency,
} from "@/lib/finance";
import { downloadPnlCsv, downloadPnlXlsx } from "@/lib/financeExport";

export default function PnlReportPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("AED");

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.offsetWidth));
    observer.observe(sidebar);
    const frame = requestAnimationFrame(() => setSidebarWidth(sidebar.offsetWidth));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/documents?limit=1000"), { credentials: "include" });
        if (await handleUnauthorized(res)) return;
        if (res.ok) {
          const data = await res.json();
          setDocs(data.documents || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const currencies = useMemo(() => getDocumentCurrencies(docs), [docs]);
  const effectiveCurrency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : currencies[0] || "AED";
  const currencyDocs = useMemo(
    () => filterDocumentsByCurrency(docs, effectiveCurrency),
    [docs, effectiveCurrency],
  );
  const totals = useMemo(() => aggregateTotals(currencyDocs), [currencyDocs]);
  const monthly = useMemo(() => buildMonthlyBuckets(currencyDocs), [currencyDocs]);
  const categories = useMemo(() => buildCategoryBuckets(currencyDocs), [currencyDocs]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Profit & Loss" />

        <main className="flex-1 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/finance"
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Profit &amp; Loss Statement</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Revenue, expenses and net profit by month &middot; Currency{" "}
                  <span className="font-semibold">{totals.currency}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currencies.length > 0 && (
                <select
                  aria-label="Reporting currency"
                  value={effectiveCurrency}
                  onChange={(event) => setSelectedCurrency(event.target.value as SupportedCurrency)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  {currencies.map((currency) => <option key={currency}>{currency}</option>)}
                </select>
              )}
              <button
                onClick={() => downloadPnlXlsx(currencyDocs)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => downloadPnlCsv(currencyDocs)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard
                  label="Total Revenue"
                  value={formatMoney(totals.revenue, totals.currency)}
                  Icon={TrendingUp}
                  tone="emerald"
                />
                <SummaryCard
                  label="Total Expenses"
                  value={formatMoney(totals.expenses, totals.currency)}
                  Icon={TrendingDown}
                  tone="rose"
                />
                <SummaryCard
                  label="Net Profit"
                  value={formatMoney(totals.netProfit, totals.currency)}
                  Icon={Wallet}
                  tone={totals.netProfit >= 0 ? "emerald" : "rose"}
                  highlight
                />
              </div>

              {/* Monthly table */}
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <header className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-sm font-bold text-slate-900">Monthly Breakdown</h2>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Month</Th>
                        <Th align="right">Revenue</Th>
                        <Th align="right">Expenses</Th>
                        <Th align="right">Net Profit</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {monthly.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-xs text-slate-400 py-6">
                            No financial data yet.
                          </td>
                        </tr>
                      ) : (
                        monthly.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-50/60">
                            <Td>{m.monthLabel}</Td>
                            <Td align="right" mono>{formatMoney(m.salesAmount, totals.currency)}</Td>
                            <Td align="right" mono>{formatMoney(m.expenseAmount, totals.currency)}</Td>
                            <Td
                              align="right"
                              mono
                              className={m.netProfit >= 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}
                            >
                              {formatMoney(m.netProfit, totals.currency)}
                            </Td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-slate-100 font-bold">
                        <Td>Total</Td>
                        <Td align="right" mono>{formatMoney(totals.revenue, totals.currency)}</Td>
                        <Td align="right" mono>{formatMoney(totals.expenses, totals.currency)}</Td>
                        <Td
                          align="right"
                          mono
                          className={totals.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}
                        >
                          {formatMoney(totals.netProfit, totals.currency)}
                        </Td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* By category */}
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <header className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-sm font-bold text-slate-900">Expenses by Category</h2>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Group</Th>
                        <Th>Category</Th>
                        <Th align="right">Amount</Th>
                        <Th align="right">VAT</Th>
                        <Th align="right">Documents</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-xs text-slate-400 py-6">
                            No expenses categorized yet.
                          </td>
                        </tr>
                      ) : (
                        categories.map((c) => (
                          <tr key={c.category} className="hover:bg-slate-50/60">
                            <Td>{c.groupLabel}</Td>
                            <Td>{c.label}</Td>
                            <Td align="right" mono>{formatMoney(c.amount, totals.currency)}</Td>
                            <Td align="right" mono>{formatMoney(c.vat, totals.currency)}</Td>
                            <Td align="right" mono>{c.count}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  Icon,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  Icon: typeof Wallet;
  tone: "emerald" | "rose";
  highlight?: boolean;
}) {
  const cls = tone === "emerald" ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600";
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ${
        highlight
          ? `bg-gradient-to-br ${cls} text-white`
          : "bg-white border border-slate-100"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wide font-medium ${highlight ? "opacity-80" : "text-slate-500"}`}>
          {label}
        </p>
        <Icon className={`w-5 h-5 ${highlight ? "opacity-90" : tone === "emerald" ? "text-emerald-500" : "text-rose-500"}`} />
      </div>
      <p className={`text-2xl font-bold tabular-nums ${highlight ? "" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  mono,
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-2.5 text-sm text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      } ${mono ? "tabular-nums" : ""} ${className ?? ""}`}
    >
      {children}
    </td>
  );
}
