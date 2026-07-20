"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Trash2,
  FileDown,
  CalendarRange,
  Table2,
  Building2,
  UserRound,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import MergeBar from "@/components/dashboard/MergeBar";
import { apiFetch, apiUrl, downloadApiFile, handleUnauthorized } from "@/lib/api";
import type { ProcessedDocument, DocumentStatus, DocType, ExpenseCategory } from "@/lib/types";
import { AiProcessingIndicators, ClassificationConfidenceBadge, DocTypeBadge, DocTypeDropdown } from "@/components/dashboard/DocTypeBadge";
import { deriveFinancialSummary, formatMoney, getClassificationConfidence, resolveDocTypeCode, getDocTypeMeta, getCategoryMeta } from "@/lib/finance";
import type { BatchSummary } from "@/lib/batches";
import {
  annotateDocumentsWithBatches,
  batchDateLabel,
  batchFileReference,
  batchSummaryLine,
  buildBatchSummaries,
  getDocumentBatchId,
  getDocumentBatchLabel,
  getLatestBatch,
} from "@/lib/batches";
import {
  calculateFinancialPeriod,
  dateToInputValue,
  filterDocumentsByDateRange,
  getDocumentUploadDate,
} from "@/lib/periods";
import type { DocumentExportFormat } from "@/lib/financeExport";
import { exportDocuments } from "@/lib/financeExport";

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

function DocumentPreviewFrame({
  doc,
  compact = false,
}: {
  doc: ProcessedDocument;
  compact?: boolean;
}) {
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
          className={`${compact ? "max-h-full max-w-full" : "max-h-full max-w-full rounded-lg shadow-sm"} object-contain`}
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-50 text-center text-slate-400">
      <FileTypeIcon fileType={doc.fileType} large />
      <p className="text-xs font-semibold">Preview unavailable</p>
      {!compact && <p className="max-w-xs text-[11px] text-slate-400">Download the file to inspect this format.</p>}
    </div>
  );
}

function HoverThumbnail({
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
      className="inline-flex max-w-full"
      onMouseEnter={(e) => updatePosition(e.clientX, e.clientY)}
      onMouseMove={(e) => updatePosition(e.clientX, e.clientY)}
      onMouseLeave={() => setPosition(null)}
      onFocus={(e) => updatePosition(e.currentTarget.getBoundingClientRect().right, e.currentTarget.getBoundingClientRect().top)}
      onBlur={() => setPosition(null)}
    >
      {children}
      {position && (
        <div
          className="pointer-events-none fixed z-[80] w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
          style={{ left: position.x, top: position.y }}
        >
          <div className="h-56 border-b border-slate-100 bg-slate-100">
            <DocumentPreviewFrame doc={doc} compact />
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

function getFieldValue(doc: ProcessedDocument, patterns: RegExp[]): string {
  const hit = doc.fields?.find((field) => patterns.some((rx) => rx.test(field.label)));
  return hit?.value || "";
}

function getOptionalString(doc: ProcessedDocument, keys: string[]): string {
  const record = doc as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object" && "name" in value) {
      const name = (value as { name?: unknown }).name;
      if (typeof name === "string" && name.trim()) return name.trim();
    }
  }
  return "";
}

function getCompanyName(doc: ProcessedDocument): string {
  return (
    doc.companyName ||
    getOptionalString(doc, ["company", "company_name", "tenantName", "workspaceName"]) ||
    getFieldValue(doc, [/company/i, /business/i])
  );
}

function getCreatedByName(doc: ProcessedDocument): string {
  return doc.createdByName || doc.createdBy || getOptionalString(doc, ["createdByUser", "uploadedBy", "userName"]);
}

function getPartyName(doc: ProcessedDocument): string {
  const fin = deriveFinancialSummary(doc);
  return (
    fin.counterparty ||
    getOptionalString(doc, ["supplier", "customer", "vendor", "counterparty"]) ||
    getFieldValue(doc, [/supplier/i, /customer/i, /vendor/i, /client/i, /seller/i, /buyer/i])
  );
}

function getDocumentAmount(doc: ProcessedDocument): number {
  const fin = deriveFinancialSummary(doc);
  return fin.grandTotal || fin.subtotal || 0;
}

function parseDateInput(value: string, endOfDay = false): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

function includesText(value: string, needle: string): boolean {
  return value.toLowerCase().includes(needle.trim().toLowerCase());
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

function ExpenseCategoryChip({
  category,
  confidence,
  manual,
}: {
  category?: ExpenseCategory;
  confidence?: number;
  manual?: boolean;
}) {
  if (!category) return null;
  const meta = getCategoryMeta(category);
  const pct = typeof confidence === "number" && confidence > 0
    ? confidence > 1
      ? Math.round(confidence)
      : Math.round(confidence * 100)
    : null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}
      title={`${meta.groupLabel}: ${meta.label}`}
    >
      <span className="truncate">{meta.label}</span>
      <span className="font-medium opacity-70">{manual ? "Manual" : pct ? `AI ${pct}%` : "AI"}</span>
    </span>
  );
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
const TYPE_FILTERS: Array<{ value: "all" | DocType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "sales_invoice", label: "🟢 Sales" },
  { value: "expense_invoice", label: "🔴 Expense" },
  { value: "purchase_order", label: "🟡 Purchase Order" },
  { value: "receipt", label: "🔵 Receipt" },
  { value: "unknown", label: "⚪ Unclassified" },
];
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
type ApprovalFilter = "all" | "approved";
type ExportScope =
  | "all"
  | "latest_batch"
  | "selected_batch"
  | "selected_docs"
  | "custom_date"
  | "current_period";
type CurrentPeriodExport = "current_month" | "current_quarter" | "current_year";

interface AdvancedFilters {
  uploadFrom: string;
  uploadTo: string;
  batchId: string;
  company: string;
  docType: "all" | DocType;
  approval: ApprovalFilter;
  createdBy: string;
  amountMin: string;
  amountMax: string;
  party: string;
}

interface ExportNotice {
  filename: string;
  count: number;
  message?: string;
}

const EMPTY_ADVANCED_FILTERS: AdvancedFilters = {
  uploadFrom: "",
  uploadTo: "",
  batchId: "",
  company: "",
  docType: "all",
  approval: "all",
  createdBy: "",
  amountMin: "",
  amountMax: "",
  party: "",
};

const EXPORT_SCOPES: Array<{ value: ExportScope; label: string; description: string }> = [
  { value: "latest_batch", label: "Latest Upload Batch", description: "Only documents from the most recent upload session." },
  { value: "selected_batch", label: "Selected Batch by Batch ID", description: "Choose a specific Batch ID from the batch list." },
  { value: "selected_docs", label: "Manually Selected Documents", description: "Use the documents currently ticked in the table or grid." },
  { value: "custom_date", label: "Custom Date Range", description: "Export documents uploaded inside a chosen date window." },
  { value: "current_period", label: "Current Month / Quarter / Year", description: "Use the current calendar month, quarter, or year." },
  { value: "all", label: "All Documents", description: "Export the full document list available on this page." },
];

const EXPORT_FORMATS: Array<{ value: DocumentExportFormat; label: string }> = [
  { value: "xlsx", label: "XLSX" },
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
];

// ─── Delete Confirmation Modal ───────────────────────────────────
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-50">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Delete Document</h3>
            <p className="text-sm text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-slate-700 mb-6">
          Are you sure you want to permanently delete <span className="font-semibold text-slate-900">&ldquo;{fileName}&rdquo;</span>?
          This document will be removed from the system and cannot be recovered.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [docs, setDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All Sources");
  const [typeFilter, setTypeFilter] = useState<"all" | DocType>("all");
  const [sort, setSort] = useState<SortValue>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showStatusDd, setShowStatusDd] = useState(false);
  const [showSourceDd, setShowSourceDd] = useState(false);
  const [showTypeDd, setShowTypeDd] = useState(false);
  const [showSortDd, setShowSortDd] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(EMPTY_ADVANCED_FILTERS);
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>("all");
  const [exportFormat, setExportFormat] = useState<DocumentExportFormat>("xlsx");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [currentPeriodExport, setCurrentPeriodExport] = useState<CurrentPeriodExport>("current_month");
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<ExportNotice | null>(null);
  
  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<ProcessedDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /** A document is mergeable once it has been processed (fields available). */
  const isMergeable = (d: ProcessedDocument) =>
    d.status === "review" || d.status === "approved" || (d.fields?.length ?? 0) > 0;

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  useEffect(() => {
    if (docs.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("doc");
    if (!docId) return;
    const found = docs.find((d) => d.id === docId);
    if (found) setSelectedDoc(found);
  }, [docs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batch = params.get("batch");
    if (!batch) return;
    setAdvancedFilters((prev) => ({ ...prev, batchId: batch }));
    setSelectedBatchId(batch);
    setShowAdvancedFilters(true);
  }, []);

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
      const res = await apiFetch(apiUrl("/api/documents?limit=500"), { credentials: "include" });
      if (await handleUnauthorized(res)) return;

      if (res.ok) {
        const data = await res.json();
        setDocs(annotateDocumentsWithBatches(data.documents || []));
      }
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const updateDocType = useCallback(async (docId: string, code: DocType) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, type: code, docTypeCode: code, docTypeManual: true, docType: getDocTypeMeta(code).label, auto_categorized: false }
          : d
      )
    );
    try {
      await apiFetch(apiUrl(`/api/documents/${docId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          docTypeCode: code,
          type: code,
          docTypeManual: true,
          docType: getDocTypeMeta(code).label,
          auto_categorized: false,
        }),
      });
    } catch { /* swallow; UI already updated */ }
  }, []);

  const handleDelete = useCallback(async (doc: ProcessedDocument) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(apiUrl(`/api/documents/${docToDelete.id}`), {
        method: "DELETE",
        credentials: "include",
      });
      
      if (await handleUnauthorized(res)) {
        setIsDeleting(false);
        setDeleteModalOpen(false);
        return;
      }

      if (res.ok) {
        // Remove from local state
        setDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
        setSelectedIds((prev) => prev.filter((id) => id !== docToDelete.id));
        if (selectedDoc?.id === docToDelete.id) {
          setSelectedDoc(null);
        }
        toast.success(`"${docToDelete.fileName}" deleted successfully`);
      } else {
        const error = await res.json();
        console.error("Delete failed:", error);
        toast.error(`Failed to delete document: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document. Please try again.");
    }
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setDocToDelete(null);
  }, [docToDelete, selectedDoc]);

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(() => fetchDocs(), 30000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  const batchSummaries = useMemo(() => buildBatchSummaries(docs), [docs]);
  const selectedDocs = useMemo(
    () => docs.filter((doc) => selectedIds.includes(doc.id)),
    [docs, selectedIds]
  );

  // Filter + sort
  const filtered = useMemo(() => docs
    .filter((d) => {
      const fin = deriveFinancialSummary(d);
      const party = getPartyName(d);
      const company = getCompanyName(d);
      const createdBy = getCreatedByName(d);
      const batchLabel = getDocumentBatchLabel(d);
      const batchId = getDocumentBatchId(d);
      const searchText = [
        d.fileName,
        d.docType,
        getDocTypeMeta(resolveDocTypeCode(d)).label,
        party,
        fin.invoiceNumber,
        batchLabel,
        batchId,
      ]
        .filter(Boolean)
        .join(" ");
      const matchSearch = !search || includesText(searchText, search);
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
      const matchType = typeFilter === "all" || resolveDocTypeCode(d) === typeFilter;
      const advancedType =
        advancedFilters.docType === "all" || resolveDocTypeCode(d) === advancedFilters.docType;
      const approved =
        advancedFilters.approval === "all" || d.status === "approved";
      const uploadDate = getDocumentUploadDate(d);
      const uploadFrom = parseDateInput(advancedFilters.uploadFrom);
      const uploadTo = parseDateInput(advancedFilters.uploadTo, true);
      const matchUploadFrom = !uploadFrom || uploadDate.getTime() >= uploadFrom.getTime();
      const matchUploadTo = !uploadTo || uploadDate.getTime() <= uploadTo.getTime();
      const matchBatch =
        !advancedFilters.batchId ||
        includesText(batchId, advancedFilters.batchId) ||
        includesText(batchLabel, advancedFilters.batchId);
      const matchCompany = !advancedFilters.company || includesText(company, advancedFilters.company);
      const matchCreatedBy = !advancedFilters.createdBy || includesText(createdBy, advancedFilters.createdBy);
      const amount = getDocumentAmount(d);
      const min = advancedFilters.amountMin ? Number(advancedFilters.amountMin) : null;
      const max = advancedFilters.amountMax ? Number(advancedFilters.amountMax) : null;
      const matchMin = min == null || Number.isNaN(min) || amount >= min;
      const matchMax = max == null || Number.isNaN(max) || amount <= max;
      const matchParty = !advancedFilters.party || includesText(party, advancedFilters.party);
      return (
        matchSearch &&
        matchStatus &&
        matchSource &&
        matchType &&
        advancedType &&
        approved &&
        matchUploadFrom &&
        matchUploadTo &&
        matchBatch &&
        matchCompany &&
        matchCreatedBy &&
        matchMin &&
        matchMax &&
        matchParty
      );
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "name_asc") return a.fileName.localeCompare(b.fileName);
      if (sort === "name_desc") return b.fileName.localeCompare(a.fileName);
      const ca = getClassificationConfidence(a) ?? (a.overallConfidence > 1 ? a.overallConfidence : a.overallConfidence * 100);
      const cb = getClassificationConfidence(b) ?? (b.overallConfidence > 1 ? b.overallConfidence : b.overallConfidence * 100);
      if (sort === "conf_asc") return ca - cb;
      if (sort === "conf_desc") return cb - ca;
      return 0;
    }), [advancedFilters, docs, search, sort, sourceFilter, statusFilter, typeFilter]);

  const statsItems = [
    { label: "Total Documents", value: docs.length, color: "text-slate-700", bg: "bg-white" },
    { label: "Needs Review", value: docs.filter((d) => d.status === "review").length, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Approved", value: docs.filter((d) => d.status === "approved").length, color: "text-green-600", bg: "bg-green-50" },
    { label: "Via WhatsApp", value: docs.filter((d) => d.source === "whatsapp").length, color: "text-green-700", bg: "bg-green-50" },
    { label: "Processing", value: docs.filter((d) => ["processing", "structuring", "uploading"].includes(d.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Sort";
  const latestBatch = batchSummaries[0];

  useEffect(() => {
    if (!selectedBatchId && latestBatch) setSelectedBatchId(latestBatch.id);
  }, [latestBatch, selectedBatchId]);

  const updateAdvancedFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    setAdvancedFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All Sources");
    setTypeFilter("all");
    setAdvancedFilters(EMPTY_ADVANCED_FILTERS);
  };

  const openExportPanel = (scope: ExportScope) => {
    setExportScope(scope);
    setLastExport(null);
    if ((scope === "selected_batch" || scope === "latest_batch") && latestBatch) {
      setSelectedBatchId(scope === "latest_batch" ? latestBatch.id : selectedBatchId || latestBatch.id);
    }
    if (scope === "custom_date" && (!exportDateFrom || !exportDateTo)) {
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 13);
      setExportDateFrom(dateToInputValue(from));
      setExportDateTo(dateToInputValue(now));
    }
    setExportPanelOpen(true);
  };

  const documentsForBatch = (batchId: string) =>
    docs.filter((doc) => {
      const id = getDocumentBatchId(doc);
      return id === batchId || getDocumentBatchLabel(doc) === batchId;
    });

  const resolveExportDocs = (): { exportDocs: ProcessedDocument[]; filenameStem: string } => {
    if (exportScope === "latest_batch") {
      const batch = getLatestBatch(docs);
      const exportDocs = batch ? documentsForBatch(batch.id) : [];
      return { exportDocs, filenameStem: `documents-${batchFileReference(batch)}` };
    }

    if (exportScope === "selected_batch") {
      const batch = batchSummaries.find((b) => b.id === selectedBatchId);
      return {
        exportDocs: selectedBatchId ? documentsForBatch(selectedBatchId) : [],
        filenameStem: `documents-${batchFileReference(batch || { id: selectedBatchId, label: selectedBatchId })}`,
      };
    }

    if (exportScope === "selected_docs") {
      return { exportDocs: selectedDocs, filenameStem: "documents-selected" };
    }

    if (exportScope === "custom_date") {
      const from = parseDateInput(exportDateFrom);
      const to = parseDateInput(exportDateTo, true);
      if (!from || !to) return { exportDocs: [], filenameStem: "documents-custom-date" };
      return {
        exportDocs: filterDocumentsByDateRange(docs, { from, to }, "upload"),
        filenameStem: `documents-${exportDateFrom}-to-${exportDateTo}`,
      };
    }

    if (exportScope === "current_period") {
      const period =
        currentPeriodExport === "current_quarter"
          ? "this_quarter"
          : currentPeriodExport === "current_year"
          ? "this_year"
          : "this_month";
      const range = calculateFinancialPeriod(period);
      return {
        exportDocs: filterDocumentsByDateRange(docs, range, "upload"),
        filenameStem: `documents-${currentPeriodExport.replace("_", "-")}`,
      };
    }

    return { exportDocs: docs, filenameStem: "documents-all" };
  };

  const handleExport = async () => {
    const { exportDocs, filenameStem } = resolveExportDocs();
    if (exportDocs.length === 0) {
      setLastExport({
        filename: "",
        count: 0,
        message: "No documents match this export scope.",
      });
      return;
    }

    setExporting(true);
    try {
      const result = await exportDocuments(exportDocs, exportFormat, filenameStem);
      setLastExport(result);
    } finally {
      setExporting(false);
    }
  };

  const activeFilterChips: Array<{ label: string; onClear: () => void }> = [];
  if (search) activeFilterChips.push({ label: `Search: ${search}`, onClear: () => setSearch("") });
  if (typeFilter !== "all") {
    activeFilterChips.push({
      label: `Type: ${getDocTypeMeta(typeFilter).label}`,
      onClear: () => setTypeFilter("all"),
    });
  }
  if (statusFilter !== "All") activeFilterChips.push({ label: `Status: ${statusFilter}`, onClear: () => setStatusFilter("All") });
  if (sourceFilter !== "All Sources") activeFilterChips.push({ label: `Source: ${sourceFilter}`, onClear: () => setSourceFilter("All Sources") });
  if (advancedFilters.uploadFrom || advancedFilters.uploadTo) {
    activeFilterChips.push({
      label: `Upload Date: ${advancedFilters.uploadFrom || "Any"} to ${advancedFilters.uploadTo || "Any"}`,
      onClear: () => setAdvancedFilters((prev) => ({ ...prev, uploadFrom: "", uploadTo: "" })),
    });
  }
  if (advancedFilters.batchId) activeFilterChips.push({ label: `Batch ID: ${advancedFilters.batchId}`, onClear: () => updateAdvancedFilter("batchId", "") });
  if (advancedFilters.company) activeFilterChips.push({ label: `Company: ${advancedFilters.company}`, onClear: () => updateAdvancedFilter("company", "") });
  if (advancedFilters.docType !== "all") {
    activeFilterChips.push({
      label: `Document Type: ${getDocTypeMeta(advancedFilters.docType).label}`,
      onClear: () => updateAdvancedFilter("docType", "all"),
    });
  }
  if (advancedFilters.approval === "approved") activeFilterChips.push({ label: "Status: Approved Only", onClear: () => updateAdvancedFilter("approval", "all") });
  if (advancedFilters.createdBy) activeFilterChips.push({ label: `Created By: ${advancedFilters.createdBy}`, onClear: () => updateAdvancedFilter("createdBy", "") });
  if (advancedFilters.amountMin || advancedFilters.amountMax) {
    activeFilterChips.push({
      label: `Amount: ${advancedFilters.amountMin || "0"} to ${advancedFilters.amountMax || "Any"}`,
      onClear: () => setAdvancedFilters((prev) => ({ ...prev, amountMin: "", amountMax: "" })),
    });
  }
  if (advancedFilters.party) activeFilterChips.push({ label: `Supplier / Customer: ${advancedFilters.party}`, onClear: () => updateAdvancedFilter("party", "") });

  const hasActiveFilters = activeFilterChips.length > 0;

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

          {batchSummaries.length > 0 && (
            <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upload Batches</h3>
                    <p className="text-xs text-slate-500">Filter or export documents by upload session.</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">{batchSummaries.length} batch{batchSummaries.length === 1 ? "" : "es"}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {batchSummaries.slice(0, 6).map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => {
                      setAdvancedFilters((prev) => ({ ...prev, batchId: batch.id }));
                      setSelectedBatchId(batch.id);
                      setShowAdvancedFilters(true);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800">{batch.label}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                        {batch.documentCount} docs
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{batchDateLabel(batch.uploadedAt)}</p>
                    <p className="mt-2 truncate text-[11px] text-slate-400">{batch.fileNames.slice(0, 3).join(", ") || "Documents linked after upload"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

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

            {/* Type filter */}
            <Dropdown
              label={typeFilter === "all" ? "Type" : (TYPE_FILTERS.find((t) => t.value === typeFilter)?.label || "Type")}
              open={showTypeDd}
              setOpen={setShowTypeDd}
              icon={<Filter className="w-4 h-4" />}
            >
              {TYPE_FILTERS.map((opt) => (
                <DropdownItem
                  key={opt.value}
                  active={typeFilter === opt.value}
                  onClick={() => { setTypeFilter(opt.value); setShowTypeDd(false); }}
                >
                  {opt.label}
                </DropdownItem>
              ))}
            </Dropdown>

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

            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-xl border transition whitespace-nowrap ${
                showAdvancedFilters
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ExportButton
              label="Export All Documents"
              onClick={() => openExportPanel("all")}
              icon={<FileDown className="h-4 w-4" />}
            />
            <ExportButton
              label="Export Latest Upload"
              onClick={() => openExportPanel("latest_batch")}
              icon={<Upload className="h-4 w-4" />}
              disabled={!latestBatch}
            />
            <ExportButton
              label="Export Selected Documents"
              onClick={() => openExportPanel("selected_docs")}
              icon={<BadgeCheck className="h-4 w-4" />}
              disabled={selectedIds.length === 0}
              active={selectedIds.length > 0}
              title={selectedIds.length > 0 ? `${selectedIds.length} documents selected` : "Select documents to enable this export"}
            />
            <ExportButton
              label="Export by Date Range"
              onClick={() => openExportPanel("custom_date")}
              icon={<CalendarRange className="h-4 w-4" />}
            />
            <ExportButton
              label="Export Current Period"
              onClick={() => openExportPanel("current_period")}
              icon={<Table2 className="h-4 w-4" />}
            />
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FilterField label="Upload Date" icon={<CalendarRange className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={advancedFilters.uploadFrom}
                        onChange={(e) => updateAdvancedFilter("uploadFrom", e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                        aria-label="Upload date from"
                      />
                      <input
                        type="date"
                        value={advancedFilters.uploadTo}
                        onChange={(e) => updateAdvancedFilter("uploadTo", e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                        aria-label="Upload date to"
                      />
                    </div>
                  </FilterField>
                  <FilterField label="Batch ID" icon={<FolderOpen className="h-4 w-4" />}>
                    <input
                      list="batch-id-options"
                      value={advancedFilters.batchId}
                      onChange={(e) => updateAdvancedFilter("batchId", e.target.value)}
                      placeholder="Batch #001 or batch-001"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <datalist id="batch-id-options">
                      {batchSummaries.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.label}</option>
                      ))}
                    </datalist>
                  </FilterField>
                  <FilterField label="Company" icon={<Building2 className="h-4 w-4" />}>
                    <input
                      value={advancedFilters.company}
                      onChange={(e) => updateAdvancedFilter("company", e.target.value)}
                      placeholder="Company name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </FilterField>
                  <FilterField label="Document Type" icon={<FileText className="h-4 w-4" />}>
                    <select
                      value={advancedFilters.docType}
                      onChange={(e) => updateAdvancedFilter("docType", e.target.value as "all" | DocType)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      {TYPE_FILTERS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </FilterField>
                  <FilterField label="Status" icon={<CheckCircle2 className="h-4 w-4" />}>
                    <select
                      value={advancedFilters.approval}
                      onChange={(e) => updateAdvancedFilter("approval", e.target.value as ApprovalFilter)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="all">All Documents</option>
                      <option value="approved">Approved Only</option>
                    </select>
                  </FilterField>
                  <FilterField label="Created By" icon={<UserRound className="h-4 w-4" />}>
                    <input
                      value={advancedFilters.createdBy}
                      onChange={(e) => updateAdvancedFilter("createdBy", e.target.value)}
                      placeholder="User name"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </FilterField>
                  <FilterField label="Amount Range" icon={<DollarSign className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        value={advancedFilters.amountMin}
                        onChange={(e) => updateAdvancedFilter("amountMin", e.target.value)}
                        placeholder="Min"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        min="0"
                        value={advancedFilters.amountMax}
                        onChange={(e) => updateAdvancedFilter("amountMax", e.target.value)}
                        placeholder="Max"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </FilterField>
                  <FilterField label="Supplier / Customer" icon={<Building2 className="h-4 w-4" />}>
                    <input
                      value={advancedFilters.party}
                      onChange={(e) => updateAdvancedFilter("party", e.target.value)}
                      placeholder="Supplier or customer"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </FilterField>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeFilterChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.onClear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

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
            <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto shadow-sm">
              <table className="w-full text-sm min-w-[1000px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-3 w-10 sticky left-0 bg-slate-50 z-10">
                      <input
                        type="checkbox"
                        aria-label="Select all visible mergeable documents"
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
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Document</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Batch ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">AI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type Confidence</th>
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
                        onDelete={() => handleDelete(doc)}
                        selectable={isMergeable(doc)}
                        selected={selectedIds.includes(doc.id)}
                        onToggleSelect={() => toggleSelected(doc.id)}
                        onChangeType={(code) => updateDocType(doc.id, code)}
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
                    onDelete={() => handleDelete(doc)}
                    selectable={isMergeable(doc)}
                    selected={selectedIds.includes(doc.id)}
                    onToggleSelect={() => toggleSelected(doc.id)}
                    onChangeType={(code) => updateDocType(doc.id, code)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Merge bar */}
          <MergeBar
            selectedIds={selectedIds}
            totalSelectable={filtered.filter(isMergeable).length}
            onSelectAll={() =>
              setSelectedIds(filtered.filter(isMergeable).map((d) => d.id))
            }
            onClear={() => setSelectedIds([])}
            populationLabel="processed documents"
          />
        </main>
      </div>

      <ExportPanel
        open={exportPanelOpen}
        scope={exportScope}
        format={exportFormat}
        batchSummaries={batchSummaries}
        selectedBatchId={selectedBatchId}
        selectedCount={selectedIds.length}
        exportDateFrom={exportDateFrom}
        exportDateTo={exportDateTo}
        currentPeriodExport={currentPeriodExport}
        exporting={exporting}
        lastExport={lastExport}
        onClose={() => setExportPanelOpen(false)}
        onScopeChange={(scope) => setExportScope(scope)}
        onFormatChange={(format) => setExportFormat(format)}
        onSelectedBatchChange={setSelectedBatchId}
        onExportDateFromChange={setExportDateFrom}
        onExportDateToChange={setExportDateTo}
        onCurrentPeriodChange={setCurrentPeriodExport}
        onExport={handleExport}
      />

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
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-6xl bg-white shadow-2xl flex flex-col"
            >
              <DocDetailDrawer 
                doc={selectedDoc} 
                onClose={() => setSelectedDoc(null)}
                onDelete={() => handleDelete(selectedDoc)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && docToDelete && (
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setDocToDelete(null);
            }}
            onConfirm={confirmDelete}
            fileName={docToDelete.fileName}
            isDeleting={isDeleting}
          />
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

function ExportButton({
  label,
  icon,
  onClick,
  disabled,
  active,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function ExportPanel({
  open,
  scope,
  format,
  batchSummaries,
  selectedBatchId,
  selectedCount,
  exportDateFrom,
  exportDateTo,
  currentPeriodExport,
  exporting,
  lastExport,
  onClose,
  onScopeChange,
  onFormatChange,
  onSelectedBatchChange,
  onExportDateFromChange,
  onExportDateToChange,
  onCurrentPeriodChange,
  onExport,
}: {
  open: boolean;
  scope: ExportScope;
  format: DocumentExportFormat;
  batchSummaries: BatchSummary[];
  selectedBatchId: string;
  selectedCount: number;
  exportDateFrom: string;
  exportDateTo: string;
  currentPeriodExport: CurrentPeriodExport;
  exporting: boolean;
  lastExport: ExportNotice | null;
  onClose: () => void;
  onScopeChange: (scope: ExportScope) => void;
  onFormatChange: (format: DocumentExportFormat) => void;
  onSelectedBatchChange: (batchId: string) => void;
  onExportDateFromChange: (value: string) => void;
  onExportDateToChange: (value: string) => void;
  onCurrentPeriodChange: (value: CurrentPeriodExport) => void;
  onExport: () => void;
}) {
  const selectedBatch = batchSummaries.find((batch) => batch.id === selectedBatchId);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Export Documents</h3>
                <p className="mt-1 text-xs text-slate-500">Choose a scope, then download XLSX, CSV, or PDF.</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Scope</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {EXPORT_SCOPES.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onScopeChange(opt.value)}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        scope === opt.value
                          ? "border-primary/30 bg-primary/10"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        {scope === opt.value && <BadgeCheck className="h-4 w-4 text-primary" />}
                        {opt.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {scope === "selected_batch" && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Batch ID
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => onSelectedBatchChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    {batchSummaries.length === 0 ? (
                      <option value="">No batches available</option>
                    ) : (
                      batchSummaries.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batchSummaryLine(batch)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {scope === "latest_batch" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-bold text-emerald-900">
                    {batchSummaries[0] ? batchSummaryLine(batchSummaries[0]) : "No upload batch available"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">Filename will include the batch reference.</p>
                </div>
              )}

              {scope === "selected_docs" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {selectedCount} selected document{selectedCount === 1 ? "" : "s"}
                </div>
              )}

              {scope === "custom_date" && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Custom Date Range</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="date"
                      value={exportDateFrom}
                      onChange={(e) => onExportDateFromChange(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      aria-label="Export date range from"
                    />
                    <input
                      type="date"
                      value={exportDateTo}
                      onChange={(e) => onExportDateToChange(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      aria-label="Export date range to"
                    />
                  </div>
                </div>
              )}

              {scope === "current_period" && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Current Period</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { value: "current_month" as const, label: "Current Month" },
                      { value: "current_quarter" as const, label: "Current Quarter" },
                      { value: "current_year" as const, label: "Current Year" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onCurrentPeriodChange(opt.value)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          currentPeriodExport === opt.value
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Format</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {EXPORT_FORMATS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onFormatChange(opt.value)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                        format === opt.value
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.value === "xlsx" ? <FileSpreadsheet className="h-4 w-4" /> : opt.value === "csv" ? <FileText className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBatch && scope === "selected_batch" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  {selectedBatch.label} includes {selectedBatch.documentCount} document{selectedBatch.documentCount === 1 ? "" : "s"} from {batchDateLabel(selectedBatch.uploadedAt)}.
                </div>
              )}

              {lastExport && (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  lastExport.count > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}>
                  {lastExport.message || `${lastExport.filename} prepared with ${lastExport.count} document${lastExport.count === 1 ? "" : "s"}.`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={onExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:shadow-primary/40 disabled:opacity-60"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export {format.toUpperCase()}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── List Row ────────────────────────────────────────────────────
function ListRow({
  doc,
  index,
  onPreview,
  onDelete,
  selectable,
  selected,
  onToggleSelect,
  onChangeType,
}: {
  doc: ProcessedDocument;
  index: number;
  onPreview: () => void;
  onDelete: () => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onChangeType: (code: DocType) => void;
}) {
  const conf = getClassificationConfidence(doc);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={`group hover:bg-slate-50/80 transition-colors ${selected ? "bg-primary/5" : ""}`}
    >
      <td className="px-3 py-3.5 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10">
        {selectable ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
            aria-label={`Select ${doc.fileName}`}
          />
        ) : (
          <span className="inline-block w-4" />
        )}
      </td>
      <td className="px-5 py-3.5">
        <HoverThumbnail doc={doc}>
          <div className="flex min-w-0 items-center gap-3">
            <FileTypeIcon fileType={doc.fileType} />
            <div className="min-w-0">
              <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">{doc.fileName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  <Eye className="h-3 w-3" />
                  Hover preview
                </span>
              </div>
            </div>
          </div>
        </HoverThumbnail>
      </td>
      <td className="px-4 py-3.5 relative overflow-visible">
        <div onClick={(e) => e.stopPropagation()}>
          <DocTypeDropdown
            value={resolveDocTypeCode(doc)}
            onChange={onChangeType}
            size="sm"
          />
          {doc.docTypeManual && (
            <span className="ml-1.5 text-[9px] font-medium text-slate-400 uppercase tracking-wide">
              manual
            </span>
          )}
        </div>
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
        {getDocumentBatchId(doc) ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <FolderOpen className="h-3 w-3" />
            {getDocumentBatchLabel(doc)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Unbatched</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={doc.status} />
      </td>
      <td className="px-4 py-3.5">
        <AiProcessingIndicators doc={doc} />
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
            href={apiUrl(`/api/documents/${doc.id}/excel`)} onClick={(e) => { e.preventDefault(); void downloadApiFile(apiUrl(`/api/documents/${doc.id}/excel`)); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Grid Card ───────────────────────────────────────────────────
function GridCard({
  doc,
  index,
  onPreview,
  onDelete,
  selectable,
  selected,
  onToggleSelect,
  onChangeType,
}: {
  doc: ProcessedDocument;
  index: number;
  onPreview: () => void;
  onDelete: () => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onChangeType: (code: DocType) => void;
}) {
  const conf = getClassificationConfidence(doc);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      className={`relative bg-white rounded-2xl border p-4 hover:shadow-md transition-all group cursor-pointer ${selected ? "border-primary shadow-md" : "border-slate-100 hover:border-slate-200"
        }`}
      onClick={onPreview}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${doc.fileName}`}
          className="absolute top-3 left-3 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
      )}
      <div className="mb-3 flex items-start justify-between">
        <HoverThumbnail doc={doc}>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <FileTypeIcon fileType={doc.fileType} large />
          </div>
        </HoverThumbnail>
        {doc.source === "whatsapp" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <MessageSquare className="w-3 h-3" /> WA
          </span>
        )}
      </div>
      <HoverThumbnail doc={doc}>
        <p className="mb-1 max-w-full truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
      </HoverThumbnail>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
          <Eye className="h-3 w-3" />
          Hover preview
        </span>
        {getDocumentBatchId(doc) && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {getDocumentBatchLabel(doc)}
          </span>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()} className="mb-2">
        <DocTypeDropdown
          value={resolveDocTypeCode(doc)}
          onChange={onChangeType}
          size="sm"
        />
      </div>
      <ClassificationConfidenceBadge doc={doc} className="mb-3" />
      {doc.expenseCategory && (
        <div className="mb-3">
          <ExpenseCategoryChip
            category={doc.expenseCategory}
            confidence={doc.expenseCategoryConfidence}
            manual={doc.expenseCategoryManual}
          />
        </div>
      )}
      <AiProcessingIndicators doc={doc} className="mb-3" />
      <div className="flex items-center justify-between">
        <StatusBadge status={doc.status} />
        {conf !== null && (
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
            href={apiUrl(`/api/documents/${doc.id}/excel`)}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); void downloadApiFile(apiUrl(`/api/documents/${doc.id}/excel`)); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail Drawer ───────────────────────────────────────────────
function DocDetailDrawer({ doc, onClose, onDelete }: { doc: ProcessedDocument; onClose: () => void; onDelete: () => void }) {
  const suggestedType = resolveDocTypeCode(doc);
  const conf = getClassificationConfidence(doc);
  const extractionConf = doc.overallConfidence > 1 ? Math.round(doc.overallConfidence) : Math.round(doc.overallConfidence * 100);
  const financial = deriveFinancialSummary(doc);
  const amount = getDocumentAmount(doc);
  const previewUrl = apiUrl(`/api/documents/${doc.id}/preview`);

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
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <DocTypeBadge code={suggestedType} />
              <ClassificationConfidenceBadge doc={doc} />
              <ExpenseCategoryChip
                category={doc.expenseCategory}
                confidence={doc.expenseCategoryConfidence}
                manual={doc.expenseCategoryManual}
              />
              <AiProcessingIndicators doc={doc} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:overflow-hidden">
        <section className="border-b border-slate-200 p-4 lg:h-full lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Original Document</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{doc.fileType}</p>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
          <div className="h-[52vh] min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-9.5rem)]">
            <DocumentPreviewFrame doc={doc} />
          </div>
        </section>

        <section className="space-y-5 bg-white p-5 lg:h-full lg:overflow-y-auto">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Suggested Document Type</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DocTypeBadge code={suggestedType} />
                  <StatusBadge status={doc.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">AI Confidence</p>
                <p className={`mt-1 text-2xl font-black tabular-nums ${conf === null ? "text-slate-400" : conf >= 95 ? "text-emerald-600" : conf >= 70 ? "text-amber-600" : "text-red-600"}`}>
                  {conf === null ? "--" : `${conf}%`}
                </p>
              </div>
            </div>
            {conf !== null && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${conf >= 95 ? "bg-emerald-500" : conf >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${conf}%` }}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 p-4 space-y-2.5">
            {[
              { label: "Suggested Type", value: getDocTypeMeta(suggestedType).label },
              ...(conf !== null ? [{ label: "Type Confidence", value: `${conf}%` }] : []),
              ...(doc.overallConfidence > 0 ? [{ label: "OCR / Extraction Confidence", value: `${extractionConf}%` }] : []),
              { label: "Batch ID", value: getDocumentBatchId(doc) ? getDocumentBatchLabel(doc) : "Unbatched" },
              { label: "Source", value: doc.source === "whatsapp" ? "WhatsApp" : "Manual Upload" },
              ...(getCompanyName(doc) ? [{ label: "Company", value: getCompanyName(doc) }] : []),
              ...(getCreatedByName(doc) ? [{ label: "Created By", value: getCreatedByName(doc) }] : []),
              ...(amount > 0 ? [{ label: "Amount", value: formatMoney(amount, financial.currency) }] : []),
              { label: "OCR Engine", value: doc.ocrEngine || "None" },
              { label: "File Type", value: doc.fileType },
              { label: "Received", value: new Date(doc.createdAt).toLocaleString("en-GB") },
              ...(doc.processedAt ? [{ label: "Processed", value: new Date(doc.processedAt).toLocaleString("en-GB") }] : []),
              ...(doc.approvedAt ? [{ label: "Approved", value: new Date(doc.approvedAt).toLocaleString("en-GB") }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span className="truncate text-right text-xs font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>

          {doc.fields && doc.fields.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                OCR Extracted Data ({doc.fields.length})
              </p>
              <div className="space-y-2">
                {doc.fields.slice(0, 12).map((field) => (
                  <div key={field.id} className="grid grid-cols-[minmax(96px,0.8fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="truncate text-xs font-medium text-slate-500">{field.label}</span>
                    <span className="truncate text-xs font-semibold text-slate-800" title={field.value}>{field.value || "--"}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                      {Math.round(field.confidence)}%
                    </span>
                  </div>
                ))}
                {doc.fields.length > 12 && (
                  <p className="text-xs text-center text-slate-400">+{doc.fields.length - 12} more fields</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-500">No OCR fields available yet</p>
            </div>
          )}

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
        </section>
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
          href={apiUrl(`/api/documents/${doc.id}/excel`)} onClick={(e) => { e.preventDefault(); void downloadApiFile(apiUrl(`/api/documents/${doc.id}/excel`)); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </>
  );
}
