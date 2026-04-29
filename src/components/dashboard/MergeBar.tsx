"use client";

/**
 * MergeBar — sticky toolbar shown when one or more documents are selected.
 *
 * Provides:
 *  - selected-count badge + "select all" / "clear" controls (driven by parent)
 *  - mode picker: combine fields (one row per doc) vs line items (one row per item)
 *  - format picker: CSV (Excel-compatible) — reserved for xlsx in the future
 *  - "Use AI to unify columns" toggle
 *  - "Merge & Download" button with sync + async (job polling) flows
 *
 * The parent owns the selection state and passes the selected document IDs in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  Eye,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import MergePreviewModal from "./MergePreviewModal";

type MergeMode = "fields" | "lineitems";

interface MergeBarProps {
  selectedIds: string[];
  totalSelectable: number;
  onSelectAll: () => void;
  onClear: () => void;
  /** Optional friendly label for the selectable population, e.g. "approved documents". */
  populationLabel?: string;
}

interface JobState {
  jobId: string;
  status: "pending" | "running" | "done" | "error";
  total: number;
  completed: number;
  message?: string;
  error?: string;
  fileName?: string;
}

export default function MergeBar({
  selectedIds,
  totalSelectable,
  onSelectAll,
  onClear,
  populationLabel = "documents",
}: MergeBarProps) {
  const [mode, setMode] = useState<MergeMode>("fields");
  const [useAI, setUseAI] = useState(true);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preview modal state — populated once we have the merged CSV text.
  const [preview, setPreview] = useState<{
    open: boolean;
    csvText: string;
    fileName: string;
    documentCount: number;
    usedAI: boolean;
  }>({ open: false, csvText: "", fileName: "", documentCount: 0, usedAI: false });

  const allSelected = totalSelectable > 0 && selectedIds.length === totalSelectable;

  // Notify on async completion (browser notification + in-app banner stays).
  const notifyDone = useCallback((fileName: string) => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Merge complete", { body: `${fileName} is ready to download.` });
        } else if (Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  /** Fetch the finished merged CSV text (does NOT trigger a download). */
  const fetchJobCsv = useCallback(async (jobId: string): Promise<string> => {
    const res = await fetch(`/api/merge-csv/${jobId}?download=1`);
    if (!res.ok) throw new Error("Could not fetch merged CSV");
    return await res.text();
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/merge-csv/${jobId}`);
          if (!res.ok) return;
          const data = (await res.json()) as JobState;
          setJob(data);
          if (data.status === "done") {
            stopPolling();
            setBusy(false);
            const fname = data.fileName ?? `merged-${jobId}.csv`;
            notifyDone(fname);
            try {
              const csvText = await fetchJobCsv(jobId);
              setPreview({
                open: true,
                csvText,
                fileName: fname,
                documentCount: selectedIds.length,
                usedAI: useAI,
              });
            } catch {
              setError("Could not load the merged file for preview.");
            }
          } else if (data.status === "error") {
            stopPolling();
            setBusy(false);
            setError(data.error || "Merge failed");
          }
        } catch {
          /* transient — keep polling */
        }
      }, 2000);
    },
    [fetchJobCsv, notifyDone, selectedIds.length, stopPolling, useAI]
  );

  const runMerge = useCallback(async () => {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setJob(null);

    // Ask for notification permission early for async jobs.
    if (selectedIds.length > 5 && typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "default") await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }

    try {
      const res = await fetch(apiUrl("/api/merge-csv"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: selectedIds,
          mode,
          useAI,
          format: "csv",
        }),
      });

      if (res.status === 202) {
        // async job
        const data = (await res.json()) as { jobId: string; total: number; message?: string };
        setJob({
          jobId: data.jobId,
          status: "running",
          total: data.total,
          completed: 0,
          message: data.message,
        });
        startPolling(data.jobId);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Merge failed (HTTP ${res.status})`);
      }

      // sync — open the preview instead of downloading directly.
      const csvText = await res.text();
      const cd = res.headers.get("content-disposition") || "";
      const m = /filename="([^"]+)"/.exec(cd);
      const fname = m?.[1] || `merged-${Date.now()}.csv`;
      setPreview({
        open: true,
        csvText,
        fileName: fname,
        documentCount: selectedIds.length,
        usedAI: useAI,
      });
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed");
      setBusy(false);
    }
  }, [busy, mode, selectedIds, startPolling, useAI]);

  if (selectedIds.length === 0 && !job && !error && !preview.open) {
    return null;
  }

  const progressPct =
    job && job.total > 0 ? Math.min(100, Math.round((job.completed / job.total) * 100)) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="sticky bottom-4 z-30 mx-auto max-w-5xl"
      >
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
          {/* Top row: selection + actions */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
            <button
              onClick={allSelected ? onClear : onSelectAll}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition"
              disabled={totalSelectable === 0}
              title={allSelected ? "Clear selection" : `Select all ${totalSelectable} ${populationLabel}`}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelected ? "All selected" : `Select all (${totalSelectable})`}
            </button>

            <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {selectedIds.length} selected
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
              <button
                onClick={() => setMode("fields")}
                disabled={busy}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  mode === "fields"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="One row per document — invoice header fields side by side"
              >
                One row / doc
              </button>
              <button
                onClick={() => setMode("lineitems")}
                disabled={busy}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  mode === "lineitems"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="One row per line item across all documents"
              >
                Line items
              </button>
            </div>

            <label
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer select-none"
              title="Use OpenAI to unify column names like 'VAT No', 'vat number', 'Tax ID' into one canonical column"
            >
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                disabled={busy}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              AI unify columns
            </label>

            <button
              onClick={runMerge}
              disabled={busy || selectedIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Merge & Preview
                </>
              )}
            </button>

            <button
              onClick={() => {
                onClear();
                setJob(null);
                setError(null);
                stopPolling();
                setBusy(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress / status row */}
          {(job || error) && (
            <div className="px-4 py-3 bg-slate-50/50">
              {error && (
                <div className="flex items-start gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {job && job.status === "running" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      {job.message ||
                        `Processing ${job.completed} of ${job.total} documents…`}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progressPct}%` }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    This may take a moment. You can keep working — we&apos;ll notify
                    you and open a preview when it&apos;s ready.
                  </p>
                </div>
              )}

              {job && job.status === "done" && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-success">
                    <FileSpreadsheet className="w-4 h-4" />
                    {job.fileName ?? "Merged file"} is ready.
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        const csvText = await fetchJobCsv(job.jobId);
                        setPreview({
                          open: true,
                          csvText,
                          fileName: job.fileName ?? `merged-${job.jobId}.csv`,
                          documentCount: selectedIds.length || job.total,
                          usedAI: useAI,
                        });
                      } catch {
                        setError("Could not load the merged file for preview.");
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-success rounded-lg hover:bg-emerald-600 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Open preview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <MergePreviewModal
        open={preview.open}
        csvText={preview.csvText}
        fileName={preview.fileName}
        documentCount={preview.documentCount}
        usedAI={preview.usedAI}
        onClose={() => setPreview((p) => ({ ...p, open: false }))}
      />
    </AnimatePresence>
  );
}
