"use client";

/**
 * MergePreviewModal — full-screen review UI for a freshly merged CSV.
 *
 * The modal is opened by `MergeBar` once the backend returns the merged
 * CSV text. It uses `cleanMergedCsv` to:
 *   - drop columns that are entirely empty
 *   - replace null-ish cells with `—` (so the sheet never shows
 *     `null` / `undefined`)
 *   - detect amount columns and compute a per-column total
 *
 * The user can then visually verify the unified columns + grand total
 * and click "Download CSV" to save the cleaned sheet (with a trailing
 * `TOTAL` row appended).
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileSpreadsheet,
  Sparkles,
  Sigma,
  Layers,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useState } from "react";
import {
  cleanMergedCsv,
  buildAccountingTable,
  downloadAccountingXlsx,
  serializeAccountingCsv,
  formatAmount,
  EMPTY_PLACEHOLDER,
  ACCOUNTING_COLUMNS,
} from "@/lib/csvUtils";

interface Props {
  open: boolean;
  csvText: string;
  fileName: string;
  documentCount: number;
  usedAI: boolean;
  onClose: () => void;
}

export default function MergePreviewModal({
  open,
  csvText,
  fileName,
  documentCount,
  usedAI,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);

  const cleaned = useMemo(
    () => (csvText ? cleanMergedCsv(csvText) : null),
    [csvText]
  );

  const accounting = useMemo(
    () => (cleaned ? buildAccountingTable(cleaned) : null),
    [cleaned]
  );

  const filteredRows = useMemo(() => {
    if (!accounting) return [];
    if (!search.trim()) return accounting.rows;
    const q = search.toLowerCase();
    return accounting.rows.filter((row) =>
      row.some((c) => c.toLowerCase().includes(q))
    );
  }, [accounting, search]);

  const handleDownloadXlsx = async () => {
    if (!accounting) return;
    setDownloading(true);
    try {
      await downloadAccountingXlsx(accounting, fileName);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!accounting) return;
    const csv = serializeAccountingCsv(accounting);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = fileName.replace(/\.(csv|xlsx)$/i, "");
    a.download = `${base}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {open && cleaned && accounting && (
        <>
          <motion.div
            key="merge-preview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            key="merge-preview-modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}
            className="fixed inset-4 sm:inset-8 lg:inset-12 z-[70] flex flex-col bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            {/* ─── Header ───────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold truncate">
                      {fileName}
                    </h3>
                    <p className="text-xs text-emerald-100">
                      {documentCount} document{documentCount !== 1 ? "s" : ""}{" "}
                      merged · {accounting.headers.length} accounting columns ·{" "}
                      {accounting.summary.totalInvoices} invoice
                      {accounting.summary.totalInvoices !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/15 transition"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stat strip — accountant summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-emerald-700/60 border-t border-emerald-700/60">
                <Stat
                  icon={<Layers className="w-3.5 h-3.5" />}
                  label="Total Invoices"
                  value={String(accounting.summary.totalInvoices)}
                />
                <Stat
                  icon={<Sigma className="w-3.5 h-3.5" />}
                  label="Total Amount"
                  value={`${formatAmount(accounting.summary.totalAmount)}${
                    accounting.summary.currency
                      ? " " + accounting.summary.currency
                      : ""
                  }`}
                  emphasise
                />
                <Stat
                  icon={<Sigma className="w-3.5 h-3.5" />}
                  label="Total VAT"
                  value={`${formatAmount(accounting.summary.totalVat)}${
                    accounting.summary.currency
                      ? " " + accounting.summary.currency
                      : ""
                  }`}
                />
                <Stat
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label="AI unified"
                  value={usedAI ? "Yes" : "No"}
                  hint={
                    accounting.unmappedHeaders.length > 0
                      ? `${accounting.unmappedHeaders.length} extra cols dropped`
                      : "all columns mapped"
                  }
                />
              </div>
            </div>

            {/* ─── Toolbar ──────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Filter rows…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
              <span className="text-xs text-slate-500">
                Showing {filteredRows.length} of{" "}
                {accounting.summary.totalInvoices} invoice
                {accounting.summary.totalInvoices !== 1 ? "s" : ""}
              </span>
              <div className="flex-1" />
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accounting-ready
              </span>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                title="Download as plain CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={handleDownloadXlsx}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Preparing…" : "Download Excel"}
              </button>
            </div>

            {/* ─── Spreadsheet ─────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="sticky left-0 z-20 bg-slate-100 border-b border-r border-slate-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left w-12">
                      #
                    </th>
                    {accounting.headers.map((h) => (
                      <th
                        key={h}
                        className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left whitespace-nowrap"
                        title={h}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={accounting.headers.length + 1}
                        className="px-6 py-12 text-center text-sm text-slate-400"
                      >
                        No rows match your filter.
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-emerald-50/40 group">
                      <td className="sticky left-0 z-[5] bg-white group-hover:bg-emerald-50/40 border-b border-r border-slate-100 px-3 py-2 text-[10px] font-mono text-slate-400 text-left">
                        {ri + 1}
                      </td>
                      {row.map((cell, ci) => {
                        const isEmpty = cell === EMPTY_PLACEHOLDER;
                        const col = accounting.headers[ci];
                        const numeric =
                          col === "Subtotal" ||
                          col === "VAT" ||
                          col === "Total" ||
                          col === "Tax %";
                        return (
                          <td
                            key={ci}
                            className={`border-b border-slate-100 px-3 py-2 whitespace-nowrap ${
                              numeric ? "text-right tabular-nums" : ""
                            } ${
                              isEmpty
                                ? "text-slate-300 italic"
                                : "text-slate-700"
                            }`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0">
                  <tr>
                    <td className="sticky left-0 z-[5] bg-emerald-50 border-t-2 border-emerald-300 px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 text-left">
                      Σ
                    </td>
                    {accounting.headers.map((col, i) => {
                      const sumCols: typeof ACCOUNTING_COLUMNS[number][] = [
                        "Subtotal",
                        "VAT",
                        "Total",
                      ];
                      const isSumCol = sumCols.includes(col);
                      let value = "";
                      if (i === 0) value = "TOTAL";
                      else if (isSumCol) {
                        let sum = 0;
                        for (const n of accounting.numericRows) {
                          const v = n[col];
                          if (typeof v === "number") sum += v;
                        }
                        value = formatAmount(sum);
                      }
                      return (
                        <td
                          key={col}
                          className={`bg-emerald-50 border-t-2 border-emerald-300 px-3 py-3 whitespace-nowrap text-sm font-bold text-emerald-800 ${
                            isSumCol ? "text-right tabular-nums" : ""
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ─── Footer ───────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {usedAI && (
                <span className="inline-flex items-center gap-1.5 text-purple-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Columns unified by AI across {documentCount} party template
                  {documentCount !== 1 ? "s" : ""}
                </span>
              )}
              {accounting.unmappedHeaders.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Dropped {accounting.unmappedHeaders.length} non-accounting
                  column{accounting.unmappedHeaders.length !== 1 ? "s" : ""}:{" "}
                  <span className="text-slate-400 truncate max-w-[260px]">
                    {accounting.unmappedHeaders.slice(0, 4).join(", ")}
                    {accounting.unmappedHeaders.length > 4 ? "…" : ""}
                  </span>
                </span>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Close preview
              </button>
              <button
                onClick={handleDownloadXlsx}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? "Preparing…" : "Download Excel"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  emphasise,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  emphasise?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 px-4 py-3 ${
        emphasise ? "bg-emerald-700" : "bg-emerald-600"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`font-bold truncate ${
          emphasise ? "text-xl text-white" : "text-base text-white"
        }`}
        title={value}
      >
        {value}
      </span>
      {hint && (
        <span className="text-[10px] text-emerald-200/80 truncate">{hint}</span>
      )}
    </div>
  );
}
