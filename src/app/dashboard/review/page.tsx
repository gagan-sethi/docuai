"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileText, CheckCircle2, XCircle, Clock, Edit3, Download, Copy,
  AlertTriangle, ChevronRight, Save, Loader2, Upload, Search,
  RefreshCw, Filter, Eye, ShieldCheck, ShieldX, ZoomIn, ZoomOut,
  RotateCw, Maximize2, PanelLeftClose, PanelLeftOpen, Image as ImageIcon,
  ArrowLeft, LayoutDashboard, Sparkles,
} from "lucide-react";
import type { ProcessedDocument, ExtractedField, LineItem, DocType, ExpenseCategory } from "@/lib/types";
import { apiFetch, apiUrl } from "@/lib/api";
import { AiProcessingIndicators, ClassificationConfidenceBadge, DocTypeBadge, DocTypeDropdown } from "@/components/dashboard/DocTypeBadge";
import {
  EXPENSE_CATEGORY_GROUPS,
  deriveFinancialSummary,
  formatMoney,
  getCategoryMeta,
  getDocTypeMeta,
  normalizeExpenseCategory,
  resolveDocTypeCode,
} from "@/lib/finance";

interface Toast { id: number; message: string; type: "success" | "error" | "info"; }
let toastCounter = 0;

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm cursor-pointer ${t.type === "success" ? "bg-green-600/90 text-white" : t.type === "error" ? "bg-red-600/90 text-white" : "bg-indigo-600/90 text-white"}`}
            onClick={() => dismiss(t.id)}>
            {t.type === "success" && <CheckCircle2 className="h-4 w-4" />}
            {t.type === "error" && <XCircle className="h-4 w-4" />}
            {t.type === "info" && <Eye className="h-4 w-4" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    review: { icon: <Clock className="h-3 w-3" />, label: "Needs Review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    approved: { icon: <CheckCircle2 className="h-3 w-3" />, label: "Approved", cls: "bg-green-100 text-green-700 border-green-200" },
    rejected: { icon: <XCircle className="h-3 w-3" />, label: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" },
    processing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Processing", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    structuring: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Structuring", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    uploading: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Uploading", cls: "bg-gray-100 text-gray-600 border-gray-200" },
    uploaded: { icon: <Clock className="h-3 w-3" />, label: "Uploaded", cls: "bg-gray-100 text-gray-600 border-gray-200" },
    error: { icon: <AlertTriangle className="h-3 w-3" />, label: "Failed", cls: "bg-red-100 text-red-700 border-red-200" },
    failed: { icon: <AlertTriangle className="h-3 w-3" />, label: "Failed", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = cfg[status] || cfg.review;
  return (<span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.icon} {c.label}</span>);
}

/**
 * A confidence score only means something when the model actually returned a
 * value. Empty fields were showing "80%" next to nothing at all (HB-06, Oct
 * 2026 QA review), which read as "we are 80% sure this field is blank".
 * Pass the field's value so an empty one shows a dash instead.
 */
function ConfidenceBadge({ value, fieldValue }: { value: number; fieldValue?: string }) {
  const isEmpty = fieldValue !== undefined && String(fieldValue).trim() === "";
  if (isEmpty) {
    return (
      <span
        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400"
        title="Nothing was extracted for this field"
      >
        —
      </span>
    );
  }

  const pct = value > 1 ? Math.round(value) : Math.round(value * 100);
  const cls = pct >= 90 ? "bg-green-100 text-green-700" : pct >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{pct}%</span>;
}

function CategoryBadge({
  category,
  confidence,
  manual,
}: {
  category?: ExpenseCategory;
  confidence?: number;
  manual?: boolean;
}) {
  if (!category) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
        Uncategorized
      </span>
    );
  }
  const meta = getCategoryMeta(category);
  const pct = typeof confidence === "number" && confidence > 0
    ? confidence > 1
      ? Math.round(confidence)
      : Math.round(confidence * 100)
    : null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
      <span>{meta.label}</span>
      <span className="text-[10px] font-medium opacity-70">
        {manual ? "Manual" : pct ? `AI ${pct}%` : "AI"}
      </span>
    </span>
  );
}

function DocumentPreview({ docId, fileType, fileName }: { docId: string; fileType: string; fileName: string }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewUrl = `/api/documents/${docId}/preview`;
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!loading || previewError) return;

    const frame = window.requestAnimationFrame(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setLoading(false);
      }
    });

    const fallback = window.setTimeout(() => {
      const image = imageRef.current;
      if (isPdf || (image?.complete && image.naturalWidth > 0)) {
        setLoading(false);
      }
    }, 3500);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, [docId, isPdf, loading, previewError]);

  if (previewError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"><ImageIcon className="h-8 w-8 text-gray-400" /></div>
          <p className="mt-4 text-sm font-medium text-gray-600">Preview not available</p>
          <p className="mt-1 text-xs text-gray-400">The file could not be loaded.</p>
          <button onClick={() => { setPreviewError(false); setLoading(true); }} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"><RefreshCw className="h-3 w-3" /> Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-indigo-500" /><span className="text-xs font-semibold text-gray-700">Original Document</span></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(z - 25, 25))} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="min-w-[2.5rem] text-center text-[10px] font-medium text-gray-500">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(z + 25, 300))} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
          <div className="mx-0.5 h-4 w-px bg-gray-200" />
          <button onClick={() => setRotation((r) => (r + 90) % 360)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Rotate"><RotateCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => { setZoom(100); setRotation(0); }} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition" title="Reset"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="relative flex-1 overflow-auto bg-gradient-to-b from-gray-100 to-gray-200">
        <div className="h-full w-full">
          {loading && (<div className="absolute inset-0 flex items-center justify-center z-10"><div className="flex flex-col items-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm px-6 py-4 shadow-sm"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /><span className="text-xs text-gray-500">Loading preview...</span></div></div>)}
          {isPdf ? (
            <iframe key={docId} src={`${previewUrl}#toolbar=0&navpanes=0`} className="w-full h-full bg-white border-0" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: "top center", transition: "transform 0.2s ease" }} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setPreviewError(true); }} title={`Preview: ${fileName}`} />
          ) : isImage ? (
            <div className="flex items-start justify-center p-4 min-h-full">
            {/* Authenticated previews cannot use the public Next image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={docId} ref={imageRef} src={previewUrl} alt={`Preview: ${fileName}`} className="max-w-full rounded-lg shadow-lg bg-white border border-gray-300" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: "top center", transition: "transform 0.2s ease" }} onLoad={() => setLoading(false)} onLoadCapture={() => setLoading(false)} onError={() => { setLoading(false); setPreviewError(true); }} draggable={false} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 rounded-xl bg-white shadow-sm"><FileText className="h-16 w-16 text-gray-300" /><p className="text-sm text-gray-500">Preview not supported for {fileType}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("id") || searchParams.get("doc");
  const filterParam = searchParams.get("filter") || searchParams.get("status");

  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [serverStats, setServerStats] = useState<{
    total?: number;
    review?: number;
    approved?: number;
    errors?: number;
    processing?: number;
  } | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [editingLineItems, setEditingLineItems] = useState<Record<string, Record<string, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (filterParam === "errors" || filterParam === "failed") return "errors";
    if (filterParam && ["review", "approved", "processing"].includes(filterParam)) return filterParam;
    return "all";
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(50);
  const [recoveryDocType, setRecoveryDocType] = useState<DocType>("expense_invoice");
  const [recoveryCategory, setRecoveryCategory] = useState<string>("other");
  const [recoveryCounterparty, setRecoveryCounterparty] = useState("");
  const [recoveryInvoiceNumber, setRecoveryInvoiceNumber] = useState("");
  const [recoveryDate, setRecoveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recoveryCurrency, setRecoveryCurrency] = useState("AED");
  const [recoverySubtotal, setRecoverySubtotal] = useState("");
  const [recoveryVatRate, setRecoveryVatRate] = useState("5");
  const [recoveryVatAmount, setRecoveryVatAmount] = useState("");
  const [recoveryGrandTotal, setRecoveryGrandTotal] = useState("");
  const [recoveryDescription, setRecoveryDescription] = useState("");
  const initialSelectDone = useRef(false);
  const isDragging = useRef(false);

  useEffect(() => {
    if (filterParam === "errors" || filterParam === "failed") {
      setStatusFilter("errors");
    } else if (filterParam && ["review", "approved", "processing", "all"].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [filterParam]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => { const id = ++toastCounter; setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), type === "error" ? 6000 : 3500); }, []);
  const dismissToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const currentDoc = useMemo(() => documents.find((d) => d.id === selectedDocId) ?? null, [documents, selectedDocId]);

  // R3-24: Derive category suggestion based on previous approvals/edits for the same supplier
  const supplierHistoryCategory = useMemo(() => {
    if (!currentDoc) return null;
    const currentSupplier = (
      currentDoc.financial?.counterparty ||
      currentDoc.fields?.find(f => /supplier|vendor|counterparty|seller/i.test(f.label))?.value ||
      ""
    ).toLowerCase().trim();
    if (!currentSupplier) return null;

    const categoryCounts: Record<string, number> = {};
    for (const d of documents) {
      if (d.id === currentDoc.id) continue;
      const dSupplier = (
        d.financial?.counterparty ||
        d.fields?.find(f => /supplier|vendor|counterparty|seller/i.test(f.label))?.value ||
        ""
      ).toLowerCase().trim();
      if (!dSupplier) continue;

      const isMatch = dSupplier === currentSupplier ||
        (dSupplier.length >= 3 && currentSupplier.includes(dSupplier)) ||
        (currentSupplier.length >= 3 && dSupplier.includes(currentSupplier));

      if (isMatch) {
        const cat = normalizeExpenseCategory(d.expenseCategory);
        if (cat && cat !== "uncategorized") {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + (d.expenseCategoryManual ? 3 : 1);
        }
      }
    }

    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? (sorted[0][0] as ExpenseCategory) : null;
  }, [currentDoc, documents]);

  const recoverySupplierHistoryCategory = useMemo(() => {
    const trimmed = recoveryCounterparty.toLowerCase().trim();
    if (!trimmed) return null;

    const categoryCounts: Record<string, number> = {};
    for (const d of documents) {
      const dSupplier = (
        d.financial?.counterparty ||
        d.fields?.find(f => /supplier|vendor|counterparty|seller/i.test(f.label))?.value ||
        ""
      ).toLowerCase().trim();
      if (!dSupplier) continue;

      const isMatch = dSupplier === trimmed ||
        (dSupplier.length >= 3 && trimmed.includes(dSupplier)) ||
        (trimmed.length >= 3 && dSupplier.includes(trimmed));

      if (isMatch) {
        const cat = normalizeExpenseCategory(d.expenseCategory);
        if (cat && cat !== "uncategorized") {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + (d.expenseCategoryManual ? 3 : 1);
        }
      }
    }

    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? (sorted[0][0] as ExpenseCategory) : null;
  }, [recoveryCounterparty, documents]);
  const filteredDocs = useMemo(() => documents.filter((doc) => {
    const ms = !searchQuery || doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || doc.docType?.toLowerCase().includes(searchQuery.toLowerCase());
    const mf = statusFilter === "all" ||
      (statusFilter === "errors" && doc.status === "error") ||
      doc.status === statusFilter;
    return ms && mf;
  }), [documents, searchQuery, statusFilter]);
  const hasProcessingDocs = useMemo(() => documents.some((d) => ["uploading", "uploaded", "processing", "structuring"].includes(d.status)), [documents]);
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length };
    documents.forEach((d) => {
      if (d.status === "error") c.errors = (c.errors || 0) + 1;
      else c[d.status] = (c[d.status] || 0) + 1;
    });
    return c;
  }, [documents]);
  const isEditable = currentDoc?.status === "review";

  const lastProcessedUrlDocId = useRef<string | null>(null);
  const initialMountDone = useRef(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await apiFetch(apiUrl("/api/documents?limit=1000"), { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents ?? []);
      if (data.stats) {
        setServerStats(data.stats);
      }
      if (typeof data.total === "number") {
        setServerTotal(data.total);
      }
    } catch {
      /* retry */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Sync selectedDocId when URL query param changes from external navigation or initial load
  useEffect(() => {
    if (documents.length === 0) return;

    if (highlightId && highlightId !== lastProcessedUrlDocId.current) {
      lastProcessedUrlDocId.current = highlightId;
      const target = documents.find((d) => d.id === highlightId);
      if (target) {
        setSelectedDocId(highlightId);
        if (statusFilter !== "all" && target.status !== statusFilter) {
          setStatusFilter("all");
        }
        return;
      }
    }

    if (!initialMountDone.current && !selectedDocId) {
      initialMountDone.current = true;
      const targetList = filteredDocs.length > 0 ? filteredDocs : documents;
      const f = targetList.find((d) =>
        statusFilter === "errors"
          ? d.status === "error"
          : d.status === "review"
      ) ?? targetList[0];
      const defaultId = f?.id ?? documents[0]?.id ?? null;
      if (defaultId) {
        setSelectedDocId(defaultId);
        lastProcessedUrlDocId.current = defaultId;
      }
    }
  }, [highlightId, documents, selectedDocId, statusFilter, filteredDocs]);

  useEffect(() => { const ms = hasProcessingDocs ? 3000 : 10000; const t = setInterval(fetchDocuments, ms); return () => clearInterval(t); }, [fetchDocuments, hasProcessingDocs]);

  const selectDocument = useCallback((docId: string | null) => {
    setIsEditing(false);
    setSelectedDocId(docId);
    lastProcessedUrlDocId.current = docId;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (docId) {
        url.searchParams.set("doc", docId);
      } else {
        url.searchParams.delete("doc");
      }
      url.searchParams.delete("id");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const navigateToDocument = useCallback((docId: string) => {
    setShowDuplicateConfirm(false);
    setIsEditing(false);
    lastProcessedUrlDocId.current = docId;
    const target = documents.find((d) => d.id === docId);
    if (target) {
      if (statusFilter !== "all" && target.status !== statusFilter) {
        setStatusFilter("all");
      }
      setSelectedDocId(docId);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("doc", docId);
        url.searchParams.delete("id");
        window.history.replaceState(null, "", url.toString());
      }
    } else {
      window.location.href = `/dashboard/review?doc=${docId}`;
    }
  }, [documents, statusFilter]);

  const handleMouseDown = useCallback(() => { isDragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }, []);
  useEffect(() => { const onMove = (e: MouseEvent) => { if (!isDragging.current) return; const el = document.getElementById("split-container"); if (!el) return; const rect = el.getBoundingClientRect(); setPreviewWidth(Math.max(25, Math.min(75, ((e.clientX - rect.left) / rect.width) * 100))); }; const onUp = () => { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; }; window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp); return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }; }, []);

  useEffect(() => {
    if (!currentDoc) return;
    const docCode = resolveDocTypeCode(currentDoc);
    setRecoveryDocType(docCode === "unknown" ? "expense_invoice" : docCode);
    const initialCategory = (currentDoc.expenseCategory && currentDoc.expenseCategory !== "uncategorized")
      ? currentDoc.expenseCategory
      : (supplierHistoryCategory || currentDoc.expenseCategory || "office_supplies");
    setRecoveryCategory(initialCategory);
    setRecoveryCounterparty(currentDoc.financial?.counterparty || "");
    setRecoveryInvoiceNumber(currentDoc.financial?.invoiceNumber || "");
    setRecoveryDate(currentDoc.financial?.invoiceDate || new Date().toISOString().slice(0, 10));
    setRecoveryCurrency(currentDoc.financial?.currency || "AED");
    setRecoverySubtotal(currentDoc.financial?.subtotal ? String(currentDoc.financial.subtotal) : "");
    setRecoveryVatRate(currentDoc.financial?.vatRate !== undefined ? String(currentDoc.financial.vatRate) : "5");
    setRecoveryVatAmount(currentDoc.financial?.vatAmount ? String(currentDoc.financial.vatAmount) : "");
    setRecoveryGrandTotal(currentDoc.financial?.grandTotal ? String(currentDoc.financial.grandTotal) : "");
    setRecoveryDescription("");
  }, [currentDoc]);

  const handleRecoverySubtotalChange = (val: string) => {
    setRecoverySubtotal(val);
    const sub = parseFloat(val);
    const rate = parseFloat(recoveryVatRate) || 0;
    if (!isNaN(sub)) {
      const vat = Math.round(sub * (rate / 100) * 100) / 100;
      const total = Math.round((sub + vat) * 100) / 100;
      setRecoveryVatAmount(vat.toFixed(2));
      setRecoveryGrandTotal(total.toFixed(2));
    }
  };

  const handleRecoveryVatRateChange = (val: string) => {
    setRecoveryVatRate(val);
    const sub = parseFloat(recoverySubtotal);
    const rate = parseFloat(val) || 0;
    if (!isNaN(sub)) {
      const vat = Math.round(sub * (rate / 100) * 100) / 100;
      const total = Math.round((sub + vat) * 100) / 100;
      setRecoveryVatAmount(vat.toFixed(2));
      setRecoveryGrandTotal(total.toFixed(2));
    }
  };

  const submitManualRecovery = useCallback(async (targetStatus: "review" | "approved") => {
    if (!currentDoc) return;
    const sub = parseFloat(recoverySubtotal) || 0;
    const vat = parseFloat(recoveryVatAmount) || 0;
    const total = parseFloat(recoveryGrandTotal) || (sub + vat);

    if (total <= 0 && targetStatus === "approved") {
      addToast("Grand total must be greater than zero to approve", "error");
      return;
    }

    setActionLoading(true);
    try {
      const isExpense = recoveryDocType === "expense_invoice" || recoveryDocType === "receipt";
      const counterpartyKey = isExpense ? "supplier_name" : "customer_name";

      const syntheticFields: ExtractedField[] = [
        { id: "invoice_number", label: "Invoice Number", value: recoveryInvoiceNumber, confidence: 100, edited: true },
        { id: "invoice_date", label: "Invoice Date", value: recoveryDate, confidence: 100, edited: true },
        { id: counterpartyKey, label: isExpense ? "Supplier Name" : "Customer Name", value: recoveryCounterparty, confidence: 100, edited: true },
        { id: "subtotal", label: "Subtotal", value: sub.toFixed(2), confidence: 100, edited: true },
        { id: "tax_amount", label: "VAT Amount", value: vat.toFixed(2), confidence: 100, edited: true },
        { id: "total_amount", label: "Grand Total", value: total.toFixed(2), confidence: 100, edited: true },
      ];

      const syntheticLineItems: LineItem[] = [
        {
          id: `li_${Date.now()}`,
          code: "MANUAL",
          description: recoveryDescription || `${getDocTypeMeta(recoveryDocType).label} (Manual Entry)`,
          qty: 1,
          unitPrice: sub.toFixed(2),
          total: sub.toFixed(2),
          confidence: 100,
        },
      ];

      const payload: Record<string, any> = {
        status: targetStatus,
        docTypeCode: recoveryDocType,
        type: recoveryDocType,
        docType: getDocTypeMeta(recoveryDocType).label,
        docTypeManual: true,
        expenseCategory: isExpense ? recoveryCategory : undefined,
        expenseCategoryManual: isExpense,
        isManuallyEdited: true,
        fields: syntheticFields,
        lineItems: syntheticLineItems,
        financial: {
          currency: recoveryCurrency,
          subtotal: sub,
          vatRate: parseFloat(recoveryVatRate) || 0,
          vatAmount: vat,
          grandTotal: total,
          counterparty: recoveryCounterparty,
          invoiceNumber: recoveryInvoiceNumber,
          invoiceDate: recoveryDate,
          reconciliation: {
            isValid: true,
            difference: 0,
            tolerance: 0.05,
            issues: [],
          },
        },
        error: null,
      };

      const res = await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to recover document");
      }

      addToast(targetStatus === "approved" ? `"${currentDoc.fileName}" recovered and approved` : `"${currentDoc.fileName}" recovered to review queue`);
      await fetchDocuments();
    } catch (e: any) {
      addToast(e?.message || "Failed to recover document", "error");
    } finally {
      setActionLoading(false);
    }
  }, [
    currentDoc,
    recoveryDocType,
    recoveryCategory,
    recoveryCounterparty,
    recoveryInvoiceNumber,
    recoveryDate,
    recoveryCurrency,
    recoverySubtotal,
    recoveryVatRate,
    recoveryVatAmount,
    recoveryGrandTotal,
    recoveryDescription,
    addToast,
    fetchDocuments,
  ]);

  const startEditing = useCallback(() => { if (!currentDoc || !isEditable) return; const fm: Record<string, string> = {}; currentDoc.fields.forEach((f) => (fm[f.id] = f.value)); setEditingFields(fm); const im: Record<string, Record<string, string>> = {}; currentDoc.lineItems.forEach((li) => { im[li.id] = { code: li.code, description: li.description, qty: String(li.qty), unitPrice: li.unitPrice, total: li.total }; }); setEditingLineItems(im); setIsEditing(true); }, [currentDoc, isEditable]);

  const saveEdits = useCallback(async () => {
    if (!currentDoc) return; setActionLoading(true);
    try {
      const uf: ExtractedField[] = currentDoc.fields.map((f) => ({ ...f, value: editingFields[f.id] ?? f.value, edited: (editingFields[f.id] ?? f.value) !== f.value || f.edited }));
      const ui: LineItem[] = currentDoc.lineItems.map((li) => {
        const e = editingLineItems[li.id];
        if (!e) return li;
        const parsedQuantity = Number(e.qty);
        return {
          ...li,
          code: e.code ?? li.code,
          description: e.description ?? li.description,
          qty: Number.isFinite(parsedQuantity) ? parsedQuantity : li.qty,
          unitPrice: e.unitPrice ?? li.unitPrice,
          total: e.total ?? li.total,
        };
      });
      const res = await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ fields: uf, lineItems: ui }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      setIsEditing(false);
      addToast("Changes saved");
      await fetchDocuments();
    } catch (e: any) {
      addToast(e?.message || "Failed to save", "error");
    } finally {
      setActionLoading(false);
    }
  }, [currentDoc, editingFields, editingLineItems, addToast, fetchDocuments]);

  const approveDocument = useCallback(async (opts?: { dismissDuplicate?: boolean }) => {
    if (!currentDoc) return;

    // If the document is flagged as a duplicate and user hasn't explicitly chosen to bypass,
    // open the resolution modal so the user can choose to approve anyway or reject.
    if (currentDoc.duplicateOf && !opts?.dismissDuplicate) {
      setShowDuplicateConfirm(true);
      return;
    }

    setShowDuplicateConfirm(false);
    setActionLoading(true);
    try {
      const payload: Record<string, any> = { status: "approved" };
      if (opts?.dismissDuplicate || currentDoc.duplicateOf) {
        payload.dismissDuplicate = true;
      }

      const res = await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to approve");
      }
      addToast(`"${currentDoc.fileName}" approved`);
      setIsEditing(false);
      const rem = documents.filter((d) => d.status === "review" && d.id !== currentDoc.id);
      selectDocument(rem[0]?.id ?? null);
      await fetchDocuments();
    } catch (e: any) {
      addToast(e?.message || "Failed to approve", "error");
    } finally {
      setActionLoading(false);
    }
  }, [currentDoc, documents, addToast, fetchDocuments, selectDocument]);

  const dismissDuplicateWarning = useCallback(async () => {
    if (!currentDoc) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dismissDuplicate: true, duplicateOf: null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to dismiss duplicate");
      }
      addToast("Duplicate warning resolved. Document can now be approved.");
      await fetchDocuments();
    } catch (e: any) {
      addToast(e?.message || "Failed to dismiss duplicate warning", "error");
    } finally {
      setActionLoading(false);
    }
  }, [currentDoc, addToast, fetchDocuments]);

  const rejectDocument = useCallback(async () => {
    if (!currentDoc) return;
    setShowRejectConfirm(false);
    setShowDuplicateConfirm(false);
    setActionLoading(true);
    try {
      const res = await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reject");
      }
      addToast(`"${currentDoc.fileName}" rejected`);
      setIsEditing(false);
      const rem = documents.filter((d) => d.status === "review" && d.id !== currentDoc.id);
      selectDocument(rem[0]?.id ?? null);
      await fetchDocuments();
    } catch (e: any) {
      addToast(e?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(false);
    }
  }, [currentDoc, documents, addToast, fetchDocuments, selectDocument]);

  const copyJson = useCallback(() => { if (!currentDoc) return; navigator.clipboard.writeText(JSON.stringify({ fields: currentDoc.fields, lineItems: currentDoc.lineItems }, null, 2)); addToast("Copied JSON", "info"); }, [currentDoc, addToast]);

  const updateDocType = useCallback(async (code: DocType) => {
    if (!currentDoc) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === currentDoc.id
          ? { ...d, type: code, docTypeCode: code, docTypeManual: true, docType: getDocTypeMeta(code).label, auto_categorized: false }
          : d
      )
    );
    try {
      await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: code,
          docTypeCode: code,
          docTypeManual: true,
          docType: getDocTypeMeta(code).label,
          auto_categorized: false,
        }),
      });
      addToast(`Type set to ${getDocTypeMeta(code).label}`);
    } catch {
      addToast("Failed to update type", "error");
    }
  }, [currentDoc, addToast]);

  const updateExpenseCategory = useCallback(async (cat: ExpenseCategory, successMessage?: string) => {
    if (!currentDoc) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === currentDoc.id
          ? { ...d, expenseCategory: cat, expenseCategoryConfidence: 100, expenseCategoryManual: true }
          : d
      )
    );
    try {
      await apiFetch(apiUrl(`/api/documents/${currentDoc.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expenseCategory: cat, expenseCategoryConfidence: 100, expenseCategoryManual: true }),
      });
      addToast(successMessage || `Category set to ${getCategoryMeta(cat).label}`);
    } catch {
      addToast("Failed to update category", "error");
    }
  }, [currentDoc, addToast]);

  const approveExpenseCategory = useCallback(() => {
    const category = normalizeExpenseCategory(currentDoc?.expenseCategory);
    if (!category) return;
    void updateExpenseCategory(category, "AI category suggestion approved");
  }, [currentDoc?.expenseCategory, updateExpenseCategory]);

  const downloadExcel = useCallback(async () => {
    if (!currentDoc) return;
    try { const res = await apiFetch(apiUrl(`/api/documents/${currentDoc.id}/excel`), { credentials: "include" }); if (!res.ok) throw new Error(); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${currentDoc.fileName.replace(/\.[^.]+$/, "")}_data.csv`; a.click(); URL.revokeObjectURL(url); addToast("Excel downloaded"); }
    catch { addToast("Failed to download", "error"); }
  }, [currentDoc, addToast]);

  const filterTabs = [{ key: "all", label: "All" }, { key: "review", label: "Review" }, { key: "approved", label: "Approved" }, { key: "processing", label: "Processing" }, { key: "errors", label: "Failed" }];

  if (loading) return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><p className="text-gray-500">Loading documents...</p></div></div>);

  if (documents.length === 0) return (<div className="flex h-[80vh] items-center justify-center"><div className="text-center"><FileText className="mx-auto h-16 w-16 text-gray-300" /><h2 className="mt-4 text-xl font-semibold text-gray-700">No documents yet</h2><p className="mt-2 text-gray-500">Upload a document to get started</p><a href="/dashboard/upload" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"><Upload className="h-4 w-4" /> Upload Document</a></div></div>);

  const renderManualRecoveryForm = () => {
    if (!currentDoc) return null;
    const isExpense = recoveryDocType === "expense_invoice" || recoveryDocType === "receipt";

    return (
      <div className="p-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-900 text-sm">Automated Extraction Incomplete</h3>
              <p className="text-red-800/90 mt-1">
                {currentDoc.error || "The AI extractor encountered an issue reading this document."}
              </p>
              <p className="text-red-700/80 mt-1 font-medium">
                Recover this document below by verifying details from the preview on the left. Recovering does not consume extra upload quota.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Manual entry card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Manual Entry Recovery Form</h2>
              <p className="text-xs text-gray-500">Inspect the document preview on the left to input the required accounting figures.</p>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
              Recovery Mode
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Document Type */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Document Type *</label>
              <select
                value={recoveryDocType}
                onChange={(e) => setRecoveryDocType(e.target.value as DocType)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="expense_invoice">Expense Invoice (Supplier Bill)</option>
                <option value="sales_invoice">Sales Invoice (Customer Invoice)</option>
                <option value="receipt">Receipt</option>
                <option value="purchase_order">Purchase Order</option>
              </select>
            </div>

            {/* Expense Category (if expense) */}
            {isExpense && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-gray-700">Expense Category</label>
                  {recoverySupplierHistoryCategory && recoveryCategory !== recoverySupplierHistoryCategory && (
                    <button
                      type="button"
                      onClick={() => setRecoveryCategory(recoverySupplierHistoryCategory)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Sparkles className="h-3 w-3" />
                      Suggest: {getCategoryMeta(recoverySupplierHistoryCategory).label}
                    </button>
                  )}
                </div>
                <select
                  value={recoveryCategory}
                  onChange={(e) => setRecoveryCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  {recoverySupplierHistoryCategory && (
                    <optgroup label="Suggested (Supplier History)">
                      <option value={recoverySupplierHistoryCategory}>
                        ★ {getCategoryMeta(recoverySupplierHistoryCategory).label} (Historical)
                      </option>
                    </optgroup>
                  )}
                  {EXPENSE_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.value} label={group.label}>
                      {group.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {/* Counterparty */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {isExpense ? "Supplier / Vendor Name *" : "Customer Name *"}
              </label>
              <input
                type="text"
                placeholder={isExpense ? "e.g. Amazon Web Services, Horizen Tech" : "e.g. Acme Corp"}
                value={recoveryCounterparty}
                onChange={(e) => setRecoveryCounterparty(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Invoice / Document Number *</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-001"
                value={recoveryInvoiceNumber}
                onChange={(e) => setRecoveryInvoiceNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Invoice Date *</label>
              <input
                type="date"
                value={recoveryDate}
                onChange={(e) => setRecoveryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Currency *</label>
              <select
                value={recoveryCurrency}
                onChange={(e) => setRecoveryCurrency(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="AED">AED - UAE Dirham</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </div>

          {/* Financial Amounts with auto calculation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wide">Financial Figures</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-medium text-gray-600 mb-1">Subtotal ({recoveryCurrency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recoverySubtotal}
                  onChange={(e) => handleRecoverySubtotalChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-600 mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={recoveryVatRate}
                  onChange={(e) => handleRecoveryVatRateChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-600 mb-1">VAT Amount ({recoveryCurrency})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recoveryVatAmount}
                  onChange={(e) => {
                    setRecoveryVatAmount(e.target.value);
                    const sub = parseFloat(recoverySubtotal) || 0;
                    const vat = parseFloat(e.target.value) || 0;
                    setRecoveryGrandTotal((sub + vat).toFixed(2));
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-600 mb-1">Grand Total ({recoveryCurrency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recoveryGrandTotal}
                  onChange={(e) => setRecoveryGrandTotal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Description / Line Item Summary (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Software subscription, Office supplies"
              value={recoveryDescription}
              onChange={(e) => setRecoveryDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Submission CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
            <a
              href="/dashboard/upload"
              className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center gap-1"
            >
              <Upload className="h-3.5 w-3.5" /> Re-upload file instead
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => submitManualRecovery("review")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition shadow-sm disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save to Review Queue
              </button>

              <button
                type="button"
                onClick={() => submitManualRecovery("approved")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition shadow-sm disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Save &amp; Approve
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderExtractedData = () => {
    if (!currentDoc) return null;
    const code = resolveDocTypeCode(currentDoc);
    const meta = getDocTypeMeta(code);
    const fin = deriveFinancialSummary(currentDoc);
    const isExpenseLike = code === "expense_invoice" || code === "receipt";
    const selectedExpenseCategory = normalizeExpenseCategory(currentDoc.expenseCategory);
    const showApproveExpenseSuggestion =
      isExpenseLike &&
      Boolean(selectedExpenseCategory) &&
      !currentDoc.expenseCategoryManual &&
      isEditable;
    return (
      <div className="p-5 space-y-5">
        {/* Duplicate invoice warning banner */}
        {currentDoc.duplicateOf && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm text-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-amber-900 text-sm">Potential Duplicate Invoice Detected</h3>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">Warning</span>
                </div>
                <p className="text-amber-800/90 mt-1">
                  {currentDoc.duplicateReason || "This document has the same supplier, invoice number, or file content as an existing document in your workspace."}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToDocument(currentDoc.duplicateOf!)}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                  >
                    View Original Document &rarr;
                  </button>
                  {isEditable && (
                    <button
                      onClick={dismissDuplicateWarning}
                      disabled={actionLoading}
                      className="rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 transition disabled:opacity-60"
                    >
                      Not a duplicate (Confirm & Allow Approval)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Financial summary card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Financial Summary</h2>
              <p className="text-[10px] text-gray-500">
                {meta.affectsFinancials
                  ? code === "sales_invoice"
                    ? "Counts toward Revenue + VAT Collected"
                    : "Counts toward Expenses + VAT Paid"
                  : "Procurement tracking — no financial impact"}
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              {fin.currency}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Subtotal</p>
              <p className="font-semibold tabular-nums text-slate-900">{formatMoney(fin.subtotal, fin.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">VAT ({fin.vatRate || 0}%)</p>
              <p className="font-semibold tabular-nums text-slate-900">{formatMoney(fin.vatAmount, fin.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Grand Total</p>
              <p className="font-semibold tabular-nums text-slate-900">{formatMoney(fin.grandTotal, fin.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                {code === "sales_invoice" ? "Customer" : "Supplier"}
              </p>
              <p className="font-medium text-slate-700 truncate" title={fin.counterparty}>
                {fin.counterparty || "—"}
              </p>
            </div>
          </div>
          {isExpenseLike && (
            <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  {currentDoc.expenseCategoryManual ? "Approved Category" : "AI Suggested Category"}
                </p>
                <CategoryBadge
                  category={currentDoc.expenseCategory}
                  confidence={currentDoc.expenseCategoryConfidence}
                  manual={currentDoc.expenseCategoryManual}
                />
                {currentDoc.expenseCategory && (
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {getCategoryMeta(currentDoc.expenseCategory).groupLabel}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {showApproveExpenseSuggestion && selectedExpenseCategory && (
                  <button
                    type="button"
                    onClick={approveExpenseCategory}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve suggestion
                  </button>
                )}
                {supplierHistoryCategory && selectedExpenseCategory !== supplierHistoryCategory && isEditable && (
                  <button
                    type="button"
                    onClick={() => void updateExpenseCategory(supplierHistoryCategory, `Category set to ${getCategoryMeta(supplierHistoryCategory).label} from supplier history`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    title={`Supplier history suggests ${getCategoryMeta(supplierHistoryCategory).label}`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Apply {getCategoryMeta(supplierHistoryCategory).label}
                  </button>
                )}
                <select
                  value={selectedExpenseCategory ?? ""}
                  onChange={(e) => {
                    const nextCategory = normalizeExpenseCategory(e.target.value);
                    if (nextCategory) void updateExpenseCategory(nextCategory);
                  }}
                  disabled={!isEditable}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                >
                  <option value="">Select category…</option>
                  {supplierHistoryCategory && (
                    <optgroup label="Suggested (Supplier History)">
                      <option value={supplierHistoryCategory}>
                        ★ {getCategoryMeta(supplierHistoryCategory).label} (Historical)
                      </option>
                    </optgroup>
                  )}
                  {EXPENSE_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.value} label={group.label}>
                      {group.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          )}
        </motion.div>

        {currentDoc.fields.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-gray-900">Extracted Fields</h2><p className="text-[10px] text-gray-500">{currentDoc.fields.length} fields extracted</p></div><FileText className="h-4 w-4 text-gray-300" /></div>
            <div className="divide-y divide-gray-100">
              {currentDoc.fields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition">
                  <div className="w-2/5 min-w-0 flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-gray-600">{field.label}</span>
                    {field.edited && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 border border-amber-200">
                        <Edit3 className="h-2 w-2" />
                        manual
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">{isEditing ? (<input type="text" value={editingFields[field.id] ?? field.value} onChange={(e) => setEditingFields((p) => ({ ...p, [field.id]: e.target.value }))} className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />) : (<span className="text-sm text-gray-900 break-words">{field.value}</span>)}</div>
                  <ConfidenceBadge value={field.confidence} fieldValue={field.value} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Audit trail summary */}
        {currentDoc.editHistory && currentDoc.editHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
            <div className="border-b border-amber-200/80 px-4 py-2.5 bg-amber-100/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-700" />
                <h3 className="text-xs font-bold text-amber-900">Manual Edit Audit Trail ({currentDoc.editHistory.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                View Full Log &rarr;
              </button>
            </div>
            <div className="divide-y divide-amber-200/50 text-xs">
              {currentDoc.editHistory.slice(-3).reverse().map((entry, idx) => (
                <div key={idx} className="px-4 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-800">{entry.field}: </span>
                    <span className="line-through text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-200 text-[11px]">{entry.oldValue || "<empty>"}</span>
                    <span className="text-gray-400 mx-1">&rarr;</span>
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 text-[11px]">{entry.newValue || "<empty>"}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 whitespace-nowrap">
                    {entry.editedByName || "User"} &middot; {new Date(entry.editedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {currentDoc.lineItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3"><h2 className="text-sm font-semibold text-gray-900">Line Items</h2><p className="text-[10px] text-gray-500">{currentDoc.lineItems.length} items</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 bg-gray-50"><th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Code</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Description</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qty</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Unit Price</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Total</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Conf.</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {currentDoc.lineItems.map((item) => { const ei = editingLineItems[item.id]; return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2">{isEditing ? <input type="text" value={ei?.code ?? item.code} onChange={(e) => setEditingLineItems((p) => ({ ...p, [item.id]: { ...p[item.id], code: e.target.value } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" /> : <span className="font-mono text-xs text-gray-700">{item.code}</span>}</td>
                      <td className="px-3 py-2">{isEditing ? <input type="text" value={ei?.description ?? item.description} onChange={(e) => setEditingLineItems((p) => ({ ...p, [item.id]: { ...p[item.id], description: e.target.value } }))} className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none" /> : <span className="text-xs text-gray-900">{item.description}</span>}</td>
                      <td className="px-3 py-2 text-right">{isEditing ? <input type="text" value={ei?.qty ?? String(item.qty)} onChange={(e) => setEditingLineItems((p) => ({ ...p, [item.id]: { ...p[item.id], qty: e.target.value } }))} className="w-16 rounded border border-gray-300 px-2 py-1 text-right text-xs focus:border-indigo-400 focus:outline-none" /> : <span className="text-xs text-gray-700">{item.qty}</span>}</td>
                      <td className="px-3 py-2 text-right">{isEditing ? <input type="text" value={ei?.unitPrice ?? item.unitPrice} onChange={(e) => setEditingLineItems((p) => ({ ...p, [item.id]: { ...p[item.id], unitPrice: e.target.value } }))} className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-xs focus:border-indigo-400 focus:outline-none" /> : <span className="text-xs text-gray-700">{item.unitPrice}</span>}</td>
                      <td className="px-3 py-2 text-right">{isEditing ? <input type="text" value={ei?.total ?? item.total} onChange={(e) => setEditingLineItems((p) => ({ ...p, [item.id]: { ...p[item.id], total: e.target.value } }))} className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-xs focus:border-indigo-400 focus:outline-none" /> : <span className="text-xs font-medium text-gray-900">{item.total}</span>}</td>
                      <td className="px-3 py-2 text-right"><ConfidenceBadge value={item.confidence} /></td>
                    </tr>); })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {currentDoc.fields.length === 0 && currentDoc.lineItems.length === 0 && (<div className="rounded-xl border border-gray-200 bg-white p-8 text-center"><FileText className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">No extracted data available.</p></div>)}
        {isEditable && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-600">Ready to finalize?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowRejectConfirm(true)} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-60"><XCircle className="h-3.5 w-3.5" /> Reject</button>
              <button onClick={() => approveDocument()} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition disabled:opacity-60">{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve</button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="border-b border-gray-200 p-3">
            <Link
              href="/dashboard"
              className="group mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md ring-1 ring-indigo-500/30 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <LayoutDashboard className="h-4 w-4" />
              <span className="tracking-wide">Back to Dashboard</span>
            </Link>
            <h2 className="text-base font-bold text-gray-900">Documents</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {serverTotal ?? documents.length} total &middot; {serverStats?.review ?? statusCounts.review ?? 0} need review
            </p>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {filterTabs.map((tab) => {
                const count =
                  tab.key === "all"
                    ? (serverTotal ?? documents.length)
                    : tab.key === "review"
                    ? (serverStats?.review ?? statusCounts.review ?? 0)
                    : tab.key === "approved"
                    ? (serverStats?.approved ?? statusCounts.approved ?? 0)
                    : tab.key === "processing"
                    ? (serverStats?.processing ?? statusCounts.processing ?? 0)
                    : tab.key === "errors"
                    ? (serverStats?.errors ?? statusCounts.errors ?? 0)
                    : (statusCounts[tab.key] ?? 0);

                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                      statusFilter === tab.key
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                    {count > 0 ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredDocs.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400"><Filter className="mx-auto h-6 w-6 mb-2" />No documents match</div>) : filteredDocs.map((doc) => (
              <button key={doc.id} onClick={() => selectDocument(doc.id)} className={`w-full border-b border-gray-100 p-3 text-left transition hover:bg-gray-50 ${selectedDocId === doc.id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""}`}>
                <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><p className="truncate text-xs font-medium text-gray-900">{doc.fileName}</p><p className="mt-0.5 text-[10px] text-gray-500">{doc.docType || "Unknown"} &middot; {(doc.fileSize / 1024).toFixed(0)} KB</p></div><ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition ${selectedDocId === doc.id ? "text-indigo-600" : ""}`} /></div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={doc.status} />
                  {doc.duplicateOf && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                      <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                      Duplicate
                    </span>
                  )}
                  <ClassificationConfidenceBadge doc={doc} compact />
                  {doc.overallConfidence > 0 && <ConfidenceBadge value={doc.overallConfidence} />}
                </div>
              </button>))}
          </div>
          <div className="border-t border-gray-200 p-2.5"><a href="/dashboard/upload" className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"><Upload className="h-3.5 w-3.5" /> Upload New</a></div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {!currentDoc ? (
            <div className="flex h-full items-center justify-center"><div className="text-center"><FileText className="mx-auto h-16 w-16 text-gray-300" /><h3 className="mt-4 text-lg font-semibold text-gray-600">Select a document</h3><p className="mt-1 text-sm text-gray-400">Choose a document from the sidebar to review</p></div></div>
          ) : ["uploading", "uploaded", "processing", "structuring"].includes(currentDoc.status) ? (
            <div className="flex h-full items-center justify-center"><div className="text-center max-w-sm"><Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" /><h3 className="mt-4 text-lg font-semibold text-gray-700">Processing Document</h3><p className="mt-1 text-sm text-gray-500">{currentDoc.fileName} is being processed...</p><div className="mt-4 h-2 w-64 mx-auto rounded-full bg-gray-200 overflow-hidden"><motion.div className="h-full bg-indigo-600 rounded-full" initial={{ width: "10%" }} animate={{ width: "80%" }} transition={{ duration: 8, ease: "easeOut" }} /></div><div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400"><RefreshCw className="h-3 w-3 animate-spin" /> Auto-refreshing...</div></div></div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 truncate">{currentDoc.fileName}</h1>
                    <DocTypeBadge code={resolveDocTypeCode(currentDoc)} />
                    <StatusBadge status={currentDoc.status} />
                    {currentDoc.status === "error" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 border border-red-300">
                        <AlertTriangle className="h-2.5 w-2.5 text-red-600" />
                        Manual Recovery Mode
                      </span>
                    )}
                    {currentDoc.isManuallyEdited && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-300">
                        <Edit3 className="h-2.5 w-2.5 text-amber-700" />
                        Edited Manually
                      </span>
                    )}
                    {!isEditable && currentDoc.status !== "error" && (currentDoc.status === "approved" || currentDoc.status === "rejected") && (<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 border border-gray-200">{currentDoc.status === "approved" ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />} Read-only</span>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentDoc.editHistory && currentDoc.editHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAuditModal(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition shadow-sm"
                        title="View manual edit audit trail"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Audit Trail ({currentDoc.editHistory.length})
                      </button>
                    )}
                    <button onClick={() => setShowPreview((p) => !p)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${showPreview ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}>{showPreview ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{showPreview ? " Hide Preview" : " Show Preview"}</span><span className="sm:hidden">{showPreview ? " Hide" : " Preview"}</span></button>
                    {currentDoc.status !== "error" && (
                      <>
                        <button onClick={copyJson} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"><Copy className="h-3.5 w-3.5" /> JSON</button>
                        {(currentDoc.fields.length > 0 || currentDoc.lineItems.length > 0) && (<button onClick={downloadExcel} className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"><Download className="h-3.5 w-3.5" /> Excel</button>)}
                        {isEditable && (isEditing ? (<button onClick={saveEdits} disabled={actionLoading} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition disabled:opacity-60">{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>) : (<button onClick={startEditing} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition"><Edit3 className="h-3.5 w-3.5" /> Edit</button>))}
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <DocTypeDropdown
                    value={resolveDocTypeCode(currentDoc)}
                    onChange={updateDocType}
                    disabled={!isEditable}
                    size="sm"
                  />
                  <ClassificationConfidenceBadge doc={currentDoc} />
                  {currentDoc.docTypeManual && (
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">manual</span>
                  )}
                  <span>&middot;</span>
                  <span>Confidence:</span> <ConfidenceBadge value={currentDoc.overallConfidence} />
                  {currentDoc.ocrEngine && <><span>&middot;</span><span className="capitalize">{currentDoc.ocrEngine} OCR</span></>}
                  <span>&middot;</span><span>Updated {new Date(currentDoc.updatedAt).toLocaleString()}</span>
                </div>
                <AiProcessingIndicators doc={currentDoc} className="mt-2" />
              </div>
              <div id="split-container" className="flex-1 flex overflow-hidden">
                {showPreview && (<>
                  <div className="flex-shrink-0 overflow-hidden border-r border-gray-200" style={{ width: `${previewWidth}%` }}><DocumentPreview key={currentDoc.id} docId={currentDoc.id} fileType={currentDoc.fileType} fileName={currentDoc.fileName} /></div>
                  <div className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 transition-colors relative group" onMouseDown={handleMouseDown}><div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 z-10" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><div className="h-1 w-1 rounded-full bg-white" /><div className="h-1 w-1 rounded-full bg-white" /><div className="h-1 w-1 rounded-full bg-white" /></div></div>
                </>)}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  {currentDoc.status === "error" ? renderManualRecoveryForm() : renderExtractedData()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showDuplicateConfirm && currentDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDuplicateConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-amber-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900">Potential Duplicate Document</h3>
                  <p className="mt-1 text-xs text-amber-800">
                    {currentDoc.duplicateReason || "This document appears to match an existing invoice or file already in your workspace."}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-xs text-gray-700 space-y-2">
                <p>
                  Approving this document will record its figures into your <strong>Finance, P&amp;L, and Tax reports</strong>. If this document was already processed, approving it again will lead to double-counting.
                </p>
                {currentDoc.duplicateOf && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => navigateToDocument(currentDoc.duplicateOf!)}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 underline text-xs cursor-pointer"
                    >
                      Compare with original document &rarr;
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={() => approveDocument({ dismissDuplicate: true })}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Approve as Separate Document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicateConfirm(false);
                    rejectDocument();
                  }}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                >
                  Reject as Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => setShowDuplicateConfirm(false)}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAuditModal && currentDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowAuditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Manual Edit Audit Trail</h3>
                    <p className="text-xs text-gray-500">{currentDoc.fileName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {(!currentDoc.editHistory || currentDoc.editHistory.length === 0) ? (
                  <p className="text-center text-sm text-gray-500 py-8">No manual edits recorded on this document.</p>
                ) : (
                  [...currentDoc.editHistory].reverse().map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                        <span className="font-semibold text-gray-900">{item.field}</span>
                        <span>{new Date(item.editedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                        <span className="line-through text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 truncate max-w-[200px]" title={item.oldValue || "<empty>"}>
                          {item.oldValue || "<empty>"}
                        </span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[200px]" title={item.newValue || "<empty>"}>
                          {item.newValue || "<empty>"}
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-500">
                        Edited by: <span className="font-medium text-gray-700">{item.editedByName || "User"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 px-6 py-3 flex justify-end bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showRejectConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><h3 className="text-lg font-semibold text-gray-900">Reject Document?</h3><p className="text-sm text-gray-500">This action can be undone later.</p></div></div>
              <p className="mt-4 text-sm text-gray-600">Are you sure you want to reject <span className="font-medium">&ldquo;{currentDoc?.fileName}&rdquo;</span>?</p>
              <div className="mt-6 flex justify-end gap-3"><button onClick={() => setShowRejectConfirm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button><button onClick={rejectDocument} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition">Reject</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </>
  );
}

function ReviewPageFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-500">Loading review…</p>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageFallback />}>
      <ReviewPageContent />
    </Suspense>
  );
}
