"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronRight,
  Loader2,
  ReceiptText,
  Sparkles,
  WalletCards,
  Activity,
} from "lucide-react";
import {
  type FinancialInsight,
  type FinancialInsightCategory,
  type FinancialInsightPriority,
  type FinancialInsightMetric,
} from "@/lib/financialIntelligence";

interface AiInsightsWidgetProps {
  insights: FinancialInsight[];
  docsCount?: number;
  loading?: boolean;
  error?: string | null;
}

const priorityConfig: Record<
  FinancialInsightPriority,
  { label: string; chip: string; dot: string; border: string }
> = {
  high: {
    label: "High Priority",
    chip: "bg-red-50 text-red-600 border-red-100",
    dot: "bg-red-500",
    border: "border-l-red-400",
  },
  medium: {
    label: "Medium Priority",
    chip: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
    border: "border-l-amber-400",
  },
  low: {
    label: "Low Priority",
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    border: "border-l-slate-300",
  },
};

const categoryConfig: Record<
  FinancialInsightCategory,
  { label: string; icon: LucideIcon; iconClass: string; bgClass: string }
> = {
  expense: {
    label: "Expense",
    icon: ReceiptText,
    iconClass: "text-rose-600",
    bgClass: "bg-rose-50",
  },
  supplier: {
    label: "Supplier",
    icon: Building2,
    iconClass: "text-cyan-700",
    bgClass: "bg-cyan-50",
  },
  anomaly: {
    label: "Anomaly",
    icon: AlertTriangle,
    iconClass: "text-red-600",
    bgClass: "bg-red-50",
  },
  invoice: {
    label: "Invoice",
    icon: CalendarClock,
    iconClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
  },
  cash_flow: {
    label: "Cash Flow",
    icon: WalletCards,
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
};

const metricToneClass: Record<NonNullable<FinancialInsightMetric["tone"]>, string> = {
  neutral: "bg-slate-50 text-slate-600 border-slate-100",
  positive: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-red-50 text-red-700 border-red-100",
};

export default function AiInsightsWidget({
  insights,
  docsCount = 0,
  loading = false,
  error = null,
}: AiInsightsWidgetProps) {
  const highPriorityCount = insights.filter((insight) => insight.priority === "high").length;
  const generatedAt = insights[0]?.generatedAt ? formatGeneratedAt(insights[0].generatedAt) : null;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <header className="flex flex-col gap-3 px-5 py-4 border-b border-slate-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-sm shadow-primary/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">AI Insights</h3>
              {highPriorityCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {highPriorityCount} high
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {generatedAt ? `Generated ${generatedAt}` : "Financial intelligence will appear here"}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/finance"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Financial dashboard
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : insights.length === 0 ? (
        <EmptyState docsCount={docsCount} />
      ) : (
        <div className="divide-y divide-slate-50">
          {insights.map((insight) => (
            <InsightRow key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </section>
  );
}

function InsightRow({ insight }: { insight: FinancialInsight }) {
  const priority = priorityConfig[insight.priority];
  const category = categoryConfig[insight.category];
  const Icon = category.icon;

  return (
    <article className={`border-l-4 ${priority.border} px-5 py-4 hover:bg-slate-50/50 transition-colors`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-9 h-9 rounded-xl ${category.bgClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${category.iconClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${priority.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                  {priority.label}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {category.label}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-slate-900">{insight.title}</h4>
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {formatGeneratedAt(insight.generatedAt)}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-600">{insight.description}</p>
          {insight.metrics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.metrics.map((metric) => (
                <span
                  key={`${metric.label}-${metric.value}`}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${
                    metricToneClass[metric.tone ?? "neutral"]
                  }`}
                >
                  <span className="font-medium opacity-75">{metric.label}</span>
                  <span className="font-bold tabular-nums">{metric.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Generating insights
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">Insights unavailable</p>
        <p className="text-xs text-slate-500 mt-0.5">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ docsCount }: { docsCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
        {docsCount > 0 ? <Activity className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </div>
      <p className="text-sm font-bold text-slate-700">
        {docsCount > 0 ? "No actionable insights yet" : "No financial insights yet"}
      </p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">
        {docsCount > 0
          ? "More approved invoices, receipts, and supplier data will improve trend detection."
          : "Upload and process financial documents to populate this panel."}
      </p>
    </div>
  );
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
