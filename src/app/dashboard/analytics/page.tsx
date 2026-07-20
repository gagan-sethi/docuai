"use client";

/**
 * Analytics dashboard.
 *
 * All metrics now come from the backend (GET /api/documents/analytics,
 * powered by lib/analytics.ts::computeAnalytics). This file only
 * fetches and renders — it does not compute anything itself.
 * Visuals are unchanged: pure inline SVG, no chart library.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  RefreshCw,
  Loader2,
  Sparkles,
  Download,
  Sigma,
  PieChart,
  Layers,
  ArrowUpRight,
  Receipt,
  Landmark,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiFetch, apiUrl, handleUnauthorized } from "@/lib/api";
import { formatMoney } from "@/lib/finance";

const STATUS_COLORS: Record<string, { fg: string; bg: string; ring: string }> = {
  approved: { fg: "text-emerald-600", bg: "bg-emerald-500", ring: "ring-emerald-500/20" },
  completed: { fg: "text-emerald-600", bg: "bg-emerald-500", ring: "ring-emerald-500/20" },
  review: { fg: "text-amber-600", bg: "bg-amber-500", ring: "ring-amber-500/20" },
  processing: { fg: "text-sky-600", bg: "bg-sky-500", ring: "ring-sky-500/20" },
  structuring: { fg: "text-violet-600", bg: "bg-violet-500", ring: "ring-violet-500/20" },
  uploaded: { fg: "text-slate-600", bg: "bg-slate-400", ring: "ring-slate-400/20" },
  rejected: { fg: "text-red-600", bg: "bg-red-500", ring: "ring-red-500/20" },
  failed: { fg: "text-red-600", bg: "bg-red-500", ring: "ring-red-500/20" },
  error: { fg: "text-red-600", bg: "bg-red-500", ring: "ring-red-500/20" },
};

function statusColor(s: string) {
  return STATUS_COLORS[s] ?? STATUS_COLORS.uploaded;
}

function fmtNumber(n: number): string {
  return n.toLocaleString();
}

function fmtMoney(n: number, currency = "AED"): string {
  return formatMoney(n, currency);
}

// Pure display formatting only (turns "2026-01" into "Jan 2026").
// Not a calculation, so it's fine to keep on the client.
function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

// ─── Types (mirror backend AnalyticsResult — move to a shared
// types package if you have one, so this can't drift) ────────────

interface AnalyticsKpis {
  total: number;
  approved: number;
  review: number;
  failed: number;
  avgConf: number;
  approvalRate: number;
  totalAmount: number;
  amountCount: number;
  totalVat: number;
  vatCount: number;
}

interface AnalyticsResult {
  primaryCurrency: string;
  range: { from: string | null; to: string | null };
  kpis: AnalyticsKpis;
  statusBreakdown: { status: string; count: number }[];
  daily: { date: string; count: number }[];
  dailyMax: number;
  monthlyVat: { month: string; total: number; count: number }[];
  monthlyVatMax: number;
  topSuppliers: { name: string; count: number; amount: number }[];
  typeMix: { name: string; count: number }[];
  sourceMix: { upload: number; whatsapp: number };
  confidenceBuckets: { label: string; min: number; max: number; count: number }[];
}

// ─── Page ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await apiFetch(apiUrl(`/api/documents/analytics?${params.toString()}`), {
        credentials: "include",
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnalytics(data?.analytics ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="ml-[260px] p-6">
        <TopBar title="Analytics" />

        {/* ─── Header ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20">
                  <BarChart3 className="w-5 h-5" />
                </span>
                Analytics
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {fromDate || toDate ? `${fromDate || "Any"} → ${toDate || "Any"}` : "All documents"}{" "}
                · live data from your processed documents
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <label className="text-[11px] font-medium text-slate-500 mb-1">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-medium text-slate-500 mb-1">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-60 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Try again
              </button>
            </div>
          ) : !analytics || analytics.kpis.total === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ─── KPI cards ───────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <KpiCard
                  label="Total Documents"
                  value={fmtNumber(analytics.kpis.total)}
                  icon={<FileText className="w-4 h-4" />}
                  tone="primary"
                  hint={`${fmtNumber(analytics.kpis.approved)} approved`}
                />
                <KpiCard
                  label="Approval Rate"
                  value={`${analytics.kpis.approvalRate.toFixed(0)}%`}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  tone="success"
                  hint={
                    analytics.kpis.review > 0
                      ? `${fmtNumber(analytics.kpis.review)} need review`
                      : "All caught up"
                  }
                  trend={analytics.kpis.approvalRate >= 80 ? "up" : "down"}
                />
                <KpiCard
                  label="Avg. Confidence"
                  value={`${analytics.kpis.avgConf.toFixed(0)}%`}
                  icon={<Sparkles className="w-4 h-4" />}
                  tone={
                    analytics.kpis.avgConf >= 90
                      ? "success"
                      : analytics.kpis.avgConf >= 75
                        ? "warn"
                        : "danger"
                  }
                  hint="OCR + AI extraction"
                />
                <KpiCard
                  label="Total Invoiced"
                  value={
                    analytics.kpis.amountCount > 0
                      ? fmtMoney(analytics.kpis.totalAmount, analytics.primaryCurrency)
                      : "—"
                  }
                  icon={<Sigma className="w-4 h-4" />}
                  tone="indigo"
                  hint={
                    analytics.kpis.amountCount > 0
                      ? `from ${fmtNumber(analytics.kpis.amountCount)} invoice${analytics.kpis.amountCount === 1 ? "" : "s"}`
                      : "no totals extracted"
                  }
                />
                <KpiCard
                  label="Total VAT"
                  value={
                    analytics.kpis.vatCount > 0
                      ? fmtMoney(analytics.kpis.totalVat, analytics.primaryCurrency)
                      : "—"
                  }
                  icon={<Receipt className="w-4 h-4" />}
                  tone="emerald"
                  hint={
                    analytics.kpis.vatCount > 0
                      ? `from ${fmtNumber(analytics.kpis.vatCount)} invoice${analytics.kpis.vatCount === 1 ? "" : "s"}`
                      : "no VAT extracted"
                  }
                />
              </div>

              {/* ─── Daily volume + Status ───────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <Card className="lg:col-span-2" title="Daily Volume" icon={<Calendar className="w-4 h-4" />}>
                  <DailyVolumeChart data={analytics.daily} max={analytics.dailyMax} />
                </Card>
                <Card title="Status Breakdown" icon={<PieChart className="w-4 h-4" />}>
                  <StatusDonut entries={analytics.statusBreakdown} total={analytics.kpis.total} />
                </Card>
              </div>

              {/* ─── VAT by month ────────────────────────────── */}
              <div className="mb-6">
                <Card title="VAT Totals By Month" icon={<Landmark className="w-4 h-4" />}>
                  <MonthlyVatChart
                    data={analytics.monthlyVat}
                    max={analytics.monthlyVatMax}
                    currency={analytics.primaryCurrency}
                  />
                </Card>
              </div>

              {/* ─── Suppliers + Doc types ───────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <Card title="Top Suppliers" icon={<Building2 className="w-4 h-4" />}>
                  <SupplierList items={analytics.topSuppliers} currency={analytics.primaryCurrency} />
                </Card>
                <Card title="Document Types" icon={<Layers className="w-4 h-4" />}>
                  <TypeBars items={analytics.typeMix} total={analytics.kpis.total} />
                </Card>
              </div>

              {/* ─── Confidence + Source ─────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <Card
                  className="lg:col-span-2"
                  title="Confidence Distribution"
                  icon={<TrendingUp className="w-4 h-4" />}
                >
                  <ConfidenceHistogram buckets={analytics.confidenceBuckets} />
                </Card>
                <Card title="Source" icon={<Download className="w-4 h-4" />}>
                  <SourceMix upload={analytics.sourceMix.upload} whatsapp={analytics.sourceMix.whatsapp} />
                </Card>
              </div>

              {/* ─── Quick links ─────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QuickLink
                  href="/dashboard/review"
                  title="Review queue"
                  desc={`${fmtNumber(analytics.kpis.review)} pending`}
                />
                <QuickLink
                  href="/dashboard/documents"
                  title="All documents"
                  desc={`${fmtNumber(analytics.kpis.total)} processed`}
                />
                <QuickLink href="/dashboard/upload" title="Upload more" desc="Add new files" />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Pieces (unchanged — pure rendering, no calculation) ───────

function Card({
  children,
  title,
  icon,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warn" | "danger" | "indigo" | "emerald";
  trend?: "up" | "down";
}) {
  const toneCls = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-emerald-100 to-emerald-50 text-emerald-600",
    warn: "from-amber-100 to-amber-50 text-amber-600",
    danger: "from-red-100 to-red-50 text-red-600",
    indigo: "from-indigo-100 to-indigo-50 text-indigo-600",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-600",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5"
    >
      <div className="flex items-start justify-between">
        <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${toneCls} flex items-center justify-center`}>
          {icon}
        </span>
        {trend === "up" && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            <TrendingUp className="w-3 h-3" />
            healthy
          </span>
        )}
        {trend === "down" && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            <TrendingDown className="w-3 h-3" />
            review
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">{label}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-1.5">{hint}</p>}
      </div>
    </motion.div>
  );
}

function DailyVolumeChart({ data, max }: { data: { date: string; count: number }[]; max: number }) {
  const w = 720;
  const h = 180;
  const pad = { l: 28, r: 8, t: 8, b: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const barW = innerW / data.length;
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-2xl font-extrabold text-slate-900">{fmtNumber(total)}</span>
        <span className="text-xs text-slate-500">documents in window</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[480px] h-44">
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={pad.l}
              x2={w - pad.r}
              y1={pad.t + innerH * (1 - p)}
              y2={pad.t + innerH * (1 - p)}
              stroke="#f1f5f9"
              strokeDasharray="3 3"
            />
          ))}
          {data.map((d, i) => {
            const bh = (d.count / max) * innerH;
            const x = pad.l + i * barW + 1;
            const y = pad.t + innerH - bh;
            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(2, barW - 2)}
                  height={Math.max(0, bh)}
                  rx={2}
                  className="fill-primary/80 hover:fill-primary transition"
                >
                  <title>{`${d.date}: ${d.count}`}</title>
                </rect>
              </g>
            );
          })}
          {Array.from(new Set([0, Math.floor(data.length / 2), data.length - 1])).map((i) => {
            if (!data[i]) return null;
            const x = pad.l + i * barW + barW / 2;
            const label = new Date(data[i].date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });
            return (
              <text key={`label-${i}`} x={x} y={h - 6} textAnchor="middle" className="fill-slate-400 text-[10px]">
                {label}
              </text>
            );
          })}
          <text x={4} y={pad.t + 8} className="fill-slate-400 text-[10px]">
            {max}
          </text>
          <text x={4} y={pad.t + innerH} className="fill-slate-400 text-[10px]">
            0
          </text>
        </svg>
      </div>
    </div>
  );
}

function MonthlyVatChart({
  data,
  max,
  currency,
}: {
  data: { month: string; total: number; count: number }[];
  max: number;
  currency: string;
}) {
  if (data.length === 0) {
    return <p className="text-xs text-slate-400 py-10 text-center">No VAT amounts extracted yet.</p>;
  }
  const totalVat = data.reduce((sum, item) => sum + item.total, 0);
  const invoiceCount = data.reduce((sum, item) => sum + item.count, 0);
  const peakMonth = data.reduce((peak, item) => (item.total > peak.total ? item : peak), data[0]);
  const visibleW = 760;
  const monthSlotW = 72;
  const w = Math.max(visibleW, 52 + 14 + data.length * monthSlotW);
  const h = 220;
  const pad = { l: 52, r: 14, t: 32, b: 46 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const barW = innerW / data.length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-extrabold text-slate-900">{fmtMoney(totalVat, currency)}</span>
            <span className="text-xs text-slate-500">
              total VAT across {fmtNumber(invoiceCount)} invoice{invoiceCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Scroll horizontally to view additional months.</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Highest Month</p>
          <p className="text-sm font-extrabold text-slate-900">{fmtMoney(peakMonth.total, currency)}</p>
          <p className="text-[10px] text-emerald-700/80">{monthLabel(peakMonth.month)}</p>
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-56 max-w-none" style={{ width: `${w}px`, minWidth: "100%" }}>
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={pad.l}
              x2={w - pad.r}
              y1={pad.t + innerH * (1 - p)}
              y2={pad.t + innerH * (1 - p)}
              stroke="#f1f5f9"
              strokeDasharray="3 3"
            />
          ))}
          {data.map((item, i) => {
            const bh = (item.total / max) * innerH;
            const rectW = Math.min(44, Math.max(16, barW - 18));
            const x = pad.l + i * barW + (barW - rectW) / 2;
            const y = pad.t + innerH - bh;
            const label = monthLabel(item.month);
            const [labelMonth, labelYear] = label.split(" ");
            return (
              <g key={item.month}>
                <rect
                  x={x}
                  y={y}
                  width={rectW}
                  height={Math.max(2, bh)}
                  rx={4}
                  className="fill-emerald-500/85 hover:fill-emerald-600 transition"
                >
                  <title>{`${label}: ${fmtMoney(item.total, currency)} VAT from ${item.count} invoice${item.count === 1 ? "" : "s"}`}</title>
                </rect>
                {barW >= 58 && (
                  <text x={x + rectW / 2} y={y - 8} textAnchor="middle" className="fill-slate-600 text-[9px] font-bold">
                    {fmtMoney(item.total, currency)}
                  </text>
                )}
                <text x={x + rectW / 2} y={h - 24} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
                  {labelMonth}
                </text>
                <text x={x + rectW / 2} y={h - 10} textAnchor="middle" className="fill-slate-400 text-[9px]">
                  {labelYear}
                </text>
              </g>
            );
          })}
          <text x={4} y={pad.t + 8} className="fill-slate-400 text-[10px]">
            {fmtMoney(max, currency)}
          </text>
          <text x={4} y={pad.t + innerH} className="fill-slate-400 text-[10px]">
            {fmtMoney(0, currency)}
          </text>
        </svg>
      </div>
    </div>
  );
}

function StatusDonut({ entries, total }: { entries: { status: string; count: number }[]; total: number }) {
  const r = 50;
  const cx = 70;
  const cy = 70;
  const c = 2 * Math.PI * r;

  const STROKE_BY_STATUS: Record<string, string> = {
    approved: "#10b981",
    completed: "#10b981",
    review: "#f59e0b",
    processing: "#0ea5e9",
    structuring: "#082f73",
    uploaded: "#94a3b8",
    rejected: "#ef4444",
    failed: "#ef4444",
    error: "#ef4444",
  };

  const segments = entries.reduce<
    Array<{ status: string; dash: number; offset: number; stroke: string }>
  >((acc, e) => {
    const cursor = acc.reduce((sum, s) => sum + s.dash, 0);
    const dash = (e.count / Math.max(1, total)) * c;
    acc.push({
      status: e.status,
      dash,
      offset: -cursor,
      stroke: STROKE_BY_STATUS[e.status] ?? "#94a3b8",
    });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="w-32 h-32 -rotate-90 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} stroke="#f1f5f9" strokeWidth={16} fill="none" />
        {segments.map((s) => (
          <circle
            key={s.status}
            cx={cx}
            cy={cy}
            r={r}
            stroke={s.stroke}
            strokeWidth={16}
            fill="none"
            strokeDasharray={`${s.dash} ${c}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex-1 min-w-0 space-y-2">
        {entries.length === 0 && <p className="text-xs text-slate-400">No data</p>}
        {entries.map((e) => {
          const pct = total ? (e.count / total) * 100 : 0;
          const c2 = statusColor(e.status);
          return (
            <div key={e.status} className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-sm ${c2.bg}`} />
              <span className="text-xs font-medium text-slate-700 capitalize truncate flex-1">{e.status}</span>
              <span className="text-xs font-bold text-slate-900 tabular-nums">{e.count}</span>
              <span className="text-[10px] text-slate-400 w-10 text-right tabular-nums">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SupplierList({
  items,
  currency,
}: {
  items: { name: string; count: number; amount: number }[];
  currency: string;
}) {
  if (items.length === 0)
    return <p className="text-xs text-slate-400 py-6 text-center">No supplier names extracted yet.</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <div className="space-y-3">
      {items.map((i) => {
        const pct = (i.count / max) * 100;
        return (
          <div key={i.name}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs font-semibold text-slate-700 truncate" title={i.name}>
                {i.name}
              </span>
              <span className="text-[11px] text-slate-500 flex-shrink-0">
                {i.count} doc{i.count === 1 ? "" : "s"}
                {i.amount > 0 && (
                  <span className="ml-2 font-semibold text-slate-700">{fmtMoney(i.amount, currency)}</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeBars({ items, total }: { items: { name: string; count: number }[]; total: number }) {
  if (items.length === 0) return <p className="text-xs text-slate-400 py-6 text-center">No document types yet.</p>;
  const palette = [
    "from-primary to-primary-dark",
    "from-secondary to-cyan-500",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-orange-500",
    "from-violet-500 to-purple-500",
    "from-rose-500 to-pink-500",
  ];
  return (
    <div className="space-y-3">
      {items.map((i, idx) => {
        const pct = total ? (i.count / total) * 100 : 0;
        return (
          <div key={i.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700 truncate" title={i.name}>
                {i.name}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {i.count} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${palette[idx % palette.length]} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceHistogram({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((a, b) => a + b.count, 0);
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        {total} document{total === 1 ? "" : "s"} with confidence scores
      </p>
      <div className="flex items-end gap-3 h-40">
        {buckets.map((b, i) => {
          const h = (b.count / max) * 100;
          const tone = i >= 3 ? "from-emerald-500 to-emerald-400" : i === 2 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";
          return (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-md bg-gradient-to-t ${tone} transition-all`}
                  style={{ height: `${Math.max(2, h)}%` }}
                  title={`${b.label}: ${b.count}`}
                />
              </div>
              <span className="text-[10px] font-semibold text-slate-500">{b.label}</span>
              <span className="text-xs font-bold text-slate-800 tabular-nums">{b.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SourceMix({ upload, whatsapp }: { upload: number; whatsapp: number }) {
  const total = upload + whatsapp;
  const pUpload = total ? (upload / total) * 100 : 0;
  const pWA = total ? (whatsapp / total) * 100 : 0;
  return (
    <div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-primary transition-all" style={{ width: `${pUpload}%` }} />
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pWA}%` }} />
      </div>
      <div className="mt-4 space-y-3">
        <SourceRow color="bg-primary" label="Manual upload" count={upload} pct={pUpload} />
        <SourceRow color="bg-emerald-500" label="WhatsApp" count={whatsapp} pct={pWA} />
      </div>
    </div>
  );
}

function SourceRow({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-xs font-medium text-slate-700 flex-1">{label}</span>
      <span className="text-xs font-bold text-slate-900 tabular-nums">{count}</span>
      <span className="text-[10px] text-slate-400 w-10 text-right tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary/40 hover:shadow-md transition"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition flex-shrink-0" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
        <BarChart3 className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1.5">No analytics yet</h3>
      <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
        Upload and process a few documents — your trends, suppliers, and accuracy metrics will appear here.
      </p>
      <Link
        href="/dashboard/upload"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md transition"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Upload your first document
      </Link>
    </div>
  );
}