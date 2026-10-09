"use client";

import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Layers,
  Receipt,
  ScanLine,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

/**
 * This section used to animate counters up to "500+ businesses",
 * "50,000+ documents processed" and "90%+ OCR accuracy". None of those
 * figures could be substantiated from the platform's own data, so they were
 * a launch blocker (CB-01, Oct 2026 QA review) and have been replaced with
 * statements that are true of the product as built.
 *
 * Do not reintroduce a usage counter here unless it reads a live figure from
 * the API, or the number is one the business can evidence on request.
 */
const capabilities = [
  {
    icon: Receipt,
    title: "Four document types",
    description:
      "Sales invoices, expense invoices, purchase orders and receipts, each classified with a confidence score.",
  },
  {
    icon: ScanLine,
    title: "Typed and handwritten",
    description:
      "Printed documents, scans and phone photos. The input type is detected per file, and you can override it.",
  },
  {
    icon: UserCheck,
    title: "Review before anything counts",
    description:
      "Extractions are proposals. Nothing enters your reports until someone in your workspace approves it.",
  },
  {
    icon: Layers,
    title: "Batch to one report",
    description:
      "Merge a month of documents from different suppliers into a single export with unified columns.",
  },
  {
    icon: FileSpreadsheet,
    title: "VAT-ready output",
    description:
      "Subtotal, tax rate, VAT amount and TRN captured per document, with a VAT report you can reconcile.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Files are stored privately and served through short-lived signed links. We do not train models on your data.",
  },
];

export default function Stats() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-secondary/[0.03]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wide text-primary">
            What Invonix Does
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for the way finance documents actually arrive
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Mixed formats, mixed suppliers, mixed currencies — captured,
            checked by a person, and exported in a shape your accountant can
            use.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100 transition-shadow hover:shadow-md"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
