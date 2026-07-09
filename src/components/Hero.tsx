"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Upload,
  Sparkles,
  FileText,
  Table2,
  Receipt,
  Building2,
  Briefcase,
  MessageCircle,
  FileSpreadsheet,
  Package,
  HardHat,
  ShoppingCart,
  Factory,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const proofStats = [
  { value: "500+", label: "Businesses" },
  { value: "50,000+", label: "Documents processed" },
  { value: "90%+", label: "OCR accuracy" },
];

const typingPhrases = [
  "document-heavy businesses",
  "invoice-heavy teams",
  "VAT-ready finance teams",
  "regional finance teams",
];

const heroHighlights = [
  { text: "AI OCR + validation", icon: Sparkles },
  { text: "WhatsApp document intake", icon: MessageCircle },
  { text: "VAT-ready exports", icon: FileSpreadsheet },
];

const workspaceMetrics = [
  {
    label: "Ready for review",
    value: "1,284",
    detail: "+18% this month",
    icon: FileText,
    tone: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Avg. review time",
    value: "3 min",
    detail: "per batch",
    icon: Clock3,
    tone: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    label: "VAT payable",
    value: "$4,620",
    detail: "current period",
    icon: Table2,
    tone: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const documentRows = [
  {
    name: "Invoice_4821.pdf",
    source: "Trading supplier",
    amount: "$3,240",
    status: "Validated",
    icon: FileText,
    color: "text-primary",
  },
  {
    name: "Receipt_DXB.jpg",
    source: "Retail expense",
    amount: "$186",
    status: "Review",
    icon: Receipt,
    color: "text-rose-500",
  },
  {
    name: "VAT_Report.csv",
    source: "Tax summary",
    amount: "$4,620",
    status: "Ready",
    icon: Table2,
    color: "text-emerald-600",
  },
];

const extractedFields = [
  { label: "Supplier", value: "Acme Supplies LLC", confidence: "98%" },
  { label: "Document type", value: "Expense invoice", confidence: "99%" },
  { label: "VAT amount", value: "$620.00", confidence: "97%" },
  { label: "Category", value: "Office supplies", confidence: "96%" },
];

const trustedIndustries = [
  {
    name: "Trading Companies",
    detail: "Supplier bills and VAT",
    icon: Building2,
    color: "#1457c9",
  },
  {
    name: "Logistics Companies",
    detail: "Receipts and delivery notes",
    icon: Package,
    color: "#06b6d4",
  },
  {
    name: "Accounting Firms",
    detail: "Client books and exports",
    icon: Briefcase,
    color: "#0f766e",
  },
  {
    name: "Construction Companies",
    detail: "Project costs and invoices",
    icon: HardHat,
    color: "#f97316",
  },
  {
    name: "Retail Businesses",
    detail: "Daily receipts and expenses",
    icon: ShoppingCart,
    color: "#db2777",
  },
  {
    name: "Manufacturing Companies",
    detail: "Purchasing and spend",
    icon: Factory,
    color: "#475569",
  },
];

function TypingHeadlinePhrase() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState(typingPhrases[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = typingPhrases[phraseIndex];
    const isComplete = displayText === phrase;
    const isEmpty = displayText.length === 0;

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && isComplete) {
          setIsDeleting(true);
          return;
        }

        if (isDeleting && isEmpty) {
          setIsDeleting(false);
          setPhraseIndex((current) => (current + 1) % typingPhrases.length);
          return;
        }

        setDisplayText((current) =>
          isDeleting
            ? phrase.slice(0, Math.max(current.length - 1, 0))
            : phrase.slice(0, current.length + 1)
        );
      },
      !isDeleting && isComplete
        ? 1900
        : isDeleting && isEmpty
          ? 320
          : isDeleting
            ? 34
            : 58
    );

    return () => window.clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <span className="block gradient-text">
      <span className="inline-grid max-w-full align-baseline">
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 grid max-w-full"
        >
          {typingPhrases.map((phrase) => (
            <span key={phrase} className="col-start-1 row-start-1">
              {phrase}
            </span>
          ))}
        </span>

        <span className="col-start-1 row-start-1 inline-flex min-w-0 items-baseline">
          <span>{displayText || "\u00a0"}</span>
        </span>
      </span>
    </span>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 sm:pt-28 lg:pt-32">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_48%,#f5fbfb_100%)]" />
      <div className="absolute inset-0 dot-pattern opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(90deg,rgba(20,87,201,0.08),rgba(14,165,233,0.07),rgba(16,185,129,0.06))]" />
      <div className="absolute inset-x-0 top-48 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/90 px-4 py-2 text-sm font-semibold text-primary shadow-sm shadow-primary/10"
            >
              <BadgeCheck className="h-4 w-4" />
              <span>Trusted across the UAE, GCC & Africa</span>
            </motion.div>

            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.03] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              AI finance automation for{" "}
              <TypingHeadlinePhrase />
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl lg:mx-0">
              Capture, verify, and export invoices, receipts, purchase orders,
              and VAT records from upload or WhatsApp. Invonix turns every file
              into accounting-ready data with human review built in.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-dark via-primary to-secondary px-7 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-primary/40 sm:w-auto"
              >
                <Upload className="h-5 w-5" />
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-4 text-base font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:w-auto"
              >
                Book Demo
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500 lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Free 14-day trial
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure finance workspace
              </span>
            </div>

            <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm shadow-slate-200/70 lg:mx-0">
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                {proofStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-4 text-left sm:px-5 sm:py-5"
                  >
                    <p className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium leading-snug text-slate-500 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              {heroHighlights.map((item) => (
                <div
                  key={item.text}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/60"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto max-w-[660px] lg:ml-auto">
              <div className="rounded-[1.7rem] border border-slate-200 bg-white/90 p-2 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur">
                <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    </div>
                    <div className="min-w-0 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Invonix Finance Hub
                      </p>
                      <p className="truncate text-sm font-extrabold text-slate-950">
                        Finance review workspace
                      </p>
                    </div>
                    <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </div>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_58%,#f6fbfb_100%)] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-primary">
                          Month-end close workspace
                        </p>
                        <h3 className="mt-1 max-w-md text-lg font-extrabold text-slate-950 sm:text-xl">
                          Documents reviewed, validated, and ready to export
                        </h3>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        72% faster close
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {workspaceMetrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm shadow-slate-200/60"
                        >
                          <div
                            className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${metric.bg}`}
                          >
                            <metric.icon className={`h-4 w-4 ${metric.tone}`} />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {metric.label}
                          </p>
                          <p
                            className={`mt-1 text-xl font-extrabold tracking-tight ${metric.tone}`}
                          >
                            {metric.value}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                            {metric.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Processing queue
                            </p>
                            <p className="text-sm font-extrabold text-slate-950">
                              Today&apos;s documents
                            </p>
                          </div>
                          <BadgeCheck className="h-5 w-5 text-emerald-500" />
                        </div>

                        <div className="space-y-2.5">
                          {documentRows.map((doc) => (
                            <div
                              key={doc.name}
                              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                                <doc.icon className={`h-4 w-4 ${doc.color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-extrabold text-slate-900">
                                  {doc.name}
                                </p>
                                <p className="truncate text-[11px] font-medium text-slate-500">
                                  {doc.source}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-extrabold text-slate-900">
                                  {doc.amount}
                                </p>
                                <p className="text-[10px] font-bold text-primary">
                                  {doc.status}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                                AI extraction
                              </p>
                              <p className="truncate text-xs font-semibold text-slate-500">
                                Accounting-ready fields
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                            98%
                          </span>
                        </div>

                        <div className="space-y-2">
                          {extractedFields.map((field) => (
                            <div
                              key={field.label}
                              className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"
                            >
                              <span className="truncate text-[11px] font-semibold text-slate-500">
                                {field.label}
                              </span>
                              <span className="truncate text-right text-xs font-extrabold text-slate-900">
                                {field.value}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                {field.confidence}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs font-extrabold text-emerald-800">
                            VAT-ready record created automatically
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">
                            Supplier, total, tax amount, and category are ready
                            for approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="mt-14 border-t border-slate-200 pt-10 lg:mt-20 lg:pt-12"
        >
          <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary">
                Trusted By
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Trusted by Businesses Across the UAE, GCC & Africa
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                Built for teams that manage invoices, receipts, purchase
                documents, VAT records, and client exports at regional scale.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {proofStats.map((stat) => (
                  <span
                    key={stat.label}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm shadow-slate-200/50"
                  >
                    {stat.value} {stat.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {trustedIndustries.map((industry, i) => (
                <motion.div
                  key={industry.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05 + i * 0.06 }}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm shadow-slate-200/40 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${industry.color}14` }}
                  >
                    <industry.icon
                      className="h-5 w-5"
                      style={{ color: industry.color }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">
                      {industry.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {industry.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
