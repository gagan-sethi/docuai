"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, XCircle, Clock, Edit3, Download, Copy,
  AlertTriangle, ChevronRight, Save, Loader2, Upload, Search,
  RefreshCw, Filter, Eye, ShieldCheck, ShieldX, ZoomIn, ZoomOut,
  RotateCw, Maximize2, PanelLeftClose, PanelLeftOpen, Image as ImageIcon,
} from "lucide-react";
import type { ProcessedDocument, ExtractedField, LineItem } from "@/lib/types";

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
    error: { icon: <AlertTriangle className="h-3 w-3" />, label: "Error", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = cfg[status] || cfg.review;
  return (<span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.icon} {c.label}</span>);
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = value > 1 ? Math.round(value) : Math.round(value * 100);
  const cls = pct >= 90 ? "bg-green-100 text-green-700" : pct >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{pct}%</span>;
}

function DocumentPreview({ docId, fileType, fileName }: { docId: string; fileType: string; fileName: string }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(true);
  const previewUrl = `/api/documents/${docId}/preview`;
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  useEffect(() => { setPreviewError(false); setLoading(true); setZoom(100); setRotation(0); }, [docId]);

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
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="w-full h-full bg-white border-0" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: "top center", transition: "transform 0.2s ease" }} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setPreviewError(true); }} title={`Preview: ${fileName}`} />
          ) : isImage ? (
            <div className="flex items-start justify-center p-4 min-h-full">
            <img src={previewUrl} alt={`Preview: ${fileName}`} className="max-w-full rounded-lg shadow-lg bg-white border border-gray-300" style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: "top center", transition: "transform 0.2s ease" }} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setPreviewError(true); }} draggable={false} />
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
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [editingLineItems, setEditingLineItems] = useState<Record<string, Record<string, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(50);
  const initialSelectDone = useRef(false);
  const isDragging = useRef(false);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => { const id = ++toastCounter; setToasts((p) => [...p, { id, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500); }, []);
  const dismissToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const currentDoc = useMemo(() => documents.find((d) => d.id === selectedDocId) ?? null, [documents, selectedDocId]);
  const filteredDocs = useMemo(() => documents.filter((doc) => { const ms = !searchQuery || doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || doc.docType?.toLowerCase().includes(searchQuery.toLowerCase()); const mf = statusFilter === "all" || (statusFilter === "errors" && doc.status === "error") || doc.status === statusFilter; return ms && mf; }), [documents, searchQuery, statusFilter]);
  const hasProcessingDocs = useMemo(() => documents.some((d) => ["uploading", "uploaded", "processing", "structuring"].includes(d.status)), [documents]);
  const statusCounts = useMemo(() => { const c: Record<string, number> = { all: documents.length }; documents.forEach((d) => { if (d.status === "error") c.errors = (c.errors || 0) + 1; else c[d.status] = (c[d.status] || 0) + 1; }); return c; }, [documents]);
  const isEditable = currentDoc?.status === "review";

  const fetchDocuments = useCallback(async () => { try { const res = await fetch("/api/documents"); if (!res.ok) throw new Error(); const data = await res.json(); setDocuments(data.documents ?? []); } catch { /* retry */ } finally { setLoading(false); } }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { if (initialSelectDone.current || documents.length === 0) return; initialSelectDone.current = true; if (highlightId && documents.find((d) => d.id === highlightId)) setSelectedDocId(highlightId); else { const f = documents.find((d) => d.status === "review"); setSelectedDocId(f?.id ?? documents[0]?.id ?? null); } }, [documents, highlightId]);
  useEffect(() => { const ms = hasProcessingDocs ? 3000 : 10000; const t = setInterval(fetchDocuments, ms); return () => clearInterval(t); }, [fetchDocuments, hasProcessingDocs]);

  const handleMouseDown = useCallback(() => { isDragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }, []);
  useEffect(() => { const onMove = (e: MouseEvent) => { if (!isDragging.current) return; const el = document.getElementById("split-container"); if (!el) return; const rect = el.getBoundingClientRect(); setPreviewWidth(Math.max(25, Math.min(75, ((e.clientX - rect.left) / rect.width) * 100))); }; const onUp = () => { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; }; window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp); return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }; }, []);

  const startEditing = useCallback(() => { if (!currentDoc || !isEditable) return; const fm: Record<string, string> = {}; currentDoc.fields.forEach((f) => (fm[f.id] = f.value)); setEditingFields(fm); const im: Record<string, Record<string, string>> = {}; currentDoc.lineItems.forEach((li) => { im[li.id] = { code: li.code, description: li.description, qty: String(li.qty), unitPrice: li.unitPrice, total: li.total }; }); setEditingLineItems(im); setIsEditing(true); }, [currentDoc, isEditable]);

  const saveEdits = useCallback(async () => {
    if (!currentDoc) return; setActionLoading(true);
    try {
      const uf: ExtractedField[] = currentDoc.fields.map((f) => ({ ...f, value: editingFields[f.id] ?? f.value, edited: (editingFields[f.id] ?? f.value) !== f.value || f.edited }));
      const ui: LineItem[] = currentDoc.lineItems.map((li) => { const e = editingLineItems[li.id]; if (!e) return li; return { ...li, code: e.code ?? li.code, description: e.description ?? li.description, qty: Number(e.qty) || li.qty, unitPrice: e.unitPrice ?? li.unitPrice, total: e.total ?? li.total }; });
      const res = await fetch(`/api/documents/${currentDoc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: uf, lineItems: ui }) });
      if (!res.ok) throw new Error(); setIsEditing(false); addToast("Changes saved"); await fetchDocuments();
    } catch { addToast("Failed to save", "error"); } finally { setActionLoading(false); }
  }, [currentDoc, editingFields, editingLineItems, addToast, fetchDocuments]);

  const approveDocument = useCallback(async () => {
    if (!currentDoc) return; setActionLoading(true);
    try { const res = await fetch(`/api/documents/${currentDoc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) }); if (!res.ok) throw new Error(); addToast(`"${currentDoc.fileName}" approved`); setIsEditing(false); const rem = documents.filter((d) => d.status === "review" && d.id !== currentDoc.id); setSelectedDocId(rem[0]?.id ?? null); await fetchDocuments(); }
    catch { addToast("Failed to approve", "error"); } finally { setActionLoading(false); }
  }, [currentDoc, documents, addToast, fetchDocuments]);

  const rejectDocument = useCallback(async () => {
    if (!currentDoc) return; setShowRejectConfirm(false); setActionLoading(true);
    try { const res = await fetch(`/api/documents/${currentDoc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) }); if (!res.ok) throw new Error(); addToast(`"${currentDoc.fileName}" rejected`); setIsEditing(false); const rem = documents.filter((d) => d.status === "review" && d.id !== currentDoc.id); setSelectedDocId(rem[0]?.id ?? null); await fetchDocuments(); }
    catch { addToast("Failed to reject", "error"); } finally { setActionLoading(false); }
  }, [currentDoc, documents, addToast, fetchDocuments]);

  const copyJson = useCallback(() => { if (!currentDoc) return; navigator.clipboard.writeText(JSON.stringify({ fields: currentDoc.fields, lineItems: currentDoc.lineItems }, null, 2)); addToast("Copied JSON", "info"); }, [currentDoc, addToast]);

  const downloadExcel = useCallback(async () => {
    if (!currentDoc) return;
    try { const res = await fetch(`/api/documents/${currentDoc.id}/excel`); if (!res.ok) throw new Error(); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${currentDoc.fileName.replace(/\.[^.]+$/, "")}_data.csv`; a.click(); URL.revokeObjectURL(url); addToast("Excel downloaded"); }
    catch { addToast("Failed to download", "error"); }
  }, [currentDoc, addToast]);

  const filterTabs = [{ key: "all", label: "All" }, { key: "review", label: "Review" }, { key: "approved", label: "Approved" }, { key: "processing", label: "Processing" }, { key: "errors", label: "Errors" }];

  if (loading) return (<div className="flex h-[80vh] items-center justify-center"><div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><p className="text-gray-500">Loading documents...</p></div></div>);

  if (documents.length === 0) return (<div className="flex h-[80vh] items-center justify-center"><div className="text-center"><FileText className="mx-auto h-16 w-16 text-gray-300" /><h2 className="mt-4 text-xl font-semibold text-gray-700">No documents yet</h2><p className="mt-2 text-gray-500">Upload a document to get started</p><a href="/dashboard/upload" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"><Upload className="h-4 w-4" /> Upload Document</a></div></div>);

  const renderExtractedData = () => {
    if (!currentDoc) return null;
    return (
      <div className="p-5 space-y-5">
        {currentDoc.fields.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-gray-900">Extracted Fields</h2><p className="text-[10px] text-gray-500">{currentDoc.fields.length} fields extracted</p></div><FileText className="h-4 w-4 text-gray-300" /></div>
            <div className="divide-y divide-gray-100">
              {currentDoc.fields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition">
                  <div className="w-2/5 min-w-0"><span className="text-xs font-medium text-gray-600">{field.label}</span>{field.edited && <span className="ml-1.5 text-[10px] text-amber-600 font-medium">(edited)</span>}</div>
                  <div className="flex-1 min-w-0">{isEditing ? (<input type="text" value={editingFields[field.id] ?? field.value} onChange={(e) => setEditingFields((p) => ({ ...p, [field.id]: e.target.value }))} className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />) : (<span className="text-sm text-gray-900 break-words">{field.value}</span>)}</div>
                  <ConfidenceBadge value={field.confidence} />
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
              <button onClick={approveDocument} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition disabled:opacity-60">{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve</button>
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
            <h2 className="text-base font-bold text-gray-900">Documents</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">{documents.length} total &middot; {statusCounts.review || 0} need review</p>
            <div className="relative mt-2"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>
            <div className="mt-2 flex gap-1 overflow-x-auto">{filterTabs.map((tab) => (<button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium transition ${statusFilter === tab.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{tab.label}{statusCounts[tab.key] ? ` (${statusCounts[tab.key]})` : ""}</button>))}</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredDocs.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400"><Filter className="mx-auto h-6 w-6 mb-2" />No documents match</div>) : filteredDocs.map((doc) => (
              <button key={doc.id} onClick={() => { setSelectedDocId(doc.id); setIsEditing(false); }} className={`w-full border-b border-gray-100 p-3 text-left transition hover:bg-gray-50 ${selectedDocId === doc.id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""}`}>
                <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><p className="truncate text-xs font-medium text-gray-900">{doc.fileName}</p><p className="mt-0.5 text-[10px] text-gray-500">{doc.docType || "Unknown"} &middot; {(doc.fileSize / 1024).toFixed(0)} KB</p></div><ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition ${selectedDocId === doc.id ? "text-indigo-600" : ""}`} /></div>
                <div className="mt-1.5 flex items-center gap-1.5"><StatusBadge status={doc.status} />{doc.overallConfidence > 0 && <ConfidenceBadge value={doc.overallConfidence} />}</div>
              </button>))}
          </div>
          <div className="border-t border-gray-200 p-2.5"><a href="/dashboard/upload" className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"><Upload className="h-3.5 w-3.5" /> Upload New</a></div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {!currentDoc ? (
            <div className="flex h-full items-center justify-center"><div className="text-center"><FileText className="mx-auto h-16 w-16 text-gray-300" /><h3 className="mt-4 text-lg font-semibold text-gray-600">Select a document</h3><p className="mt-1 text-sm text-gray-400">Choose a document from the sidebar to review</p></div></div>
          ) : ["uploading", "uploaded", "processing", "structuring"].includes(currentDoc.status) ? (
            <div className="flex h-full items-center justify-center"><div className="text-center max-w-sm"><Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" /><h3 className="mt-4 text-lg font-semibold text-gray-700">Processing Document</h3><p className="mt-1 text-sm text-gray-500">{currentDoc.fileName} is being processed...</p><div className="mt-4 h-2 w-64 mx-auto rounded-full bg-gray-200 overflow-hidden"><motion.div className="h-full bg-indigo-600 rounded-full" initial={{ width: "10%" }} animate={{ width: "80%" }} transition={{ duration: 8, ease: "easeOut" }} /></div><div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400"><RefreshCw className="h-3 w-3 animate-spin" /> Auto-refreshing...</div></div></div>
          ) : currentDoc.status === "error" ? (
            <div className="flex h-full items-center justify-center"><div className="text-center max-w-sm"><AlertTriangle className="mx-auto h-12 w-12 text-red-400" /><h3 className="mt-4 text-lg font-semibold text-red-700">Processing Error</h3><p className="mt-2 text-sm text-gray-600">{currentDoc.error || "An error occurred."}</p><a href="/dashboard/upload" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"><Upload className="h-4 w-4" /> Re-upload</a></div></div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="flex-shrink-0 border-b border-gray-200 bg-white px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 truncate">{currentDoc.fileName}</h1>
                    <StatusBadge status={currentDoc.status} />
                    {!isEditable && (currentDoc.status === "approved" || currentDoc.status === "rejected") && (<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 border border-gray-200">{currentDoc.status === "approved" ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />} Read-only</span>)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowPreview((p) => !p)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${showPreview ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}>{showPreview ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}{showPreview ? " Hide Preview" : " Show Preview"}</button>
                    <button onClick={copyJson} className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"><Copy className="h-3.5 w-3.5" /> JSON</button>
                    {(currentDoc.fields.length > 0 || currentDoc.lineItems.length > 0) && (<button onClick={downloadExcel} className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"><Download className="h-3.5 w-3.5" /> Excel</button>)}
                    {isEditable && (isEditing ? (<button onClick={saveEdits} disabled={actionLoading} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition disabled:opacity-60">{actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>) : (<button onClick={startEditing} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition"><Edit3 className="h-3.5 w-3.5" /> Edit</button>))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">{currentDoc.docType || "Document"} &middot; Confidence: <ConfidenceBadge value={currentDoc.overallConfidence} />{currentDoc.ocrEngine && <span className="capitalize"> &middot; {currentDoc.ocrEngine} OCR</span>} &middot; Updated {new Date(currentDoc.updatedAt).toLocaleString()}</p>
              </div>
              <div id="split-container" className="flex-1 flex overflow-hidden">
                {showPreview && (<>
                  <div className="flex-shrink-0 overflow-hidden border-r border-gray-200" style={{ width: `${previewWidth}%` }}><DocumentPreview docId={currentDoc.id} fileType={currentDoc.fileType} fileName={currentDoc.fileName} /></div>
                  <div className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 transition-colors relative group" onMouseDown={handleMouseDown}><div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 z-10" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><div className="h-1 w-1 rounded-full bg-white" /><div className="h-1 w-1 rounded-full bg-white" /><div className="h-1 w-1 rounded-full bg-white" /></div></div>
                </>)}
                <div className="flex-1 overflow-y-auto bg-gray-50">{renderExtractedData()}</div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
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