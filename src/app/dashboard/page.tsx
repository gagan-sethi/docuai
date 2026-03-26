"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

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
    value: 1247,
    change: "+12.5%",
    trend: "up" as const,
    icon: FileText,
    color: "from-primary to-primary-dark",
    bgLight: "bg-primary/5",
  },
  {
    label: "Pending Review",
    value: 12,
    change: "-3",
    trend: "down" as const,
    icon: Clock,
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
  },
  {
    label: "Accuracy Rate",
    value: 94,
    suffix: "%",
    change: "+1.2%",
    trend: "up" as const,
    icon: CheckCircle2,
    color: "from-success to-emerald-600",
    bgLight: "bg-success/5",
  },
  {
    label: "WhatsApp Received",
    value: 38,
    change: "+8",
    trend: "up" as const,
    icon: MessageSquare,
    color: "from-secondary to-cyan-600",
    bgLight: "bg-secondary/5",
  },
];

// ─── Recent Documents ───────────────────────────────────────────
const recentDocs = [
  {
    id: "DOC-001",
    name: "Invoice_Hamdan_Trading.pdf",
    type: "Invoice",
    status: "completed" as const,
    confidence: 97,
    date: "2 min ago",
    source: "upload",
  },
  {
    id: "DOC-002",
    name: "PO_AlFuttaim_March.pdf",
    type: "Purchase Order",
    status: "review" as const,
    confidence: 82,
    date: "15 min ago",
    source: "whatsapp",
  },
  {
    id: "DOC-003",
    name: "DeliveryNote_DHL_08472.jpg",
    type: "Delivery Note",
    status: "processing" as const,
    confidence: 0,
    date: "22 min ago",
    source: "upload",
  },
  {
    id: "DOC-004",
    name: "Receipt_Carrefour_2026.png",
    type: "Receipt",
    status: "completed" as const,
    confidence: 95,
    date: "1 hr ago",
    source: "whatsapp",
  },
  {
    id: "DOC-005",
    name: "Invoice_Emirates_Steel.pdf",
    type: "Invoice",
    status: "completed" as const,
    confidence: 99,
    date: "2 hrs ago",
    source: "upload",
  },
  {
    id: "DOC-006",
    name: "PO_Majid_AlFuttaim.pdf",
    type: "Purchase Order",
    status: "failed" as const,
    confidence: 0,
    date: "3 hrs ago",
    source: "upload",
  },
];

const statusConfig = {
  completed: {
    label: "Completed",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
  },
  review: {
    label: "Needs Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: Eye,
  },
  processing: {
    label: "Processing",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: RefreshCcw,
  },
  failed: {
    label: "Failed",
    color: "text-red-500",
    bg: "bg-red-50",
    icon: AlertTriangle,
  },
};

// ─── Activity Feed ──────────────────────────────────────────────
const activity = [
  {
    action: "Processed",
    doc: "Invoice_Hamdan_Trading.pdf",
    result: "97% confidence",
    time: "2 min ago",
    icon: Sparkles,
    color: "text-success",
  },
  {
    action: "WhatsApp received",
    doc: "PO_AlFuttaim_March.pdf",
    result: "Queued for processing",
    time: "15 min ago",
    icon: MessageSquare,
    color: "text-secondary",
  },
  {
    action: "Exported",
    doc: "Batch_March_Week3.xlsx",
    result: "12 documents",
    time: "1 hr ago",
    icon: Download,
    color: "text-primary",
  },
  {
    action: "Reviewed & Approved",
    doc: "Receipt_Carrefour_2026.png",
    result: "3 fields corrected",
    time: "2 hrs ago",
    icon: CheckCircle2,
    color: "text-success",
  },
  {
    action: "Alert",
    doc: "PO_Majid_AlFuttaim.pdf",
    result: "Processing failed – retrying",
    time: "3 hrs ago",
    icon: AlertTriangle,
    color: "text-red-500",
  },
];

// ─── Processing Pipeline ────────────────────────────────────────
const pipeline = [
  { stage: "Uploaded", count: 3, color: "bg-slate-400" },
  { stage: "OCR Running", count: 1, color: "bg-primary" },
  { stage: "AI Extraction", count: 2, color: "bg-secondary" },
  { stage: "Pending Review", count: 12, color: "bg-amber-500" },
  { stage: "Completed Today", count: 45, color: "bg-success" },
];

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
    desc: "12 documents pending",
    icon: Eye,
    href: "/dashboard/review",
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Export to Excel",
    desc: "Download extracted data",
    icon: Download,
    href: "#",
    color: "from-success to-emerald-600",
  },
  {
    name: "WhatsApp Inbox",
    desc: "3 new documents",
    icon: MessageSquare,
    href: "/dashboard/whatsapp",
    color: "from-secondary to-cyan-600",
  },
];

// ─── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);

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
                  Welcome back, Gagan
                  <Hand className="w-6 h-6 text-amber-300" />
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  You have <span className="text-amber-400 font-semibold">12 documents</span> pending review and{" "}
                  <span className="text-success font-semibold">45 processed</span> today.
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
            {stats.map((stat, i) => (
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
            {quickActions.map((action, i) => (
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
                {recentDocs.map((doc) => {
                  const cfg = statusConfig[doc.status];
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
                        {doc.status === "review" && (
                          <Link
                            href="/dashboard/review"
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        {doc.status === "completed" && (
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                {activity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-50 flex-shrink-0 mt-0.5">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800">
                        <span className="font-semibold">{item.action}</span>{" "}
                        <span className="text-muted">{item.doc}</span>
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {item.result}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                      {item.time}
                    </span>
                  </div>
                ))}
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/5">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Professional Plan
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    247 of 1,000 documents used this month
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex-1 sm:w-48">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted">Usage</span>
                    <span className="font-semibold text-slate-700">24.7%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[24.7%] bg-gradient-to-r from-primary to-secondary rounded-full" />
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="px-4 py-2 text-xs font-semibold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  Manage Plan
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
