"use client";

/**
 * Billing & subscription management.
 *
 * Pulls from:
 *   GET  /api/plan          – current plan, limits, usage (docs + pages)
 *   GET  /api/plan/payments – payment history (added in this PR)
 *   GET  /api/auth/me       – billing contact info
 *
 * The "Manage Plan" button reuses the existing `ManagePlanModal`
 * which already handles free-plan activation and Stripe checkout
 * navigation, so we don't reimplement plan-switching logic here.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Receipt,
  ArrowUpRight,
  Loader2,
  ShieldCheck,
  Zap,
  Crown,
  RefreshCw,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ManagePlanModal from "@/components/dashboard/ManagePlanModal";
import { apiUrl } from "@/lib/api";

interface PlanInfo {
  plan: string;
  label: string;
  documentsPerMonth: number | string;
  documentsUsed: number;
  documentsRemaining: number | string;
  usagePercent: number;
  pagesPerMonth: number | string;
  pagesUsed: number;
  pagesRemaining: number | string;
  pageUsagePercent: number;
  maxUsers?: number;
  planStartedAt?: string;
  planExpiresAt?: string | null;
  resetsAt?: string;
  // Workspace-aware fields. When the viewer is an invited teammate
  // (not the workspace owner), `viewerIsOwner` is false and the
  // billing page renders a read-only "managed by" state.
  viewerIsOwner?: boolean;
  isManagedByTeam?: boolean;
  ownerName?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed";
  paymentMethod: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  paidAt: string | null;
  createdAt: string;
  planLabel: string | null;
  planName: string | null;
}

interface Me {
  fullName?: string;
  email?: string;
  companyName?: string;
}

const STATUS_PILL: Record<Payment["status"], { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  succeeded: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-amber-600/20", Icon: Clock },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 ring-red-600/20", Icon: AlertCircle },
};

function formatCurrency(amount: number, currency: string): string {
  // Stripe stores amounts as the smallest currency unit (cents/fils).
  const value = amount / 100;
  try {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    });
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BillingPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const [planRes, meRes, payRes] = await Promise.all([
        fetch(apiUrl("/api/plan"), { credentials: "include" }),
        fetch(apiUrl("/api/auth/me"), { credentials: "include" }),
        fetch(apiUrl("/api/plan/payments?limit=20"), { credentials: "include" }),
      ]);

      if (planRes.ok) {
        setPlan(await planRes.json());
      }
      if (meRes.ok) {
        const data = await meRes.json();
        setMe(data?.user ?? null);
      }
      if (payRes.ok) {
        const data = await payRes.json();
        setPayments(Array.isArray(data?.data) ? data.data : []);
      } else {
        setPayments([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billing info");
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isFree = (plan?.plan || "free").toLowerCase() === "free";
  const isUnlimited = plan?.documentsPerMonth === "Unlimited";

  const planTone = useMemo(() => {
    const p = (plan?.plan || "free").toLowerCase();
    if (p === "enterprise") return "from-slate-900 via-slate-800 to-indigo-900";
    if (p === "professional") return "from-indigo-600 via-purple-600 to-fuchsia-600";
    if (p === "starter") return "from-primary via-primary-dark to-secondary";
    return "from-slate-700 via-slate-800 to-slate-900";
  }, [plan?.plan]);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="ml-[260px] p-6">
        <TopBar title="Billing" />

        <div className="max-w-6xl mx-auto mt-6">
          {/* ─── Header ──────────────────────────────────────── */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20">
                  <CreditCard className="w-5 h-5" />
                </span>
                Billing & Plan
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your subscription, monitor usage, and download invoices.
              </p>
            </div>
            <button
              onClick={() => {
                setRefreshing(true);
                load();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* ─── Current plan hero card ──────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${planTone} text-white shadow-lg shadow-slate-900/10 mb-6`}
              >
                <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
                        <Crown className="w-3.5 h-3.5" />
                        Current Plan
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                        {plan?.label || "Free"}
                      </h2>
                      <p className="text-sm text-white/80 mt-2 max-w-md">
                        {isFree
                          ? "You're on the free tier — perfect for trying out DocuAI. Upgrade any time to lift your monthly limits."
                          : "Thanks for being a paid customer. Your usage resets automatically each billing period."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      {plan?.viewerIsOwner === false ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-white/15 ring-1 ring-inset ring-white/30 rounded-xl">
                          <Crown className="w-3.5 h-3.5 text-amber-300" />
                          Managed by {plan?.ownerName || "workspace owner"}
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowPlanModal(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-900 bg-white rounded-xl shadow hover:shadow-lg transition"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isFree ? "Upgrade Plan" : "Manage Plan"}
                        </button>
                      )}
                      <Link
                        href="/pricing"
                        className="text-xs text-white/80 hover:text-white inline-flex items-center gap-1"
                      >
                        Compare all plans
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Stat strip */}
                  <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <PlanStat
                      label="Documents / month"
                      value={isUnlimited ? "Unlimited" : String(plan?.documentsPerMonth ?? 0)}
                    />
                    <PlanStat
                      label="Pages / month"
                      value={
                        plan?.pagesPerMonth === "Unlimited"
                          ? "Unlimited"
                          : String(plan?.pagesPerMonth ?? 0)
                      }
                    />
                    <PlanStat
                      label="Started"
                      value={formatDate(plan?.planStartedAt)}
                    />
                    <PlanStat
                      label={isFree ? "Resets" : "Renews"}
                      value={formatDate(plan?.planExpiresAt || plan?.resetsAt)}
                    />
                  </div>
                </div>
              </motion.div>

              {/* ─── Usage + Billing contact ─────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </span>
                      Usage this period
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Resets {formatDate(plan?.resetsAt)}
                    </span>
                  </div>

                  <UsageBar
                    label="Documents"
                    used={plan?.documentsUsed ?? 0}
                    limit={plan?.documentsPerMonth ?? 0}
                    percent={plan?.usagePercent ?? 0}
                  />
                  <div className="h-4" />
                  <UsageBar
                    label="Pages"
                    used={plan?.pagesUsed ?? 0}
                    limit={plan?.pagesPerMonth ?? 0}
                    percent={plan?.pageUsagePercent ?? 0}
                  />

                  {(plan?.usagePercent ?? 0) >= 80 && !isUnlimited && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <strong>Heads up:</strong> you&apos;ve used {plan?.usagePercent.toFixed(0)}% of your monthly quota.
                        <button
                          onClick={() => setShowPlanModal(true)}
                          className="ml-1 underline font-semibold"
                        >
                          Upgrade to avoid interruption.
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                >
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </span>
                    Billing Contact
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Name</dt>
                      <dd className="text-slate-800 font-semibold mt-0.5">{me?.fullName || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Email</dt>
                      <dd className="text-slate-800 mt-0.5 break-all">{me?.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Company</dt>
                      <dd className="text-slate-800 mt-0.5">{me?.companyName || "—"}</dd>
                    </div>
                  </dl>
                  <Link
                    href="/dashboard/settings"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Edit billing details
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </motion.div>
              </div>

              {/* ─── Payment history ──────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </span>
                    Payment History
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Last {payments.length} transaction{payments.length === 1 ? "" : "s"}
                  </span>
                </div>

                {paymentsLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-12 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
                      <Receipt className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No payments yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Once you subscribe to a paid plan, your invoices will appear here for easy download.
                    </p>
                    {isFree && (
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        See upgrade options
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold">Date</th>
                          <th className="text-left px-3 py-3 font-semibold">Plan</th>
                          <th className="text-right px-3 py-3 font-semibold">Amount</th>
                          <th className="text-left px-3 py-3 font-semibold">Status</th>
                          <th className="text-left px-3 py-3 font-semibold">Method</th>
                          <th className="text-right px-5 py-3 font-semibold">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => {
                          const pill = STATUS_PILL[p.status] ?? STATUS_PILL.pending;
                          const PillIcon = pill.Icon;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60">
                              <td className="px-5 py-3 text-slate-700">
                                {formatDate(p.paidAt || p.createdAt)}
                              </td>
                              <td className="px-3 py-3">
                                <span className="font-semibold text-slate-800">
                                  {p.planLabel || p.planName || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-slate-900 tabular-nums">
                                {formatCurrency(p.amount, p.currency)}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${pill.cls}`}>
                                  <PillIcon className="w-3 h-3" />
                                  {pill.label}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 capitalize text-xs">
                                {p.paymentMethod || "—"}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {p.hostedInvoiceUrl && (
                                    <a
                                      href={p.hostedInvoiceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="View invoice"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {p.invoicePdf && (
                                    <a
                                      href={p.invoicePdf}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Download PDF"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {!p.hostedInvoiceUrl && !p.invoicePdf && (
                                    <span className="text-xs text-slate-300">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>

              {/* ─── Trust footer ────────────────────────────── */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Payments are processed securely by Stripe. We never store card details.
              </div>
            </>
          )}
        </div>
      </main>

      <ManagePlanModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        planData={plan ?? undefined}
      />
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2.5 ring-1 ring-white/15">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-white/60">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5 truncate">{value}</p>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
  percent,
}: {
  label: string;
  used: number;
  limit: number | string;
  percent: number;
}) {
  const isUnlimited = limit === "Unlimited";
  const tone =
    percent >= 90
      ? "from-red-500 to-rose-500"
      : percent >= 75
        ? "from-amber-500 to-orange-500"
        : "from-primary to-secondary";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-xs text-slate-500 tabular-nums">
          <strong className="text-slate-900">{used.toLocaleString()}</strong>
          {" / "}
          {isUnlimited ? "∞" : Number(limit).toLocaleString()}
          {!isUnlimited && (
            <span className="ml-2 text-[11px] text-slate-400">({percent.toFixed(0)}%)</span>
          )}
        </span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${tone} rounded-full transition-all`}
          style={{ width: `${isUnlimited ? 8 : Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
