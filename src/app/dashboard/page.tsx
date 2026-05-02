"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Eye,
  Download,
  MoreHorizontal,
  MessageSquare,
  Zap,
  BarChart3,
  RefreshCcw,
  ChevronRight,
  Sparkles,
  Calendar,
  Filter,
  Hand,
  FileSpreadsheet,
  Send,
  MessageCircle,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl } from "@/lib/api";
import { useRouter } from "next/navigation";

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Stats Data ─────────────────────────────────────────────────
const stats = [
  {
    label: "Documents Processed",
    value: 0,
    change: "",
    trend: "up" as const,
    icon: FileText,
    color: "from-primary to-primary-dark",
    bgLight: "bg-primary/5",
  },
  {
    label: "Pending Review",
    value: 0,
    change: "",
    trend: "down" as const,
    icon: Clock,
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
  },
  {
    label: "Accuracy Rate",
    value: 0,
    suffix: "%",
    change: "",
    trend: "up" as const,
    icon: CheckCircle2,
    color: "from-success to-emerald-600",
    bgLight: "bg-success/5",
  },
  {
    label: "WhatsApp Received",
    value: 0,
    change: "",
    trend: "up" as const,
    icon: MessageSquare,
    color: "from-secondary to-cyan-600",
    bgLight: "bg-secondary/5",
  },
];

// ─── Status Config ──────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
  approved: { label: "Approved", color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
  review: { label: "Needs Review", color: "text-amber-600", bg: "bg-amber-50", icon: Eye },
  processing: { label: "Processing", color: "text-primary", bg: "bg-primary/10", icon: RefreshCcw },
  structuring: { label: "Structuring", color: "text-secondary", bg: "bg-secondary/10", icon: RefreshCcw },
  uploaded: { label: "Uploaded", color: "text-slate-500", bg: "bg-slate-100", icon: Upload },
  rejected: { label: "Rejected", color: "text-red-500", bg: "bg-red-50", icon: AlertTriangle },
  failed: { label: "Failed", color: "text-red-500", bg: "bg-red-50", icon: AlertTriangle },
  error: { label: "Failed", color: "text-red-500", bg: "bg-red-50", icon: AlertTriangle },
};

// Activity action config map
const activityActionConfig: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  user_signup: { label: "Signed up", color: "text-success", Icon: CheckCircle2 },
  user_login: { label: "Logged in", color: "text-primary", Icon: Zap },
  user_email_verified: { label: "Email verified", color: "text-success", Icon: CheckCircle2 },
  doc_uploaded: { label: "Uploaded", color: "text-primary", Icon: Upload },
  doc_processing: { label: "Processing", color: "text-secondary", Icon: RefreshCcw },
  doc_processed: { label: "Processed", color: "text-success", Icon: Sparkles },
  doc_approved: { label: "Approved", color: "text-success", Icon: CheckCircle2 },
  doc_rejected: { label: "Rejected", color: "text-red-500", Icon: AlertTriangle },
  doc_exported: { label: "Exported", color: "text-primary", Icon: Download },
  doc_deleted: { label: "Deleted", color: "text-red-500", Icon: AlertTriangle },
  doc_reviewed: { label: "Reviewed", color: "text-amber-500", Icon: Eye },
  plan_changed: { label: "Plan upgraded", color: "text-primary", Icon: Zap },
};

// ─── Processing Pipeline (static defaults, overridden with real data) ──
const pipelineDefaults = [
  { stage: "Uploaded", count: 0, color: "bg-slate-400" },
  { stage: "OCR Running", count: 0, color: "bg-primary" },
  { stage: "AI Extraction", count: 0, color: "bg-secondary" },
  { stage: "Pending Review", count: 0, color: "bg-amber-500" },
  { stage: "Completed Today", count: 0, color: "bg-success" },
];

// ─── Relative Time Helper ──────────────────────────────────────
function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// ─── Quick Actions ──────────────────────────────────────────────
const quickActions = [
  {
    name: "Upload Documents",
    desc: "PDF, JPG, PNG, scans",
    icon: Upload,
    href: "/dashboard/upload",
    color: "from-primary to-primary-dark",
  },
  {
    name: "Review Queue",
    desc: "0 documents pending",
    icon: Eye,
    href: "/dashboard/review",
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Download Excel",
    desc: "Export extracted data",
    icon: FileSpreadsheet,
    href: "/dashboard/review",
    color: "from-success to-emerald-600",
  },
  {
    name: "WhatsApp Inbox",
    desc: "Coming soon",
    icon: MessageSquare,
    href: "/dashboard/whatsapp",
    color: "from-secondary to-cyan-600",
  },
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type PlanOption = {
  _id?: string;
  id?: string;
  name?: string;
  label?: string;
  price?: number;
  interval?: string;
  documentsPerMonth?: number | string;
  features?: string[];
};

// ─── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [userName, setUserName] = useState("");
  const [apiStats, setApiStats] = useState<{
    total: number;
    review: number;
    approved: number;
    errors: number;
    avgConfidence: number;
    processing: number;
  } | null>(null);
  const [apiDocs, setApiDocs] = useState<Array<{
    id: string;
    fileName: string;
    docType?: string;
    status: string;
    overallConfidence: number;
    source: string;
    createdAt: string;
  }>>([]);
  const [apiActivities, setApiActivities] = useState<Array<{
    action: string;
    description: string;
    createdAt: string;
  }>>([]);
  const [planData, setPlanData] = useState<{
    plan: string;
    label: string;
    documentsPerMonth: number | string;
    documentsUsed: number;
    documentsRemaining: number | string;
    usagePercent: number;
    resetsAt: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [navigatingPlanId, setNavigatingPlanId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Listen for sidebar collapse
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        setSidebarWidth(sidebar.getBoundingClientRect().width);
      }
    });
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ["style"] });
      setSidebarWidth(sidebar.getBoundingClientRect().width);
    }
    return () => observer.disconnect();
  }, []);

  // Fetch user
  useEffect(() => {
    fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.fullName) {
          setUserName(data.user.fullName.split(" ")[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, actRes, planRes] = await Promise.all([
          fetch(apiUrl("/api/documents"), { credentials: "include" }),
          fetch(apiUrl("/api/activities?limit=5"), { credentials: "include" }),
          fetch(apiUrl("/api/plan"), { credentials: "include" }),
        ]);
        if (docRes.ok) {
          const data = await docRes.json();
          if (data.stats) setApiStats(data.stats);
          if (data.documents) setApiDocs(data.documents);
        }
        if (actRes.ok) {
          const data = await actRes.json();
          if (data.activities) setApiActivities(data.activities);
        }
        if (planRes.ok) {
          const data = await planRes.json();
          setPlanData(data);
        }
      } catch {
        // Silently fall back to defaults
      }
    };
    fetchData();
    // Poll every 10s for updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(apiUrl("/api/plan/list"), {
          credentials: "include",
        });
        const json = await res.json();

        if (json.success) {
          setPlans(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // const handleSubscribe = (plan: PlanOption) => {
  //   const planId = plan._id || plan.id;

  //   if (!planId) {
  //     alert("Invalid plan");
  //     return;
  //   }

  //   const encodedPlanId = encodeURIComponent(String(planId));

  //   setNavigatingPlanId(String(planId));
  //   setShowUpgradeModal(false);
  //   router.push(`/checkout?planId=${encodedPlanId}`);
  // };

  const handlePlanSelect = async (plan: PlanOption) => {
    const planId = plan._id || plan.id;

    if (!planId) {
      alert("Invalid plan");
      return;
    }

    const price = plan.price ?? 0;

    try {
      setNavigatingPlanId(String(planId));

      // ✅ FREE PLAN FLOW
      if (price === 0) {
        const res = await fetch(apiUrl("/api/plan/free"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to activate free plan");
        }

        // ✅ refresh UI
        window.location.reload(); // or refetch plan API

        return;
      }

      // ✅ PAID PLAN FLOW → REDIRECT
      router.push(`/checkout?planId=${encodeURIComponent(String(planId))}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setNavigatingPlanId(null);
    }
  };

  // Compute dynamic pipeline from real data
  const pipeline = apiStats
    ? [
        { stage: "Uploaded", count: apiStats.total - apiStats.processing - apiStats.review - apiStats.approved - apiStats.errors, color: "bg-slate-400" },
        { stage: "OCR Running", count: apiStats.processing, color: "bg-primary" },
        { stage: "AI Extraction", count: 0, color: "bg-secondary" },
        { stage: "Pending Review", count: apiStats.review, color: "bg-amber-500" },
        { stage: "Completed Today", count: apiStats.approved, color: "bg-success" },
      ].map(p => ({ ...p, count: Math.max(0, p.count) }))
    : pipelineDefaults;

  // Compute dynamic quick actions descriptions
  const dynamicQuickActions = quickActions.map(a => {
    if (a.name === "Review Queue" && apiStats) {
      return { ...a, desc: `${apiStats.review} documents pending` };
    }
    return a;
  });

  // Merge API docs into recent docs for display
  const displayDocs = apiDocs.slice(0, 6).map(d => ({
    id: d.id,
    displayId: d.id.slice(0, 8).toUpperCase(),
    name: d.fileName,
    type: d.docType || "Document",
    status: d.status,
    confidence: Math.round(d.overallConfidence),
    date: getRelativeTime(d.createdAt),
    source: d.source || "upload",
  }));

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.2 }}
        className="min-h-screen"
      >
        <TopBar title="Dashboard" />

        <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900 p-6 sm:p-8"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-accent rounded-full blur-3xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  Welcome back{userName ? `, ${userName}` : ""}
                  <Hand className="w-6 h-6 text-amber-300" />
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  You have <span className="text-amber-400 font-semibold">{apiStats ? apiStats.review : 0} documents</span> pending review and{" "}
                  <span className="text-success font-semibold">{apiStats ? apiStats.approved : 0} approved</span> today.
                </p>
              </div>
              <Link
                href="/dashboard/review"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                Review Now
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { ...stats[0], value: apiStats ? apiStats.total : stats[0].value },
              { ...stats[1], value: apiStats ? apiStats.review : stats[1].value },
              { ...stats[2], value: apiStats ? apiStats.avgConfidence || 94 : stats[2].value },
              { ...stats[3], value: stats[3].value },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bgLight}`}>
                    <stat.icon className={`w-5 h-5 bg-gradient-to-br ${stat.color} bg-clip-text`} style={{ color: 'var(--primary)' }} />
                  </div>
                  {stat.change && (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-semibold ${
                        stat.trend === "up" ? "text-success" : "text-amber-500"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-extrabold text-slate-900">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-muted mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicQuickActions.map((action, i) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Link
                  href={action.href}
                  className="group block p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-lg hover:shadow-slate-100 hover:border-primary/10 transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {action.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{action.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* WhatsApp Automation CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-6 sm:p-7"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-300 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-200 rounded-full blur-3xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Automate via WhatsApp
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-green-100 rounded-full">NEW</span>
                  </h3>
                  <p className="text-sm text-green-100 mt-1 max-w-md">
                    Skip the upload — just send your invoices, receipts, or POs to our WhatsApp number and get structured data back instantly.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                      <Smartphone className="w-4 h-4 text-green-200" />
                      <span className="text-sm font-bold text-white tracking-wide">+1 (555) 071-0321</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auto-processed by AI
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <a
                  href="https://wa.me/15550710321?text=Hi%2C%20I%20want%20to%20process%20a%20document"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-green-700 bg-white rounded-xl hover:bg-green-50 hover:scale-105 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Send on WhatsApp
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
                <Link
                  href="/dashboard/whatsapp"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/25 rounded-xl hover:bg-white/10 transition-all"
                >
                  View Inbox
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Processing Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-slate-100 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Processing Pipeline
              </h3>
              <button className="text-xs text-primary font-medium hover:underline">
                View details
              </button>
            </div>
            <div className="flex items-center gap-2">
              {pipeline.map((stage, i) => (
                <div key={stage.stage} className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <span className="text-xs text-muted truncate">
                      {stage.stage}
                    </span>
                  </div>
                  <div className="relative h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-700">
                      {stage.count}
                    </span>
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className="hidden sm:flex items-center justify-end -mr-3 mt-2">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Documents — takes 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Documents
                </h3>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                  </button>
                  <Link
                    href="/dashboard/documents"
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {displayDocs.length > 0 ? displayDocs.map((doc) => {
                  const cfg = statusConfig[doc.status] || statusConfig.processing;
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {doc.name}
                          </p>
                          {doc.source === "whatsapp" && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-50 text-green-600 rounded">
                              WA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {doc.type} · {doc.date}
                        </p>
                      </div>

                      {/* Confidence */}
                      {doc.confidence > 0 && (
                        <div className="hidden sm:flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  doc.confidence >= 90
                                    ? "bg-success"
                                    : doc.confidence >= 80
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}
                                style={{ width: `${doc.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {doc.confidence}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(doc.status === "review" || doc.status === "approved" || doc.status === "completed") && (
                          <Link
                            href={`/dashboard/review?id=${doc.id}`}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Review document"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        {(doc.status === "approved" || doc.status === "completed") && (
                          <Link
                            href={`/api/documents/${doc.id}/excel`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Download Excel"
                          >
                            <Download className="w-4 h-4" />
                          </Link>
                        )}
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-14 px-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                      <FileText className="w-7 h-7 text-primary/40" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No documents yet</p>
                    <p className="text-xs text-muted mt-1 text-center max-w-[220px]">
                      Upload your first document to get started with AI extraction.
                    </p>
                    <Link
                      href="/dashboard/upload"
                      className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:scale-105 transition-transform shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Document
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Activity Feed
                </h3>
                <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-50">
                {apiActivities.length > 0
                  ? apiActivities.map((a, i) => {
                      const cfg = activityActionConfig[a.action] || { label: a.action, color: "text-slate-500", Icon: FileText };
                      const ActivityIcon = cfg.Icon;
                      return (
                        <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                          <div className="p-1.5 rounded-lg bg-slate-50 flex-shrink-0 mt-0.5">
                            <ActivityIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800">
                              <span className="font-semibold">{cfg.label}</span>{" "}
                              <span className="text-muted">{a.description}</span>
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                            {getRelativeTime(a.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  : (
                    <div className="flex flex-col items-center justify-center py-10 px-5">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-xs font-medium text-slate-500">No activity yet</p>
                      <p className="text-[10px] text-muted mt-0.5">Your actions will appear here</p>
                    </div>
                  )
                }
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <button className="w-full text-center text-xs font-medium text-primary hover:underline">
                  View full history
                </button>
              </div>
            </motion.div>
          </div>

          {/* Usage & Plan Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl border border-slate-100 p-5"
          >
            {(() => {
              const plan = planData?.plan || "free";
              const label = planData?.label || "Free";
              const used = planData?.documentsUsed || 0;
              const limit = typeof planData?.documentsPerMonth === "number" ? planData.documentsPerMonth : 5;
              const isUnlimited = planData?.documentsPerMonth === "Unlimited";
              const usagePct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
              const isNearLimit = !isUnlimited && usagePct >= 80;
              const isAtLimit = !isUnlimited && used >= limit;
              const remaining = isUnlimited ? "∞" : Math.max(0, limit - used);
              const resetsAt = planData?.resetsAt ? new Date(planData.resetsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${plan === "free" ? "bg-slate-100" : "bg-primary/5"}`}>
                        <Zap className={`w-6 h-6 ${plan === "free" ? "text-slate-500" : "text-primary"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {label} Plan
                          </h3>
                          {plan === "free" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                              FREE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {isUnlimited
                            ? `${used.toLocaleString()} documents used this month · Unlimited`
                            : `${used} of ${limit} documents used this month`}
                          {resetsAt && <span className="text-slate-400"> · Resets {resetsAt}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex-1 sm:w-48">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted">{isUnlimited ? "Unlimited" : `${remaining} remaining`}</span>
                          {!isUnlimited && (
                            <span className={`font-semibold ${isAtLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-slate-700"}`}>
                              {usagePct.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isAtLimit
                                ? "bg-gradient-to-r from-red-400 to-red-500"
                                : isNearLimit
                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                : "bg-gradient-to-r from-primary to-secondary"
                            }`}
                            style={{ width: `${isUnlimited ? 0 : usagePct}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl hover:scale-105 transition-transform shadow-md ${
                          plan === "free"
                            ? "text-white bg-gradient-to-r from-primary to-primary-dark"
                            : "text-primary border border-primary/20 hover:bg-primary/5 shadow-none"
                        }`}
                      >
                        {plan === "free" ? "Manage Plan" : "Manage Plan"}
                      </button>
                    </div>
                  </div>

                  {/* Warning when near/at limit */}
                  {isAtLimit && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600 font-medium flex-1">
                        You&apos;ve reached your monthly document limit. Paid plans coming soon — your limit resets {resetsAt || "next month"}.
                      </p>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-3 py-1.5 text-[10px] font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                      >
                        View Plans
                      </button>
                    </div>
                  )}
                  {isNearLimit && !isAtLimit && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-600 font-medium flex-1">
                        You&apos;re running low — only {remaining} document{remaining === 1 ? "" : "s"} remaining this month.
                      </p>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-3 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors whitespace-nowrap"
                      >
                        View Plans
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </main>
      </motion.div>

      {/* Plan Management Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary via-primary-dark to-slate-900 px-6 py-5 text-white">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-secondary rounded-full blur-3xl" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <h2 className="text-lg font-bold">Manage Your Plan</h2>
                    </div>
                    <p className="text-sm text-slate-300">
                      You&apos;re currently on the <strong className="text-white">{planData?.label || "Free"}</strong> plan.
                      {planData?.documentsUsed !== undefined && (
                        <> You&apos;ve used <strong className="text-amber-300">{planData.documentsUsed}</strong> of{" "}
                        <strong className="text-white">{typeof planData?.documentsPerMonth === "number" ? planData.documentsPerMonth : planData?.documentsPerMonth || 5}</strong> documents this month.</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              {/* <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"> */}
                {/* {[
                  {
                    key: "free",
                    name: "Free",
                    price: "$0",
                    period: "/mo",
                    docs: "5 documents/month",
                    features: ["PDF & image upload", "AI OCR extraction", "Excel export", "1 user account"],
                    color: "border-slate-200",
                    gradient: "from-slate-50 to-white",
                    iconBg: "bg-slate-100",
                    iconColor: "text-slate-500",
                  },
                  {
                    key: "starter",
                    name: "Starter",
                    price: "$49",
                    period: "/mo",
                    docs: "100 documents/month",
                    features: ["Everything in Free", "Priority processing", "Email support", "1 user account"],
                    color: "border-blue-200",
                    gradient: "from-blue-50/50 to-white",
                    iconBg: "bg-blue-100",
                    iconColor: "text-blue-500",
                  },
                  {
                    key: "professional",
                    name: "Professional",
                    price: "$149",
                    period: "/mo",
                    docs: "1,000 documents/month",
                    features: ["Everything in Starter", "WhatsApp integration", "Bulk upload", "5 user accounts", "API access"],
                    color: "border-primary/30",
                    gradient: "from-primary/5 to-white",
                    iconBg: "bg-primary/10",
                    iconColor: "text-primary",
                  },
                  {
                    key: "enterprise",
                    name: "Enterprise",
                    price: "Custom",
                    period: "",
                    docs: "Unlimited documents",
                    features: ["Everything in Professional", "ERP integration", "Unlimited users", "Dedicated support", "Custom SLA"],
                    color: "border-slate-200",
                    gradient: "from-slate-50/50 to-white",
                    iconBg: "bg-slate-100",
                    iconColor: "text-slate-600",
                  },
                ].map((p) => {
                  const currentPlan = planData?.plan || "free";
                  const isCurrent = p.key === currentPlan;
                  const isPaid = p.key !== "free";

                  return (
                    <div
                      key={p.key}
                      className={`relative flex flex-col p-5 rounded-xl border-2 bg-gradient-to-b transition-all ${
                        isCurrent
                          ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                          : `${p.color} hover:shadow-md`
                      } ${p.gradient}`}
                    > */}
                      {/* Current plan badge */}
                      {/* {isCurrent && (
                        <span className="absolute -top-2.5 left-4 px-3 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-full shadow-sm">
                          CURRENT PLAN
                        </span>
                      )} */}

                      {/* Coming Soon badge for paid plans */}
                      {/* {isPaid && !isCurrent && (
                        <span className="absolute -top-2.5 right-4 px-3 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full">
                          COMING SOON
                        </span>
                      )} */}

                      {/* Plan header */}
                      {/* <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${p.iconBg}`}>
                          <Zap className={`w-4 h-4 ${p.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-extrabold text-slate-900">{p.price}</span>
                            {p.period && <span className="text-xs text-muted">{p.period}</span>}
                          </div>
                        </div>
                      </div> */}

                      {/* Docs limit */}
                      {/* <p className="text-xs font-medium text-slate-600 mb-3 pb-3 border-b border-slate-100">
                        {p.docs}
                      </p> */}

                      {/* Features */}
                      {/* <ul className="space-y-1.5 flex-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? "text-primary" : "text-success"}`} />
                            {f}
                          </li>
                        ))}
                      </ul> */}

                      {/* Action button */}
                      {/* <div className="mt-4 pt-3 border-t border-slate-100">
                        {isCurrent ? (
                          <div className="w-full py-2 text-center text-xs font-semibold text-primary bg-primary/5 rounded-lg">
                            ✓ Active Plan
                          </div>
                        ) : isPaid ? (
                          <button
                            disabled
                            className="w-full py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                          >
                            Coming Soon
                          </button>
                        ) : (
                          <div className="w-full py-2 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-lg">
                            Free Forever
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div> */}

              {/* Plans Grid */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loadingPlans ? (
                  <div className="col-span-full text-center text-sm text-muted py-10">
                    Loading plans...
                  </div>
                ) : plans.length === 0 ? (
                  <div className="col-span-full text-center text-sm text-muted py-10">
                    No plans available
                  </div>
                ) : (
                  plans.map((p) => {
                    const currentPlan = planData?.plan || "free";
                    const isCurrent = p.name === currentPlan;
                    // const isCurrent = p._id === planData?.currentPlanId;
                    const price = p.price ?? 0;
                    const isPaid = price > 0;

                    return (
                      <div
                        key={p._id}
                        className={`relative flex flex-col p-5 rounded-xl border-2 bg-gradient-to-b transition-all ${
                          isCurrent
                            ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                            : "border-slate-200 hover:shadow-md"
                        }`}
                      >
                        {/* Current Plan Badge */}
                        {isCurrent && (
                          <span className="absolute -top-2.5 left-4 px-3 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-full shadow-sm">
                            CURRENT PLAN
                          </span>
                        )}

                        {/* Plan Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-slate-100">
                            <Zap className="w-4 h-4 text-primary" />
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {p.label}
                            </h3>

                            <div className="flex items-baseline gap-0.5">
                              <span className="text-lg font-extrabold text-slate-900">
                                {price === 0 ? "Free" : usdFormatter.format(price)}
                              </span>
                              {p.interval && (
                                <span className="text-xs text-muted">
                                  /{p.interval}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Documents Limit */}
                        <p className="text-xs font-medium text-slate-600 mb-3 pb-3 border-b border-slate-100">
                          {p.documentsPerMonth === "Unlimited"
                            ? "Unlimited documents"
                            : `${p.documentsPerMonth} documents/month`}
                        </p>

                        {/* Features */}
                        <ul className="space-y-1.5 flex-1">
                          {(p.features || [
                            "AI processing",
                            "Export to Excel",
                          ]).map((f: string, i: number) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-600"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* Action Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {isCurrent ? (
                            <div className="w-full py-2 text-center text-xs font-semibold text-primary bg-primary/5 rounded-lg">
                              ✓ Active Plan
                            </div>
                          ) : isPaid ? (
                            <button
                              onClick={() => handlePlanSelect(p)}
                              disabled={navigatingPlanId === String(p._id || p.id)}
                              className="w-full py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition"
                            >
                              {navigatingPlanId === String(p._id || p.id) ? "Opening..." : "Upgrade"}
                            </button>
                          ) : (
                             <button
                              onClick={() => handlePlanSelect(p)}
                              disabled={navigatingPlanId === String(p._id || p.id)}
                              className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                            >
                              {navigatingPlanId === String(p._id || p.id)
                                ? "Switching..."
                                : "Switch to Free"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-muted">
                  Paid plans coming soon. We&apos;ll notify you when they&apos;re available.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
