"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Eye,
  Download,
  ChevronDown,
  Inbox,
  Dot,
  CheckCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { apiUrl } from "@/lib/api";
import type { ProcessedDocument, DocumentStatus } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  if (fileType?.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-purple-500" />;
  if (fileType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  if (fileType?.includes("spreadsheet") || fileType?.includes("excel") || fileType?.includes("csv"))
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    review: { label: "Needs Review", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3" /> },
    approved: { label: "Approved", cls: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle className="w-3 h-3" /> },
    processing: { label: "Processing", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    structuring: { label: "Structuring", cls: "bg-blue-100 text-blue-700 border-blue-200", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    uploading: { label: "Uploading", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    uploaded: { label: "Received", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <Clock className="w-3 h-3" /> },
    error: { label: "Error", cls: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const c = cfg[status] || cfg.uploaded;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

const FILTER_OPTIONS = ["All", "Needs Review", "Approved", "Processing", "Error"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

// ─── Page ────────────────────────────────────────────────────────
export default function WhatsAppInboxPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{ fullName: string; mobile?: string; isWhatsAppLinked?: boolean } | null>(null);

  // Track sidebar width
  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.offsetWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.offsetWidth);
    return () => observer.disconnect();
  }, []);

  // Fetch user info
  useEffect(() => {
    fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchDocs = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/documents?source=whatsapp&limit=200"), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(() => fetchDocs(), 30000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  // Filtered docs
  const filtered = docs.filter((d) => {
    const matchSearch =
      !search ||
      d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      d.docType?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Needs Review" && d.status === "review") ||
      (filter === "Approved" && d.status === "approved") ||
      (filter === "Processing" && (d.status === "processing" || d.status === "structuring")) ||
      (filter === "Error" && d.status === "error");
    return matchSearch && matchFilter;
  });

  const totalUnseen = docs.filter(
    (d) => d.status === "uploaded" || d.status === "processing" || d.status === "structuring" || d.status === "review"
  ).length;

  const displayPhone = user?.mobile
    ? user.mobile.replace(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/, '+$1 ($2) $3-$4').startsWith('+') 
      ? user.mobile.replace(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/, '+$1 ($2) $3-$4')
      : `+${user.mobile}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="WhatsApp Inbox" />

        <main className="flex-1 p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  WhatsApp Inbox
                  {totalUnseen > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-green-500 text-white rounded-full">
                      {totalUnseen > 99 ? "99+" : totalUnseen}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-slate-500">
                  {docs.length} file{docs.length !== 1 ? "s" : ""} received via WhatsApp
                  {totalUnseen > 0 && ` · ${totalUnseen} pending`}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchDocs(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Linked phone card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {displayPhone || "No phone linked"}
                    </p>
                    {user?.isWhatsAppLinked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">
                        <CheckCheck className="w-3 h-3" />
                        Linked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {displayPhone
                      ? "Documents sent from this number are automatically processed"
                      : "Link your phone from Settings to receive documents via WhatsApp"}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-bold text-slate-800">{docs.length}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                  Total received
                </p>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Received", value: docs.length, color: "text-slate-700", bg: "bg-white" },
              { label: "Needs Review", value: docs.filter((d) => d.status === "review").length, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Approved", value: docs.filter((d) => d.status === "approved").length, color: "text-green-600", bg: "bg-green-50" },
              { label: "Processing", value: docs.filter((d) => ["processing", "structuring", "uploaded"].includes(d.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${s.bg} rounded-xl border border-slate-100 px-4 py-3`}
              >
                <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by filename or document type…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <Filter className="w-4 h-4" />
                {filter}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showFilter && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-44"
                    >
                      {FILTER_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setFilter(opt); setShowFilter(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition ${filter === opt ? "bg-primary/5 text-primary font-medium" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* File list */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-slate-500">Loading WhatsApp messages…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">No WhatsApp files yet</h3>
              <p className="text-sm text-slate-400 max-w-xs">
                {search || filter !== "All"
                  ? "No files match your search or filter."
                  : displayPhone
                    ? `Send a document or photo to +1 (555) 071-0321 on WhatsApp and it will appear here automatically.`
                    : "Link your phone number in Settings to start receiving documents via WhatsApp."}
              </p>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {filtered.length} file{filtered.length !== 1 ? "s" : ""}
                  {displayPhone && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      from {displayPhone}
                    </span>
                  )}
                </p>
                {filter !== "All" && (
                  <button
                    onClick={() => setFilter("All")}
                    className="text-xs text-primary hover:text-primary-dark font-medium transition"
                  >
                    Show all
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">File</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Confidence</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {filtered.map((doc, i) => (
                        <DocRow key={doc.id} doc={doc} index={i} />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Doc Row ─────────────────────────────────────────────────────
function DocRow({ doc, index }: { doc: ProcessedDocument; index: number }) {
  const conf = doc.overallConfidence > 1 ? Math.round(doc.overallConfidence) : Math.round(doc.overallConfidence * 100);
  const isNew = doc.status === "uploaded" || doc.status === "processing" || doc.status === "structuring";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`group transition-colors hover:bg-slate-50/80 ${isNew ? "bg-green-50/30" : ""}`}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {isNew && <Dot className="w-5 h-5 text-green-500 -ml-2 flex-shrink-0" />}
          <FileTypeIcon fileType={doc.fileType} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">{doc.fileName}</p>
            <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
          {doc.docType || "Processing…"}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={doc.status} />
      </td>
      <td className="px-4 py-3.5">
        {doc.overallConfidence > 0 ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${conf >= 90 ? "bg-green-500" : conf >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${conf}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${conf >= 90 ? "text-green-600" : conf >= 70 ? "text-amber-600" : "text-red-600"}`}>
              {conf}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
        {timeAgo(doc.createdAt)}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/review?doc=${doc.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Review"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <a
            href={apiUrl(`/api/documents/${doc.id}/download`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </td>
    </motion.tr>
  );
}
