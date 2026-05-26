"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  Percent,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl, handleUnauthorized } from "@/lib/api";
import type { ProcessedDocument } from "@/lib/types";
import {
  aggregateTotals,
  buildMonthlyBuckets,
  formatMoney,
} from "@/lib/finance";
import {
  downloadVatSummaryCsv,
  downloadVatSummaryXlsx,
  printVatSummary,
} from "@/lib/financeExport";

export default function VatReportPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.offsetWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.offsetWidth);
    return () => observer.disconnect();
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

  const totals = useMemo(() => aggregateTotals(docs), [docs]);
  const monthly = useMemo(() => buildMonthlyBuckets(docs), [docs]);

  const incomeMonths = monthly.filter((m) => m.salesAmount || m.salesVat);
  const expenseMonths = monthly.filter((m) => m.expenseAmount || m.expenseVat);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="VAT Summary Report" />

        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/finance"
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
                title="Back to financial dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">VAT Summary Report</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Auto-generated from processed sales &amp; expense invoices &middot; Currency{" "}
                  <span className="font-semibold">{totals.currency}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadVatSummaryXlsx(docs)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => downloadVatSummaryCsv(docs)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => printVatSummary(docs)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <Printer className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* VAT INCOME */}
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <header className="px-5 py-3 border-b border-slate-100 bg-emerald-50/40 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-emerald-800">VAT Income</h2>
                    <p className="text-[11px] text-emerald-700/70">Sales invoices issued to customers</p>
                  </div>
                  <Percent className="w-4 h-4 text-emerald-600" />
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Month</Th>
                        <Th align="right">Sales Total</Th>
                        <Th align="right">VAT Collected</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {incomeMonths.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-xs text-slate-400 py-6">
                            No sales invoices processed yet.
                          </td>
                        </tr>
                      ) : (
                        incomeMonths.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-50/60">
                            <Td>{m.monthLabel}</Td>
                            <Td align="right" mono>{formatMoney(m.salesAmount, totals.currency)}</Td>
                            <Td align="right" mono>{formatMoney(m.salesVat, totals.currency)}</Td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-emerald-50/60 font-bold">
                        <Td>Total</Td>
                        <Td align="right" mono>{formatMoney(totals.revenue, totals.currency)}</Td>
                        <Td align="right" mono>{formatMoney(totals.vatCollected, totals.currency)}</Td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* VAT EXPENSES */}
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <header className="px-5 py-3 border-b border-slate-100 bg-rose-50/40 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-rose-800">VAT Expenses</h2>
                    <p className="text-[11px] text-rose-700/70">Expense invoices &amp; receipts paid to suppliers</p>
                  </div>
                  <Percent className="w-4 h-4 text-rose-600" />
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Month</Th>
                        <Th align="right">Expense Total</Th>
                        <Th align="right">VAT Paid</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {expenseMonths.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-xs text-slate-400 py-6">
                            No expense invoices processed yet.
                          </td>
                        </tr>
                      ) : (
                        expenseMonths.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-50/60">
                            <Td>{m.monthLabel}</Td>
                            <Td align="right" mono>{formatMoney(m.expenseAmount, totals.currency)}</Td>
                            <Td align="right" mono>{formatMoney(m.expenseVat, totals.currency)}</Td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-rose-50/60 font-bold">
                        <Td>Total</Td>
                        <Td align="right" mono>{formatMoney(totals.expenses, totals.currency)}</Td>
                        <Td align="right" mono>{formatMoney(totals.vatPaid, totals.currency)}</Td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* FINAL VAT */}
              <section
                className={`rounded-2xl shadow-md overflow-hidden text-white ${
                  totals.vatPayable >= 0
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                    : "bg-gradient-to-r from-rose-600 to-red-700"
                }`}
              >
                <div className="p-6">
                  <p className="text-xs uppercase tracking-wider opacity-80 mb-3">Final VAT Calculation</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <p className="text-xs opacity-80">VAT Collected</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatMoney(totals.vatCollected, totals.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs opacity-80">VAT Paid</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatMoney(totals.vatPaid, totals.currency)}
                      </p>
                    </div>
                    <div className="md:text-right border-t md:border-t-0 md:border-l border-white/30 md:pl-4 pt-3 md:pt-0">
                      <p className="text-xs opacity-80">
                        {totals.vatPayable >= 0 ? "Total VAT Payable" : "VAT Refundable"}
                      </p>
                      <p className="text-3xl font-extrabold tabular-nums">
                        {formatMoney(Math.abs(totals.vatPayable), totals.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
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
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2.5 text-sm text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      } ${mono ? "tabular-nums" : ""}`}
    >
      {children}
    </td>
  );
}
