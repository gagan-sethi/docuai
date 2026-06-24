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
  Eye,
  Download,
  ChevronDown,
  Inbox,
  Dot,
  CheckCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import MergeBar from "@/components/dashboard/MergeBar";
import { DocTypeBadge } from "@/components/dashboard/DocTypeBadge";
import { apiUrl } from "@/lib/api";
import type { ProcessedDocument, DocumentStatus } from "@/lib/types";
import { getClassificationConfidence, resolveDocTypeCode } from "@/lib/finance";

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatProcessingError(error?: string): string {
  if (!error) return "Processing failed. Open the document for details.";

  const normalized = error.toLowerCase();
  if (normalized.includes("429") || normalized.includes("rate limit")) {
    return "The extraction service was busy. Please retry this document.";
  }
  if (
    normalized.includes("document limit") ||
    normalized.includes("page limit") ||
    normalized.includes("allowance")
  ) {
    return error;
  }
  if (normalized.includes("no readable text")) {
    return "No readable text was found. Try a clearer scan or PDF.";
  }
  if (normalized.includes("not configured")) {
    return "The extraction service is temporarily unavailable.";
  }

  return error.length > 110 ? `${error.slice(0, 107)}...` : error;
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  if (fileType?.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-purple-500" />;
  if (fileType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  if (fileType?.includes("spreadsheet") || fileType?.includes("excel") || fileType?.includes("csv"))
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

function DocumentPreviewFrame({ doc }: { doc: ProcessedDocument }) {
  const previewUrl = apiUrl(`/api/documents/${doc.id}/preview`);
  const isImage = doc.fileType?.startsWith("image/");
  const isPdf = doc.fileType === "application/pdf" || doc.fileName.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <iframe
        src={`${previewUrl}#toolbar=0&navpanes=0`}
        title={`Preview: ${doc.fileName}`}
        className="h-full w-full border-0 bg-white"
        loading="lazy"
      />
    );
  }

  if (isImage) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={`Preview: ${doc.fileName}`}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-50 text-center text-slate-400">
      <FileTypeIcon fileType={doc.fileType} />
      <p className="text-xs font-semibold">Preview unavailable</p>
    </div>
  );
}

function HoverPreview({
  doc,
  children,
}: {
  doc: ProcessedDocument;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const typeConfidence = getClassificationConfidence(doc);

  const updatePosition = (clientX: number, clientY: number) => {
    const width = 288;
    const height = 350;
    const left = Math.min(clientX + 18, window.innerWidth - width - 12);
    const top = Math.min(clientY + 18, window.innerHeight - height - 12);
    setPosition({
      x: Math.max(12, left),
      y: Math.max(12, top),
    });
  };

  return (
    <div
      tabIndex={0}
      className="inline-flex max-w-full cursor-zoom-in rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
      onMouseEnter={(e) => updatePosition(e.clientX, e.clientY)}
      onMouseMove={(e) => updatePosition(e.clientX, e.clientY)}
      onMouseLeave={() => setPosition(null)}
      onFocus={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        updatePosition(rect.right, rect.top);
      }}
      onBlur={() => setPosition(null)}
    >
      {children}
      {position && (
        <div
          className="pointer-events-none fixed z-[80] w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          style={{ left: position.x, top: position.y }}
        >
          <div className="h-56 border-b border-slate-100 bg-slate-100">
            <DocumentPreviewFrame doc={doc} />
          </div>
          <div className="space-y-2 p-3">
            <p className="truncate text-xs font-bold text-slate-800">{doc.fileName}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <DocTypeBadge code={resolveDocTypeCode(doc)} />
              {typeConfidence !== null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  AI {typeConfidence}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Per-user preference: when multiple files arrive together via WhatsApp,
  // automatically combine them into one merged Excel/CSV instead of separate files.
  const [autoMerge, setAutoMerge] = useState(false);
  const [autoMergeSaving, setAutoMergeSaving] = useState(false);

  const router = useRouter();
  /** A WhatsApp doc is mergeable once it has been processed. */
  const isMergeable = useCallback(
    (d: ProcessedDocument) =>
      d.status === "review" || d.status === "approved" || (d.fields?.length ?? 0) > 0,
    []
  );

  // Load auto-merge preference: server first (source of truth across devices),
  // localStorage as a fast fallback if the request fails.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/user/preferences"), {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.ok) {
          const data = (await res.json()) as {
            preferences?: { whatsappAutoMerge?: boolean };
          };
          if (!cancelled) {
            const v = !!data.preferences?.whatsappAutoMerge;
            setAutoMerge(v);
            try {
              localStorage.setItem("whatsapp.autoMerge", v ? "1" : "0");
            } catch {
              /* ignore */
            }
            return;
          }
        }
      } catch {
        /* fall through to localStorage */
      }
      try {
        const v = localStorage.getItem("whatsapp.autoMerge");
        if (!cancelled && v === "1") setAutoMerge(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Persist preference change. Best-effort sync to backend; localStorage is the source of truth client-side.
  const saveAutoMerge = useCallback(async (next: boolean) => {
    setAutoMerge(next);
    setAutoMergeSaving(true);
    try {
      localStorage.setItem("whatsapp.autoMerge", next ? "1" : "0");
      // Best-effort: notify backend so the WhatsApp ingestion pipeline can apply it.
      // If the endpoint doesn't exist, we silently keep the local preference.
      await fetch(apiUrl("/api/user/preferences"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappAutoMerge: next }),
      }).catch(() => {});
    } finally {
      setAutoMergeSaving(false);
    }
  }, []);

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
  fetch(apiUrl("/api/auth/me"), {
    credentials: "include",
  })
    .then((r) => {
      // ✅ Unauthorized
      if (r.status === 401) {
        router.replace("/login");
        return null;
      }

      return r.ok ? r.json() : null;
    })
    .then((data) => {
      if (data?.user) {
        setUser(data.user);
      }
    })
    .catch(() => {});
}, [router]);

  const fetchDocs = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/documents?source=whatsapp&limit=200"), {
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [router]);

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
      d.docType?.toLowerCase().includes(search.toLowerCase()) ||
      d.docTypeCode?.toLowerCase().includes(search.toLowerCase());
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

            {/* Auto-merge preference */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <label htmlFor="wa-automerge" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Auto-merge incoming WhatsApp files into one Excel
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When you send multiple invoices in the same chat, we&apos;ll combine
                  them into a single audit-ready CSV. Otherwise each file is processed separately.
                </p>
              </div>
              <button
                id="wa-automerge"
                role="switch"
                aria-checked={autoMerge}
                onClick={() => saveAutoMerge(!autoMerge)}
                disabled={autoMergeSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  autoMerge ? "bg-green-500" : "bg-slate-200"
                } ${autoMergeSaving ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoMerge ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Total Received", value: docs.length, color: "text-slate-700", bg: "bg-white" },
              { label: "Needs Review", value: docs.filter((d) => d.status === "review").length, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Approved", value: docs.filter((d) => d.status === "approved").length, color: "text-green-600", bg: "bg-green-50" },
              { label: "Processing", value: docs.filter((d) => ["processing", "structuring", "uploaded"].includes(d.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Errors", value: docs.filter((d) => d.status === "error").length, color: "text-red-600", bg: "bg-red-50" },
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
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select all visible mergeable WhatsApp files"
                          checked={
                            filtered.filter(isMergeable).length > 0 &&
                            filtered.filter(isMergeable).every((d) => selectedIds.includes(d.id))
                          }
                          onChange={(e) => {
                            const ids = filtered.filter(isMergeable).map((d) => d.id);
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? Array.from(new Set([...prev, ...ids]))
                                : prev.filter((x) => !ids.includes(x))
                            );
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">File</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type Confidence</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {filtered.map((doc, i) => (
                        <DocRow
                          key={doc.id}
                          doc={doc}
                          index={i}
                          selectable={isMergeable(doc)}
                          selected={selectedIds.includes(doc.id)}
                          onToggleSelect={() =>
                            setSelectedIds((prev) =>
                              prev.includes(doc.id)
                                ? prev.filter((x) => x !== doc.id)
                                : [...prev, doc.id]
                            )
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Merge bar — appears when one or more processed WhatsApp files are selected */}
          <MergeBar
            selectedIds={selectedIds}
            totalSelectable={filtered.filter(isMergeable).length}
            onSelectAll={() =>
              setSelectedIds(filtered.filter(isMergeable).map((d) => d.id))
            }
            onClear={() => setSelectedIds([])}
            populationLabel="WhatsApp documents"
          />
        </main>
      </div>
    </div>
  );
}

// ─── Doc Row ─────────────────────────────────────────────────────
function DocRow({
  doc,
  index,
  selectable,
  selected,
  onToggleSelect,
}: {
  doc: ProcessedDocument;
  index: number;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const conf = getClassificationConfidence(doc);
  const isNew = doc.status === "uploaded" || doc.status === "processing" || doc.status === "structuring";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`group transition-colors hover:bg-slate-50/80 ${isNew ? "bg-green-50/30" : ""} ${selected ? "bg-primary/5" : ""}`}
    >
      <td className="px-3 py-3.5">
        {selectable ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
            aria-label={`Select ${doc.fileName}`}
          />
        ) : (
          <span className="inline-block w-4" />
        )}
      </td>
      <td className="px-5 py-3.5">
        <HoverPreview doc={doc}>
          <div className="flex min-w-0 items-center gap-3">
            {isNew && <Dot className="w-5 h-5 text-green-500 -ml-2 flex-shrink-0" />}
            <FileTypeIcon fileType={doc.fileType} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">{doc.fileName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  <Eye className="h-3 w-3" />
                  Hover preview
                </span>
              </div>
            </div>
          </div>
        </HoverPreview>
      </td>
      <td className="px-4 py-3.5">
        {doc.status === "error" || resolveDocTypeCode(doc) === "unknown" ? (
          <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
            {doc.docType || (doc.status === "error" ? "Not classified" : "Processing...")}
          </span>
        ) : (
          <DocTypeBadge code={resolveDocTypeCode(doc)} />
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="max-w-[240px]">
          <StatusBadge status={doc.status} />
          {doc.status === "error" && (
            <p
              className="mt-1 text-[11px] leading-4 text-red-600"
              title={doc.error || "Processing failed"}
            >
              {formatProcessingError(doc.error)}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5">
        {conf !== null ? (
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
            href={apiUrl(`/api/documents/${doc.id}/excel`)}
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
