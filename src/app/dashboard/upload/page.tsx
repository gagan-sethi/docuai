"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CloudUpload,
  Eye,
  Trash2,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Clock,
  FileCheck2,
  Info,
  FileSpreadsheet,
  Download,
  PenTool,
  Play,
  ScanSearch,
  Keyboard,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import MergeBar from "@/components/dashboard/MergeBar";
import { apiUrl } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────
type FileStatus = "queued" | "detecting" | "ready" | "uploading" | "processing" | "structuring" | "done" | "error";
type DocInputType = "handwritten" | "typed" | "unknown";

interface UploadFile {
  id: string;
  documentId?: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: FileStatus;
  progress: number;
  confidence?: number;
  error?: string;
  docType?: string;
  detectedType?: DocInputType;
  detectedConfidence?: number;
  isHandwrittenOverride?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  return FileText;
}

const acceptedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
];

const supportedFormats = [
  { ext: "PDF", icon: FileText, color: "text-red-500 bg-red-50" },
  { ext: "JPG", icon: Image, color: "text-blue-500 bg-blue-50" },
  { ext: "PNG", icon: Image, color: "text-emerald-500 bg-emerald-50" },
  { ext: "TIFF", icon: Image, color: "text-purple-500 bg-purple-50" },
];

const statusConfig: Record<
  FileStatus,
  { label: string; color: string; bgColor: string }
> = {
  queued: { label: "Queued", color: "text-slate-500", bgColor: "bg-slate-100" },
  detecting: { label: "Detecting Type", color: "text-amber-600", bgColor: "bg-amber-50" },
  ready: { label: "Ready", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  uploading: { label: "Uploading", color: "text-primary", bgColor: "bg-primary/10" },
  processing: { label: "OCR Processing", color: "text-secondary", bgColor: "bg-secondary/10" },
  structuring: { label: "AI Structuring", color: "text-purple-600", bgColor: "bg-purple-50" },
  done: { label: "Complete", color: "text-success", bgColor: "bg-success/10" },
  error: { label: "Failed", color: "text-red-500", bgColor: "bg-red-50" },
};

// ─── Auto-detect document type ─────────────────────────────────
async function detectDocumentType(
  file: UploadFile,
  onUpdate: (updates: Partial<UploadFile>) => void
): Promise<void> {
  try {
    onUpdate({ status: "detecting" });

    const formData = new FormData();
    formData.append("file", file.file);

    const res = await fetch(apiUrl("/api/detect-type"), {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      onUpdate({ status: "ready", detectedType: "unknown", detectedConfidence: 0 });
      return;
    }

    const data = await res.json();
    onUpdate({
      status: "ready",
      detectedType: data.type as DocInputType,
      detectedConfidence: data.confidence,
      isHandwrittenOverride: data.type === "handwritten",
    });
  } catch {
    onUpdate({ status: "ready", detectedType: "unknown", detectedConfidence: 0 });
  }
}

// ─── Real processing pipeline ──────────────────────────────────
async function processFile(
  file: UploadFile,
  onUpdate: (updates: Partial<UploadFile>) => void,
  isHandwritten: boolean = false
): Promise<void> {
  try {
    onUpdate({ status: "uploading", progress: 20 });

    const formData = new FormData();
    formData.append("file", file.file);
    if (isHandwritten) {
      formData.append("isHandwritten", "true");
    }

    const uploadRes = await fetch(apiUrl("/api/upload"), { method: "POST", credentials: "include", body: formData });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      if (err.upgradeRequired) {
        throw new Error(`UPGRADE_REQUIRED:${err.message}`);
      }
      throw new Error(err.error || "Upload failed");
    }

    const uploadData = await uploadRes.json();
    onUpdate({ documentId: uploadData.documentId, status: "uploading", progress: 50 });

    onUpdate({ status: "processing", progress: 60 });

    const processRes = await fetch(apiUrl("/api/process"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ documentId: uploadData.documentId }),
    });

    onUpdate({ status: "structuring", progress: 80 });

    if (!processRes.ok) {
      const err = await processRes.json();
      throw new Error(err.error || "Processing failed");
    }

    const processData = await processRes.json();

    onUpdate({
      status: "done",
      progress: 100,
      confidence: processData.overallConfidence,
      docType: processData.docType,
      documentId: uploadData.documentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    onUpdate({ status: "error", error: message, progress: 100 });
  }
}

// ─── Scanning Animation Component ──────────────────────────────
function ScanningAnimation() {
  return (
    <div className="relative w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center overflow-hidden">
      <ScanSearch className="w-5 h-5 text-amber-500 z-10" />
      <motion.div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Pulse Dot ──────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

// ─── Main Upload Page ───────────────────────────────────────────
export default function UploadPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector("aside");
      if (sidebar) setSidebarWidth(sidebar.getBoundingClientRect().width);
    });
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ["style"] });
      setSidebarWidth(sidebar.getBoundingClientRect().width);
    }
    return () => observer.disconnect();
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f)));
  }, []);

  // Add files — NO auto processing, just detect type
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const uploads: UploadFile[] = Array.from(newFiles)
      .filter((f) => acceptedTypes.includes(f.type) || f.name.endsWith(".pdf"))
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        file: f,
        status: "queued" as FileStatus,
        progress: 0,
        detectedType: "unknown" as DocInputType,
      }));

    if (uploads.length === 0) return;
    setFiles((prev) => [...prev, ...uploads]);

    // Auto-detect document type for each file (staggered)
    uploads.forEach((uploadFile, i) => {
      setTimeout(() => {
        detectDocumentType(uploadFile, (updates) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, ...updates } : f))
          );
        });
      }, i * 300);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  // Toggle handwritten override for a specific file
  const toggleFileType = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const newOverride = !f.isHandwrittenOverride;
        return { ...f, isHandwrittenOverride: newOverride, detectedType: newOverride ? "handwritten" : "typed" };
      })
    );
  }, []);

  // Start processing all ready files
  const startProcessing = useCallback(() => {
    const readyFiles = files.filter((f) => f.status === "ready" || f.status === "queued");
    if (readyFiles.length === 0) return;

    setIsProcessing(true);
    setUpgradeMessage("");

    readyFiles.forEach((uploadFile, i) => {
      setTimeout(() => {
        const isHandwritten = uploadFile.isHandwrittenOverride ?? (uploadFile.detectedType === "handwritten");
        processFile(uploadFile, (updates) => {
          setFiles((prev) => {
            const updated = prev.map((f) => (f.id === uploadFile.id ? { ...f, ...updates } : f));
            const anyActive = updated.some((f) => ["uploading", "processing", "structuring"].includes(f.status));
            if (!anyActive) setIsProcessing(false);

            // Detect upgrade-required errors
            if (updates.error?.startsWith("UPGRADE_REQUIRED:")) {
              setUpgradeMessage(updates.error.replace("UPGRADE_REQUIRED:", ""));
            }

            return updated;
          });
        }, isHandwritten);
      }, i * 500);
    });
  }, [files]);

  const retryFile = useCallback((file: UploadFile) => {
    const isHandwritten = file.isHandwrittenOverride ?? (file.detectedType === "handwritten");
    processFile(file, (updates) => updateFile(file.id, updates), isHandwritten);
  }, [updateFile]);

  // Stats
  const stats = {
    total: files.length,
    done: files.filter((f) => f.status === "done").length,
    processing: files.filter((f) => ["uploading", "processing", "structuring"].includes(f.status)).length,
    detecting: files.filter((f) => f.status === "detecting").length,
    ready: files.filter((f) => f.status === "ready" || f.status === "queued").length,
    errors: files.filter((f) => f.status === "error").length,
    handwritten: files.filter((f) => f.detectedType === "handwritten").length,
    typed: files.filter((f) => f.detectedType === "typed").length,
  };

  const canStartProcessing = stats.ready > 0 && stats.detecting === 0 && !isProcessing;

  return (
    <div className="flex h-screen bg-[#f8f9fb]">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, marginLeft: sidebarWidth }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <TopBar title="Upload Documents" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Upload Zone */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer transition-all duration-300 p-8 md:p-12 ${
                dragActive
                  ? "bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 border-primary scale-[0.99]"
                  : "bg-gradient-to-br from-slate-50/50 to-white hover:from-primary/[0.02] hover:to-secondary/[0.02]"
              }`}
            >
              <input ref={fileInputRef} type="file" multiple accept={acceptedTypes.join(",")}
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                className="hidden" />

              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={dragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 ${
                    dragActive
                      ? "bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25"
                      : "bg-gradient-to-br from-primary/10 to-secondary/10"
                  }`}
                >
                  <CloudUpload className={`w-10 h-10 transition-colors ${dragActive ? "text-white" : "text-primary"}`} />
                </motion.div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {dragActive ? "Drop files here!" : "Upload Documents"}
                </h3>
                <p className="text-sm text-muted mb-6 max-w-md">
                  Drag & drop your documents or click to browse.{" "}
                  <span className="font-medium text-primary">AI will auto-detect</span> if they&apos;re handwritten or typed.
                </p>

                <div className="flex items-center gap-3">
                  {supportedFormats.map((fmt) => (
                    <div key={fmt.ext} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${fmt.color}`}>
                      <fmt.icon className="w-3.5 h-3.5" />
                      {fmt.ext}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upgrade Required Banner */}
          {upgradeMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-2xl"
            >
              <div className="p-2.5 rounded-xl bg-red-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Document Limit Reached</p>
                <p className="text-xs text-red-600/80 mt-0.5">{upgradeMessage}</p>
                <p className="text-[10px] text-red-500/70 mt-1">Paid plans coming soon. Your limit resets at the start of next month.</p>
              </div>
            </motion.div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header with stats and Start Processing button */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      {stats.total} {stats.total === 1 ? "Document" : "Documents"}
                    </h3>
                    <div className="flex items-center gap-2">
                      {stats.detecting > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600">
                          <PulseDot color="bg-amber-400" />
                          Detecting {stats.detecting}...
                        </motion.span>
                      )}
                      {stats.handwritten > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-orange-50 text-orange-600">
                          <PenTool className="w-3 h-3" />{stats.handwritten} Handwritten
                        </motion.span>
                      )}
                      {stats.typed > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600">
                          <Keyboard className="w-3 h-3" />{stats.typed} Typed
                        </motion.span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stats.done > 0 && (
                      <button onClick={() => setFiles((prev) => prev.filter((f) => f.status !== "done"))}
                        className="text-xs font-medium text-muted hover:text-slate-700 transition-colors">
                        Clear completed
                      </button>
                    )}
                    {stats.done > 0 && (
                      <Link href="/dashboard/review"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:scale-105 transition-all">
                        Review All<ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Start Processing Button */}
                <AnimatePresence>
                  {(stats.ready > 0 || stats.detecting > 0) && !isProcessing && stats.processing === 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <motion.button
                        onClick={startProcessing}
                        disabled={!canStartProcessing}
                        whileHover={canStartProcessing ? { scale: 1.02 } : {}}
                        whileTap={canStartProcessing ? { scale: 0.98 } : {}}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                          canStartProcessing
                            ? "bg-gradient-to-r from-primary via-primary-dark to-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {stats.detecting > 0 ? (
                          <><Loader2 className="w-5 h-5 animate-spin" />Detecting document types...</>
                        ) : (
                          <><Play className="w-5 h-5" />Start Processing {stats.ready} {stats.ready === 1 ? "Document" : "Documents"}<Zap className="w-4 h-4" /></>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Processing indicator */}
                {isProcessing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-primary/10">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-5 h-5 text-primary" />
                    </motion.div>
                    <span className="text-sm font-semibold text-primary">Processing {stats.processing} of {stats.total} documents...</span>
                    <PulseDot color="bg-primary" />
                  </motion.div>
                )}
              </div>

              {/* Pipeline steps */}
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-6 text-[11px] font-medium text-muted">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                      <ScanSearch className="w-3 h-3 text-amber-600" />
                    </div>
                    1. Auto-Detect
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                      <CloudUpload className="w-3 h-3 text-primary" />
                    </div>
                    2. Upload
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-secondary/10 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-secondary" />
                    </div>
                    3. OCR
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-purple-600" />
                    </div>
                    4. AI Structure
                  </div>
                </div>
              </div>

              {/* File list */}
              <div className="divide-y divide-slate-50">
                <AnimatePresence>
                  {files.map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    const cfg = statusConfig[file.status];
                    return (
                      <motion.div key={file.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-4 px-5 py-4 group">
                        {/* File icon / scanning animation */}
                        {file.status === "detecting" ? (
                          <ScanningAnimation />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            file.status === "done" ? "bg-success/10"
                              : file.status === "error" ? "bg-red-50"
                              : file.status === "structuring" ? "bg-purple-50"
                              : file.status === "ready" ? "bg-emerald-50"
                              : "bg-primary/5"
                          }`}>
                            {file.status === "done" ? <FileCheck2 className="w-5 h-5 text-success" />
                              : file.status === "error" ? <AlertTriangle className="w-5 h-5 text-red-500" />
                              : file.status === "processing" || file.status === "structuring" ? <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                              : file.status === "ready" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              : <FileIcon className="w-5 h-5 text-primary" />}
                          </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                            {/* Detected type badge */}
                            {file.detectedType && file.detectedType !== "unknown" && file.status !== "detecting" && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                  file.detectedType === "handwritten"
                                    ? "bg-orange-50 text-orange-600 border border-orange-200"
                                    : "bg-blue-50 text-blue-600 border border-blue-200"
                                }`}
                              >
                                {file.detectedType === "handwritten" ? <PenTool className="w-2.5 h-2.5" /> : <Keyboard className="w-2.5 h-2.5" />}
                                {file.detectedType === "handwritten" ? "Handwritten" : "Typed"}
                                {file.detectedConfidence ? <span className="opacity-60">{file.detectedConfidence}%</span> : null}
                              </motion.span>
                            )}
                            {file.status === "detecting" && (
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-600">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />Detecting...
                              </motion.span>
                            )}
                            {file.docType && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-primary/10 text-primary rounded">{file.docType}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted">{formatSize(file.size)}</span>
                            {file.confidence !== undefined && file.confidence > 0 && (
                              <>
                                <span className="text-[11px] text-muted">&middot;</span>
                                <span className={`text-[11px] font-semibold ${file.confidence >= 90 ? "text-success" : "text-amber-500"}`}>
                                  {file.confidence}% confidence
                                </span>
                              </>
                            )}
                            {file.error && (
                              <>
                                <span className="text-[11px] text-muted">&middot;</span>
                                <span className="text-[11px] text-red-500">{file.error}</span>
                              </>
                            )}
                          </div>
                          {["uploading", "processing", "structuring"].includes(file.status) && (
                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${file.progress}%` }} transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${
                                  file.status === "structuring" ? "bg-gradient-to-r from-purple-500 to-primary animated-gradient"
                                    : file.status === "processing" ? "bg-gradient-to-r from-secondary to-primary animated-gradient"
                                    : "bg-primary"
                                }`} />
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <span className={`hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full ${cfg.bgColor} ${cfg.color}`}>
                          {file.status === "detecting" && <Loader2 className="w-3 h-3 animate-spin" />}
                          {file.status === "ready" && <CheckCircle2 className="w-3 h-3" />}
                          {(file.status === "uploading" || file.status === "queued") && <Clock className="w-3 h-3" />}
                          {(file.status === "processing" || file.status === "structuring") && <Sparkles className="w-3 h-3 animate-pulse" />}
                          {file.status === "done" && <CheckCircle2 className="w-3 h-3" />}
                          {file.status === "error" && <AlertTriangle className="w-3 h-3" />}
                          {cfg.label}
                        </span>

                        {/* Selection checkbox (only for completed docs) */}
                        {file.status === "done" && file.documentId && (
                          <label
                            className="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-slate-100 transition"
                            title="Select for merge"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(file.documentId)}
                              onChange={(e) => {
                                const id = file.documentId!;
                                setSelectedIds((prev) =>
                                  e.target.checked
                                    ? Array.from(new Set([...prev, id]))
                                    : prev.filter((x) => x !== id)
                                );
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                          </label>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {(file.status === "ready" || file.status === "queued") && (
                            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
                              onClick={() => toggleFileType(file.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                file.isHandwrittenOverride
                                  ? "text-orange-500 bg-orange-50 hover:bg-orange-100"
                                  : "text-blue-500 bg-blue-50 hover:bg-blue-100"
                              }`}
                              title={`Switch to ${file.isHandwrittenOverride ? "typed" : "handwritten"} mode`}
                            >
                              {file.isHandwrittenOverride ? <PenTool className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
                            </motion.button>
                          )}
                          {file.status === "done" && file.documentId && (
                            <a href={apiUrl(`/api/documents/${file.documentId}/excel`)} download
                              className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors opacity-0 group-hover:opacity-100" title="Download Excel">
                              <FileSpreadsheet className="w-4 h-4" />
                            </a>
                          )}
                          {file.status === "done" && file.documentId && (
                            <Link href={`/dashboard/review?doc=${file.documentId}`}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100" title="Review">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {file.status === "error" && (
                            <button onClick={() => retryFile(file)}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Retry">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Remove">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* All done banner */}
              {stats.done > 0 && stats.processing === 0 && stats.ready === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-5 bg-gradient-to-r from-success/5 via-emerald-50 to-success/5 border-t border-success/10">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </motion.div>
                    <span className="text-sm font-semibold text-success">All documents processed and ready!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a href={files.find(f => f.status === "done" && f.documentId)
                        ? apiUrl(`/api/documents/${files.find(f => f.status === "done" && f.documentId)!.documentId}/excel`) : "#"}
                      download
                      className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-success to-emerald-600 rounded-xl shadow-lg shadow-success/25 hover:shadow-success/40 hover:scale-[1.02] transition-all">
                      <FileSpreadsheet className="w-5 h-5" />Download Excel<Download className="w-4 h-4" />
                    </a>
                    <Link href="/dashboard/review"
                      className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-primary bg-white border-2 border-primary/20 rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all">
                      Review &amp; Approve<ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {stats.done > 1 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Download individual files:</p>
                      <div className="flex flex-wrap gap-2">
                        {files.filter(f => f.status === "done" && f.documentId).map(f => (
                          <a key={f.id} href={apiUrl(`/api/documents/${f.documentId}/excel`)} download
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors">
                            <FileSpreadsheet className="w-3 h-3" />{f.name.replace(/\.[^.]+$/, "")}.csv
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Tips when empty */}
          {files.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: ScanSearch, title: "Smart Detection", desc: "AI automatically detects if your document is handwritten or typed — no manual toggling needed.", color: "from-amber-500 to-orange-600" },
                { icon: Sparkles, title: "AI-Powered Pipeline", desc: "Amazon Textract for OCR + PaddleOCR for handwriting + GPT-4o for intelligent structuring.", color: "from-secondary to-cyan-600" },
                { icon: FileCheck2, title: "Review & Export", desc: "Validate extracted data, edit fields inline, then export to Excel or via API.", color: "from-success to-emerald-600" },
              ].map((tip) => (
                <div key={tip.title} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-shadow">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center mb-4`}>
                    <tip.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Merge bar — appears when one or more processed files are selected */}
          <MergeBar
            selectedIds={selectedIds}
            totalSelectable={files.filter((f) => f.status === "done" && f.documentId).length}
            onSelectAll={() =>
              setSelectedIds(
                files
                  .filter((f) => f.status === "done" && f.documentId)
                  .map((f) => f.documentId!)
              )
            }
            onClear={() => setSelectedIds([])}
            populationLabel="processed documents"
          />

          {/* Info banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">How it works:</span>{" "}
              Upload your documents &rarr; AI auto-detects if handwritten or typed &rarr; Review detected types &rarr;
              Click <span className="font-semibold text-primary">&quot;Start Processing&quot;</span> &rarr; Documents are
              processed through OCR + GPT-4o &rarr; Results appear in your{" "}
              <Link href="/dashboard/review" className="text-primary font-semibold hover:underline">Review Queue</Link>{" "}
              for final validation.
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
