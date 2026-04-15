"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  MessageSquare,
  Upload,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  FolderOpen,
  SortAsc,
  SortDesc,
  X,
  BadgeCheck,
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
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ fileType, large }: { fileType: string; large?: boolean }) {
  const cls = large ? "w-8 h-8" : "w-5 h-5";
  if (fileType?.startsWith("image/")) return <ImageIcon className={`${cls} text-purple-500`} />;
  if (fileType === "application/pdf") return <FileText className={`${cls} text-red-500`} />;
  if (fileType?.includes("spreadsheet") || fileType?.includes("excel") || fileType?.includes("csv"))
    return <FileSpreadsheet className={`${cls} text-green-600`} />;
  return <File className={`${cls} text-slate-400`} />;
}

function statusConfig(status: DocumentStatus) {
  const cfg: Record<string, { label: string; cls: string; dotCls: string; icon: React.ReactNode }> = {
    review: { label: "Needs Review", cls: "bg-amber-100 text-amber-700 border-amber-200", dotCls: "bg-amber-500", icon: <Clock className="w-3 h-3" /> },
    approved: { label: "Approved", cls: "bg-green-100 text-green-700 border-green-200", dotCls: "bg-green-500", icon: <CheckCircle2 className="w-3 h-3" /> },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200", dotCls: "bg-red-500", icon: <AlertTriangle className="w-3 h-3" /> },
    processing: { label: "Processing", cls: "bg-blue-100 text-blue-700 border-blue-200", dotCls: "bg-blue-500", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    structuring: { label: "Structuring", cls: "bg-blue-100 text-blue-700 border-blue-200", dotCls: "bg-blue-500", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    uploading: { label: "Uploading", cls: "bg-slate-100 text-slate-600 border-slate-200", dotCls: "bg-slate-400", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    uploaded: { label: "Queued", cls: "bg-slate-100 text-slate-600 border-slate-200", dotCls: "bg-slate-400", icon: <Clock className="w-3 h-3" /> },
    error: { label: "Error", cls: "bg-red-100 text-red-700 border-red-200", dotCls: "bg-red-500", icon: <AlertTriangle className="w-3 h-3" /> },
  };
  return cfg[status] || cfg.uploaded;
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const c = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

const STATUS_FILTERS = ["All", "Needs Review", "Approved", "Rejected", "Processing", "Error"] as const;
const SOURCE_FILTERS = ["All Sources", "Uploaded", "WhatsApp"] as const;
const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
  { label: "Confidence ↑", value: "conf_asc" },
  { label: "Confidence ↓", value: "conf_desc" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type SourceFilter = (typeof SOURCE_FILTERS)[number];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type ViewMode = "list" | "grid";

// ─── Page ────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All Sources");
  const [sort, setSort] = useState<SortValue>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showStatusDd, setShowStatusDd] = useState(false);
  const [showSourceDd, setShowSourceDd] = useState(false);
  const [showSortDd, setShowSortDd] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver(() => setSidebarWidth(sidebar.offsetWidth));
    observer.observe(sidebar);
    setSidebarWidth(sidebar.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const fetchDocs = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/documents?limit=500"), { credentials: "include" });
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

  // Filter + sort
  const filtered = docs
    .filter((d) => {
      const matchSearch =
        !search ||
        d.fileName.toLowerCase().includes(search.toLowerCase()) ||
        d.docType?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Needs Review" && d.status === "review") ||
        (statusFilter === "Approved" && d.status === "approved") ||
        (statusFilter === "Rejected" && d.status === "rejected") ||
        (statusFilter === "Processing" && (d.status === "processing" || d.status === "structuring")) ||
        (statusFilter === "Error" && d.status === "error");
      const matchSource =
        sourceFilter === "All Sources" ||
        (sourceFilter === "Uploaded" && d.source === "upload") ||
        (sourceFilter === "WhatsApp" && d.source === "whatsapp");
      return matchSearch && matchStatus && matchSource;
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "name_asc") return a.fileName.localeCompare(b.fileName);
      if (sort === "name_desc") return b.fileName.localeCompare(a.fileName);
      const ca = a.overallConfidence > 1 ? a.overallConfidence : a.overallConfidence * 100;
      const cb = b.overallConfidence > 1 ? b.overallConfidence : b.overallConfidence * 100;
      if (sort === "conf_asc") return ca - cb;
      if (sort === "conf_desc") return cb - ca;
      return 0;
    });

  const statsItems = [
    { label: "Total Documents", value: docs.length, color: "text-slate-700", bg: "bg-white" },
    { label: "Needs Review", value: docs.filter((d) => d.status === "review").length, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Approved", value: docs.filter((d) => d.status === "approved").length, color: "text-green-600", bg: "bg-green-50" },
    { label: "Via WhatsApp", value: docs.filter((d) => d.source === "whatsapp").length, color: "text-green-700", bg: "bg-green-50" },
    { label: "Processing", value: docs.filter((d) => ["processing", "structuring", "uploading"].includes(d.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Sort";
  const hasActiveFilters = statusFilter !== "All" || sourceFilter !== "All Sources" || search;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar title="Documents" />

        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">All Documents</h2>
                <p className="text-sm text-slate-500">
                  {docs.length} total document{docs.length !== 1 ? "s" : ""}
                  {hasActiveFilters && ` · Showing ${filtered.length}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDocs(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/dashboard/upload"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {statsItems.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${s.bg} rounded-xl border border-slate-100 px-4 py-3`}
              >
                <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by name or type…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <Dropdown
              label={statusFilter === "All" ? "Status" : statusFilter}
              open={showStatusDd}
              setOpen={setShowStatusDd}
              icon={<Filter className="w-4 h-4" />}
            >
              {STATUS_FILTERS.map((opt) => (
                <DropdownItem key={opt} active={statusFilter === opt} onClick={() => { setStatusFilter(opt); setShowStatusDd(false); }}>
                  {opt}
                </DropdownItem>
              ))}
            </Dropdown>

            {/* Source filter */}
            <Dropdown
              label={sourceFilter}
              open={showSourceDd}
              setOpen={setShowSourceDd}
              icon={<MessageSquare className="w-4 h-4" />}
            >
              {SOURCE_FILTERS.map((opt) => (
                <DropdownItem key={opt} active={sourceFilter === opt} onClick={() => { setSourceFilter(opt); setShowSourceDd(false); }}>
                  {opt}
                </DropdownItem>
              ))}
            </Dropdown>

            {/* Sort */}
            <Dropdown
              label={sortLabel}
              open={showSortDd}
              setOpen={setShowSortDd}
              icon={sort.endsWith("desc") ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            >
              {SORT_OPTIONS.map((opt) => (
                <DropdownItem key={opt.value} active={sort === opt.value} onClick={() => { setSort(opt.value); setShowSortDd(false); }}>
                  {opt.label}
                </DropdownItem>
              ))}
            </Dropdown>

            {/* View toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-slate-600"}`}
                title="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-slate-600"}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("All"); setSourceFilter("All Sources"); }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-slate-500">Loading documents…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">No documents found</h3>
              <p className="text-sm text-slate-400 max-w-xs mb-4">
                {hasActiveFilters ? "No documents match your current filters." : "Upload or receive files to get started."}
              </p>
              {!hasActiveFilters && (
                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload your first document
                </Link>
              )}
            </motion.div>
          ) : viewMode === "list" ? (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Document</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Confidence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filtered.map((doc, i) => (
                      <ListRow
                        key={doc.id}
                        doc={doc}
                        index={i}
                        onPreview={() => setSelectedDoc(doc)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filtered.map((doc, i) => (
                  <GridCard
                    key={doc.id}
                    doc={doc}
                    index={i}
                    onPreview={() => setSelectedDoc(doc)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Document detail drawer */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setSelectedDoc(null)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <DocDetailDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared Dropdown ─────────────────────────────────────────────
function Dropdown({
  label, icon, open, setOpen, children,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition whitespace-nowrap"
      >
        {icon}
        {label}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]"
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition ${active ? "bg-primary/5 text-primary font-medium" : "text-slate-700 hover:bg-slate-50"}`}
    >
      {active && <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" />}
      {children}
    </button>
  );
}

// ─── List Row ────────────────────────────────────────────────────
function ListRow({ doc, index, onPreview }: { doc: ProcessedDocument; index: number; onPreview: () => void }) {
  const conf = doc.overallConfidence > 1 ? Math.round(doc.overallConfidence) : Math.round(doc.overallConfidence * 100);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="group hover:bg-slate-50/80 transition-colors"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <FileTypeIcon fileType={doc.fileType} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">{doc.fileName}</p>
            <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
          {doc.docType || "Unknown"}
        </span>
      </td>
      <td className="px-4 py-3.5">
        {doc.source === "whatsapp" ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-full px-2 py-0.5">
            <Upload className="w-3 h-3" /> Uploaded
          </span>
        )}
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
      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{timeAgo(doc.createdAt)}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPreview}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Link
            href={`/dashboard/review?doc=${doc.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Review"
          >
            <FileText className="w-4 h-4" />
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

// ─── Grid Card ───────────────────────────────────────────────────
function GridCard({ doc, index, onPreview }: { doc: ProcessedDocument; index: number; onPreview: () => void }) {
  const conf = doc.overallConfidence > 1 ? Math.round(doc.overallConfidence) : Math.round(doc.overallConfidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-slate-200 transition-all group cursor-pointer"
      onClick={onPreview}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-slate-50">
          <FileTypeIcon fileType={doc.fileType} large />
        </div>
        {doc.source === "whatsapp" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <MessageSquare className="w-3 h-3" /> WA
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-800 truncate mb-1">{doc.fileName}</p>
      <p className="text-xs text-slate-400 mb-3">{doc.docType || "Unknown type"} · {formatFileSize(doc.fileSize)}</p>
      <div className="flex items-center justify-between">
        <StatusBadge status={doc.status} />
        {doc.overallConfidence > 0 && (
          <span className={`text-xs font-bold ${conf >= 90 ? "text-green-600" : conf >= 70 ? "text-amber-600" : "text-red-600"}`}>
            {conf}%
          </span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-slate-400">{timeAgo(doc.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/dashboard/review?doc=${doc.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <a
            href={apiUrl(`/api/documents/${doc.id}/download`)}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail Drawer ───────────────────────────────────────────────
function DocDetailDrawer({ doc, onClose }: { doc: ProcessedDocument; onClose: () => void }) {
  const conf = doc.overallConfidence > 1 ? Math.round(doc.overallConfidence) : Math.round(doc.overallConfidence * 100);

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white border border-slate-200">
            <FileTypeIcon fileType={doc.fileType} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 truncate max-w-[240px]">{doc.fileName}</h3>
            <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status + confidence */}
        <div className="flex items-center gap-3">
          <StatusBadge status={doc.status} />
          {doc.overallConfidence > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${conf >= 90 ? "bg-green-500" : conf >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${conf}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${conf >= 90 ? "text-green-600" : conf >= 70 ? "text-amber-600" : "text-red-600"}`}>
                {conf}% confidence
              </span>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
          {[
            { label: "Document Type", value: doc.docType || "Auto-detect pending" },
            { label: "Source", value: doc.source === "whatsapp" ? "WhatsApp" : "Manual Upload" },
            { label: "OCR Engine", value: doc.ocrEngine || "None" },
            { label: "File Type", value: doc.fileType },
            { label: "Received", value: new Date(doc.createdAt).toLocaleString("en-GB") },
            ...(doc.processedAt ? [{ label: "Processed", value: new Date(doc.processedAt).toLocaleString("en-GB") }] : []),
            ...(doc.approvedAt ? [{ label: "Approved", value: new Date(doc.approvedAt).toLocaleString("en-GB") }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <span className="text-xs text-slate-700 font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Extracted fields */}
        {doc.fields && doc.fields.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Extracted Fields ({doc.fields.length})
            </p>
            <div className="space-y-2">
              {doc.fields.slice(0, 10).map((field) => (
                <div key={field.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs font-medium text-slate-500 truncate pr-2">{field.label}</span>
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{field.value}</span>
                </div>
              ))}
              {doc.fields.length > 10 && (
                <p className="text-xs text-center text-slate-400">+{doc.fields.length - 10} more fields</p>
              )}
            </div>
          </div>
        )}

        {/* Line items */}
        {doc.lineItems && doc.lineItems.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Line Items ({doc.lineItems.length})
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500">Description</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-500">Qty</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {doc.lineItems.slice(0, 8).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-slate-700 truncate max-w-[180px]">{item.description}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{item.qty}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
        <Link
          href={`/dashboard/review?doc=${doc.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
        >
          <Eye className="w-4 h-4" />
          Review & Edit
        </Link>
        <a
          href={apiUrl(`/api/documents/${doc.id}/download`)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>
    </>
  );
}
