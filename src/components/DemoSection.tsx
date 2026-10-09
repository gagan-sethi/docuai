"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Upload,
  FileText,
  Info,
  Sparkles,
  CheckCircle2,
  Download,
  X,
  Loader2,
} from "lucide-react";

type ProcessingState = "idle" | "uploading" | "processing" | "done";

interface ExtractedRow {
  field: string;
  value: string;
  confidence: number;
}

/**
 * Fixed sample output, not a live extraction.
 *
 * The section used to claim it processed the file "in real time" and to
 * report a "Grand Total $12,040.00" that silently dropped the VAT line, with
 * a VAT figure that was 5.15% of the subtotal rather than the 5% it claimed
 * (CB-03, Oct 2026 QA review). The totals below are now internally
 * consistent and are asserted at module load, so the numbers cannot drift
 * apart again unnoticed.
 */
const SAMPLE_CURRENCY = "AED";
const SAMPLE_VAT_RATE = 0.05;
const sampleLineItemValues = [
  { code: "PRD-001", name: "Industrial Pump A300", qty: 5, unitPrice: 1250 },
  { code: "PRD-042", name: "Valve Assembly V12", qty: 12, unitPrice: 340 },
  { code: "PRD-108", name: "Seal Kit SK-Pro", qty: 20, unitPrice: 85.5 },
];

function formatSampleMoney(amount: number): string {
  return `${SAMPLE_CURRENCY} ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const sampleSubtotal = sampleLineItemValues.reduce(
  (sum, item) => sum + item.qty * item.unitPrice,
  0
);
const sampleVat = Math.round(sampleSubtotal * SAMPLE_VAT_RATE * 100) / 100;
const sampleGrandTotal = Math.round((sampleSubtotal + sampleVat) * 100) / 100;

const sampleLineItems = sampleLineItemValues.map((item) => ({
  code: item.code,
  name: item.name,
  qty: item.qty,
  price: formatSampleMoney(item.unitPrice),
  total: formatSampleMoney(item.qty * item.unitPrice),
}));

const sampleData: ExtractedRow[] = [
  { field: "Document Type", value: "Expense invoice", confidence: 99 },
  { field: "Supplier Name", value: "Hamdan Trading LLC", confidence: 97 },
  { field: "Accounting Category", value: "Inventory Purchase", confidence: 95 },
  { field: "Invoice Number", value: "INV-2026-08472", confidence: 99 },
  { field: "Subtotal", value: formatSampleMoney(sampleSubtotal), confidence: 98 },
  { field: "VAT (5%)", value: formatSampleMoney(sampleVat), confidence: 98 },
  { field: "PO Number", value: "PO-55219", confidence: 96 },
];

export default function DemoSection() {
  const [state, setState] = useState<ProcessingState>("idle");
  const [dragActive, setDragActive] = useState(false);

  const simulateProcessing = useCallback(() => {
    setState("uploading");
    setTimeout(() => setState("processing"), 1200);
    setTimeout(() => setState("done"), 3500);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) simulateProcessing();
    },
    [simulateProcessing]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) simulateProcessing();
    },
    [simulateProcessing]
  );

  const reset = () => {
    setState("idle");
  };

  return (
    <section id="demo" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/[0.02] to-white" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Sample Output
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            What an extraction{" "}
            <span className="gradient-text">looks like</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            A walkthrough of the fields Invonix returns for a typical supplier
            invoice: document type, supplier, VAT and line items, each with a
            confidence score.
          </p>
          <p className="mx-auto mt-5 inline-flex max-w-xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm font-medium text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            This is a fixed sample, not a live extraction. Nothing you drop here
            is uploaded or processed.{" "}
            <Link href="/signup" className="underline">
              Create a free account
            </Link>{" "}
            to run your own documents.
          </p>
        </motion.div>

        {/* Demo Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl blur-2xl scale-105" />

          <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium text-slate-400">
                  Invonix — sample extraction
                </span>
              </div>
              {state !== "idle" && (
                <button
                  onClick={reset}
                  className="text-xs text-muted hover:text-slate-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            <div className="p-8 lg:p-12">
              <AnimatePresence mode="wait">
                {/* IDLE STATE — Upload zone */}
                {state === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div
                      className={`drop-zone rounded-2xl p-12 text-center cursor-pointer transition-all ${
                        dragActive ? "active" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                    >
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                      />
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Upload className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-lg font-semibold text-slate-700">
                        Preview the extraction walkthrough
                      </p>
                      <p className="text-sm text-muted mt-2">
                        Your file stays on your device — the walkthrough always
                        shows the same sample invoice
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          simulateProcessing();
                        }}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Show the sample result
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* UPLOADING / PROCESSING STATE */}
                {(state === "uploading" || state === "processing") && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-12"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-ping" />
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {state === "uploading"
                        ? "Opening the sample..."
                        : "Showing how extraction works..."}
                    </h3>
                    <p className="text-sm text-muted mt-2">
                      {state === "uploading"
                        ? "Nothing is uploaded — this is a local walkthrough"
                        : "In the product this step runs OCR, VAT detection and classification"}
                    </p>
                    {/* Progress bar */}
                    <div className="max-w-md mx-auto mt-8">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{
                            width: state === "uploading" ? "40%" : "90%",
                          }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        />
                      </div>
                    </div>
                    {state === "processing" && (
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                        {[
                          "Document Extraction",
                          "VAT Detection",
                          "Expense Categorization",
                          "Financial Structuring",
                        ].map((label, i) => (
                          <motion.span
                            key={label}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.3 }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted px-3 py-1.5 bg-slate-50 rounded-full"
                          >
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1,
                                ease: "linear",
                              }}
                            >
                              <Sparkles className="w-3 h-3 text-primary" />
                            </motion.span>
                            {label}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* DONE STATE — Results */}
                {state === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    {/* Success header */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          Sample extraction result
                        </h3>
                        <p className="text-sm text-muted">
                          Fixed sample output • not a live extraction
                        </p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Extracted fields */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">
                          Document Fields
                        </h4>
                        <div className="space-y-2">
                          {sampleData.map((row, i) => (
                            <motion.div
                              key={row.field}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-50/80 hover:bg-primary/5 transition-colors"
                            >
                              <span className="text-sm text-muted">
                                {row.field}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800">
                                  {row.value}
                                </span>
                                <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                                  {row.confidence}%
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Line items table */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">
                          Line Items
                        </h4>
                        <div className="overflow-hidden rounded-xl border border-slate-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs">
                                  Code
                                </th>
                                <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs">
                                  Item
                                </th>
                                <th className="px-3 py-2.5 text-center font-semibold text-slate-600 text-xs">
                                  Qty
                                </th>
                                <th className="px-3 py-2.5 text-right font-semibold text-slate-600 text-xs">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {sampleLineItems.map((item, i) => (
                                <motion.tr
                                  key={item.code}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3 + i * 0.1 }}
                                  className="hover:bg-primary/[0.02] transition-colors"
                                >
                                  <td className="px-3 py-2.5 font-mono text-xs text-muted">
                                    {item.code}
                                  </td>
                                  <td className="px-3 py-2.5 font-medium text-slate-700 text-xs">
                                    {item.name}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-xs">
                                    {item.qty}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-semibold text-slate-800 text-xs">
                                    {item.total}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50/60">
                                <td
                                  colSpan={3}
                                  className="px-3 py-2 text-right font-medium text-slate-500 text-xs"
                                >
                                  Subtotal
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-700 text-xs tabular-nums">
                                  {formatSampleMoney(sampleSubtotal)}
                                </td>
                              </tr>
                              <tr className="bg-slate-50/60">
                                <td
                                  colSpan={3}
                                  className="px-3 py-2 text-right font-medium text-slate-500 text-xs"
                                >
                                  VAT 5%
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-700 text-xs tabular-nums">
                                  {formatSampleMoney(sampleVat)}
                                </td>
                              </tr>
                              <tr className="bg-slate-50">
                                <td
                                  colSpan={3}
                                  className="px-3 py-2.5 text-right font-semibold text-slate-600 text-xs"
                                >
                                  Grand Total
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-primary text-sm tabular-nums">
                                  {formatSampleMoney(sampleGrandTotal)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                      <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                      >
                        <Download className="w-4 h-4" />
                        Run this on your own documents
                      </Link>
                      <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted hover:text-slate-700 transition-colors"
                      >
                        Replay the walkthrough
                      </button>
                      <p className="w-full text-xs text-slate-400 sm:w-auto">
                        Excel and CSV export are available inside the product.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
