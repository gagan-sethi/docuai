"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Image,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CloudUpload,
  File,
  Eye,
  Trash2,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Clock,
  FileCheck2,
  Info,
  FolderOpen,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

// ─── Types ──────────────────────────────────────────────────────
type FileStatus = "queued" | "uploading" | "processing" | "done" | "error";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
  confidence?: number;
  error?: string;
  docType?: string;
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

// ─── Simulate processing ───────────────────────────────────────
function simulateUpload(
  file: UploadFile,
  onUpdate: (f: UploadFile) => void
) {
  let progress = 0;

  // Upload phase
  const uploadInterval = setInterval(() => {
    progress += Math.random() * 30 + 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(uploadInterval);
      onUpdate({ ...file, status: "processing", progress: 100 });

      // Processing phase
      setTimeout(() => {
        const isError = Math.random() < 0.08; // 8% chance of error for realism
        if (isError) {
          onUpdate({
            ...file,
            status: "error",
            progress: 100,
            error: "Could not extract text. The document may be corrupted.",
          });
        } else {
          const docTypes = [
            "Invoice",
            "Purchase Order",
            "Delivery Note",
            "Receipt",
          ];
          onUpdate({
            ...file,
            status: "done",
            progress: 100,
            confidence: Math.floor(Math.random() * 12) + 88,
            docType:
              docTypes[Math.floor(Math.random() * docTypes.length)],
          });
        }
      }, 1500 + Math.random() * 1500);
    } else {
      onUpdate({ ...file, status: "uploading", progress });
    }
  }, 200);
}

// ─── Status Config ──────────────────────────────────────────────
const statusConfig: Record<
  FileStatus,
  { label: string; color: string; bgColor: string }
> = {
  queued: { label: "Queued", color: "text-slate-500", bgColor: "bg-slate-100" },
  uploading: {
    label: "Uploading",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  processing: {
    label: "AI Processing",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  done: { label: "Complete", color: "text-success", bgColor: "bg-success/10" },
  error: { label: "Failed", color: "text-red-500", bgColor: "bg-red-50" },
};

// ─── Main Upload Page ───────────────────────────────────────────
export default function UploadPage() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector("aside");
      if (sidebar) setSidebarWidth(sidebar.getBoundingClientRect().width);
    });
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ["style"],
      });
      setSidebarWidth(sidebar.getBoundingClientRect().width);
    }
    return () => observer.disconnect();
  }, []);

  const updateFile = useCallback((updated: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
  }, []);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const uploads: UploadFile[] = Array.from(newFiles)
        .filter((f) => acceptedTypes.includes(f.type) || f.name.endsWith(".pdf"))
        .map((f) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          type: f.type,
          status: "queued" as FileStatus,
          progress: 0,
        }));

      if (uploads.length === 0) return;

      setFiles((prev) => [...prev, ...uploads]);

      // Start processing each file with a slight stagger
      uploads.forEach((file, i) => {
        setTimeout(() => {
          simulateUpload(file, (updated) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === updated.id ? updated : f))
            );
          });
        }, i * 400);
      });
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const retryFile = (file: UploadFile) => {
    const reset: UploadFile = { ...file, status: "queued", progress: 0, error: undefined };
    updateFile(reset);
    simulateUpload(reset, (updated) => {
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    });
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "done"));
  };

  const stats = {
    total: files.length,
    done: files.filter((f) => f.status === "done").length,
    processing: files.filter((f) =>
      ["queued", "uploading", "processing"].includes(f.status)
    ).length,
    errors: files.filter((f) => f.status === "error").length,
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.2 }}
        className="min-h-screen"
      >
        <TopBar title="Upload Documents" />

        <main className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10"
                  : "border-slate-200 bg-white hover:border-primary/40 hover:bg-primary/[0.02]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              <div className="py-16 px-8 text-center">
                {/* Icon */}
                <motion.div
                  animate={dragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6"
                >
                  <CloudUpload
                    className={`w-10 h-10 transition-colors ${
                      dragActive ? "text-primary" : "text-primary/60"
                    }`}
                  />
                </motion.div>

                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {dragActive
                    ? "Drop your documents here"
                    : "Drag & drop documents here"}
                </h3>
                <p className="text-sm text-muted mb-6">
                  or{" "}
                  <span className="text-primary font-semibold cursor-pointer hover:underline">
                    browse files
                  </span>{" "}
                  from your computer
                </p>

                {/* Supported formats */}
                <div className="flex items-center justify-center gap-3">
                  {supportedFormats.map((fmt) => (
                    <div
                      key={fmt.ext}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${fmt.color} text-xs font-semibold`}
                    >
                      <fmt.icon className="w-3.5 h-3.5" />
                      {fmt.ext}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 mt-4">
                  Maximum 50MB per file. Supports multi-page documents.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Alternative upload: WhatsApp */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-green-900">
                  Upload via WhatsApp
                </h4>
                <p className="text-xs text-green-700 mt-0.5">
                  Send documents directly to our WhatsApp number and they&apos;ll
                  appear here automatically.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-white px-4 py-2 rounded-xl border border-green-200">
              <MessageSquare className="w-4 h-4" />
              +971 4 XXX XXXX
            </div>
          </motion.div>

          {/* File List */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Uploaded Files
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    {stats.done > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        {stats.done} complete
                      </span>
                    )}
                    {stats.processing > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {stats.processing} processing
                      </span>
                    )}
                    {stats.errors > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {stats.errors} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {stats.done > 0 && (
                    <button
                      onClick={clearCompleted}
                      className="text-xs font-medium text-muted hover:text-slate-700 transition-colors"
                    >
                      Clear completed
                    </button>
                  )}
                  {stats.done > 0 && (
                    <Link
                      href="/dashboard/review"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:scale-105 transition-all"
                    >
                      Review All
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* File rows */}
              <div className="divide-y divide-slate-50">
                <AnimatePresence>
                  {files.map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    const cfg = statusConfig[file.status];
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-4 px-5 py-4 group"
                      >
                        {/* File icon */}
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            file.status === "done"
                              ? "bg-success/10"
                              : file.status === "error"
                              ? "bg-red-50"
                              : "bg-primary/5"
                          }`}
                        >
                          {file.status === "done" ? (
                            <FileCheck2 className="w-5 h-5 text-success" />
                          ) : file.status === "error" ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : file.status === "processing" ? (
                            <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-primary" />
                          )}
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {file.name}
                            </p>
                            {file.docType && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-primary/10 text-primary rounded">
                                {file.docType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted">
                              {formatSize(file.size)}
                            </span>
                            {file.confidence && (
                              <>
                                <span className="text-[11px] text-muted">
                                  ·
                                </span>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    file.confidence >= 90
                                      ? "text-success"
                                      : "text-amber-500"
                                  }`}
                                >
                                  {file.confidence}% confidence
                                </span>
                              </>
                            )}
                            {file.error && (
                              <>
                                <span className="text-[11px] text-muted">
                                  ·
                                </span>
                                <span className="text-[11px] text-red-500">
                                  {file.error}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Progress bar */}
                          {(file.status === "uploading" ||
                            file.status === "processing") && (
                            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${file.progress}%`,
                                }}
                                className={`h-full rounded-full ${
                                  file.status === "processing"
                                    ? "bg-gradient-to-r from-secondary to-primary animated-gradient"
                                    : "bg-primary"
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <span
                          className={`hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full ${cfg.bgColor} ${cfg.color}`}
                        >
                          {file.status === "uploading" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          {file.status === "processing" && (
                            <Sparkles className="w-3 h-3 animate-pulse" />
                          )}
                          {file.status === "done" && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {file.status === "error" && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {file.status === "queued" && (
                            <Clock className="w-3 h-3" />
                          )}
                          {cfg.label}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.status === "done" && (
                            <Link
                              href="/dashboard/review"
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                              title="Review"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {file.status === "error" && (
                            <button
                              onClick={() => retryFile(file)}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                              title="Retry"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Footer summary */}
              {stats.done > 0 && stats.processing === 0 && (
                <div className="px-5 py-4 bg-success/5 border-t border-success/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="text-sm font-semibold text-success">
                      All uploads processed successfully
                    </span>
                  </div>
                  <Link
                    href="/dashboard/review"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-success to-emerald-600 rounded-xl shadow-md shadow-success/20 hover:shadow-success/30 hover:scale-105 transition-all"
                  >
                    Review & Approve
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Tips section — shows when no files uploaded */}
          {files.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid sm:grid-cols-3 gap-4"
            >
              {[
                {
                  icon: FileText,
                  title: "Supported Documents",
                  desc: "Invoices, purchase orders, delivery notes, receipts, and bills of lading.",
                  color: "from-primary to-primary-dark",
                },
                {
                  icon: Sparkles,
                  title: "AI-Powered OCR",
                  desc: "Amazon Textract extracts text, tables, and key-value pairs with 90-95% accuracy.",
                  color: "from-secondary to-cyan-600",
                },
                {
                  icon: FileCheck2,
                  title: "Review & Export",
                  desc: "Validate extracted data in the review workspace, then export to Excel or via API.",
                  color: "from-success to-emerald-600",
                },
              ].map((tip, i) => (
                <div
                  key={tip.title}
                  className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 transition-shadow"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center mb-4`}
                  >
                    <tip.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Recent uploads section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Uploads
              </h3>
              <Link
                href="/dashboard/documents"
                className="text-xs text-primary font-medium hover:underline"
              >
                View all documents
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                {
                  name: "Invoice_Hamdan_Trading.pdf",
                  type: "Invoice",
                  date: "2 min ago",
                  confidence: 97,
                  status: "done" as FileStatus,
                },
                {
                  name: "PO_AlFuttaim_March.pdf",
                  type: "Purchase Order",
                  date: "15 min ago",
                  confidence: 82,
                  status: "done" as FileStatus,
                },
                {
                  name: "DeliveryNote_DHL_08472.jpg",
                  type: "Delivery Note",
                  date: "22 min ago",
                  confidence: 91,
                  status: "done" as FileStatus,
                },
                {
                  name: "Receipt_Carrefour_2026.png",
                  type: "Receipt",
                  date: "1 hr ago",
                  confidence: 95,
                  status: "done" as FileStatus,
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {doc.type} · {doc.date}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          doc.confidence >= 90
                            ? "bg-success"
                            : "bg-amber-400"
                        }`}
                        style={{ width: `${doc.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {doc.confidence}%
                    </span>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Complete
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10"
          >
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">
                Processing Pipeline:
              </span>{" "}
              Documents are first uploaded securely to AWS S3, then processed by
              Amazon Textract for OCR extraction. The AI identifies document type,
              header fields, and line items. Results appear in your{" "}
              <Link
                href="/dashboard/review"
                className="text-primary font-semibold hover:underline"
              >
                Review Queue
              </Link>{" "}
              for validation before export.
            </div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
