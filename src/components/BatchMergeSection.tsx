"use client";

import { motion } from "framer-motion";
import {
  Layers,
  CheckSquare,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  MessageCircle,
  Bot,
  Files,
  Sigma,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: CheckSquare,
    title: "Select many",
    description:
      "Tick the invoices, receipts or POs you want — or hit Select All on a whole month of documents.",
  },
  {
    icon: Bot,
    title: "AI unifies columns",
    description:
      "GPT normalises mismatched headers across vendors — \u201cVAT No\u201d, \u201cTax ID\u201d, \u201cGSTIN\u201d all collapse into one canonical column.",
  },
  {
    icon: FileSpreadsheet,
    title: "One audit-ready sheet",
    description:
      "Download a single Excel/CSV with every invoice as a row and unified columns — drop it straight into your audit folder.",
  },
];

const previewColumns = [
  "Party Name",
  "Invoice Number",
  "Invoice Date",
  "VAT Number",
  "Subtotal",
  "Tax",
  "Total",
];

const previewRows = [
  ["Acme Trading LLC", "INV-2042", "12 Apr 2026", "100123456700003", "1,250.00", "62.50", "1,312.50"],
  ["Gulf Logistics", "GL/2026/881", "13 Apr 2026", "100987654300003", "4,800.00", "240.00", "5,040.00"],
  ["Emirates Supply Co", "ESC-7741", "14 Apr 2026", "100456789900003", "920.50", "46.03", "966.53"],
  ["Al-Rajhi Wholesale", "AR-23 / 8821", "15 Apr 2026", "100222111100003", "12,400.00", "620.00", "13,020.00"],
];

export default function BatchMergeSection() {
  return (
    <section
      id="batch-merge"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/30 to-white" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            <Sparkles className="w-4 h-4" />
            New · AI Batch Merge
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            100 invoices →{" "}
            <span className="gradient-text">one audit-ready spreadsheet</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Stop copy-pasting from PDFs into Excel. Select any number of
            documents, let our AI unify the columns across vendors, and review
            a single clean sheet — with grand totals already calculated, no
            empty columns, and zero <code className="text-[0.95em] px-1 rounded bg-slate-100">null</code>{" "}
            values — perfect for VAT returns, audits, and reconciliation.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> No null values
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> AI-unified columns
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <Sigma className="w-3.5 h-3.5" /> Auto grand-total
            </span>
          </div>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Steps */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-5 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary">
                      STEP {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* WhatsApp callout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex gap-4 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Works on WhatsApp too
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Forward a batch of invoices to our WhatsApp number — turn on{" "}
                  <span className="font-semibold">Auto-merge</span> and we&apos;ll
                  reply with one combined Excel link instead of one message per
                  file.
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Try Batch Merge Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                See how it works
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Visual mock */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            {/* Stack of "selected" doc tiles */}
            <div className="relative mb-6 flex justify-center">
              <div className="relative">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 * i }}
                    className="absolute w-44 h-12 rounded-xl bg-white border border-slate-200 shadow-md flex items-center gap-3 px-3"
                    style={{
                      top: `${i * 14}px`,
                      left: `${i * 18}px`,
                      zIndex: 4 - i,
                    }}
                  >
                    <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                      <CheckSquare className="w-3 h-3 text-white" />
                    </div>
                    <Files className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 truncate">
                      invoice-{2042 + i}.pdf
                    </span>
                  </motion.div>
                ))}
                <div className="w-44 h-[110px]" />
              </div>
            </div>

            {/* Arrow + AI badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex justify-center mb-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                AI unifies columns…
              </div>
            </motion.div>

            {/* Excel-style preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-300/50 overflow-hidden"
            >
              {/* File header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  docuai-merged-april.csv
                </span>
                <span className="ml-auto text-xs text-emerald-100">
                  4 documents · 7 unified columns
                </span>
              </div>

              {/* Spreadsheet */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {previewColumns.map((c) => (
                        <th
                          key={c}
                          className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-2 text-slate-700 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Auto-totals row */}
                    <tr className="bg-emerald-50 border-t-2 border-emerald-300">
                      <td className="px-3 py-2 font-bold text-emerald-800 whitespace-nowrap">
                        TOTAL
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2 font-bold text-emerald-800 whitespace-nowrap">
                        19,370.50
                      </td>
                      <td className="px-3 py-2 font-bold text-emerald-800 whitespace-nowrap">
                        968.53
                      </td>
                      <td className="px-3 py-2 font-bold text-emerald-800 whitespace-nowrap">
                        20,339.03
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer note */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                Columns from 4 different vendor templates merged automatically — grand totals computed for you.
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
