"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  FileText,
  Sparkles,
  Clock,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const chatMessages = [
  {
    type: "sent" as const,
    text: "Sending March expense receipts and PO-4521.pdf",
    time: "10:32 AM",
    file: true,
  },
  {
    type: "received" as const,
    text: "Documents received. Invonix is extracting financial data and classifying each file.",
    time: "10:32 AM",
  },
  {
    type: "received" as const,
    text: "Processing complete. 8 documents categorized, VAT fields found, and accounting-ready output is available.",
    time: "10:33 AM",
  },
];

const whatsappFeatures = [
  {
    icon: ShieldCheck,
    title: "No Login Required",
    desc: "Forward documents from mobile and let Invonix route them into the right finance workspace.",
  },
  {
    icon: Clock,
    title: "Instant Processing",
    desc: "Receive acknowledgments and processing status without waiting for a manual bookkeeping queue.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Extraction",
    desc: "Extract suppliers, customers, VAT fields, totals, categories, and line items automatically.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    desc: "Capture receipts, invoices, and purchase orders wherever your team receives them.",
  },
  {
    icon: FileText,
    title: "Accounting Ready Output",
    desc: "Reviewed data appears in the dashboard and can be exported to Excel, CSV, or accounting systems.",
  },
];

export default function WhatsAppSection() {
  return (
    <section id="whatsapp" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_46%,#ecfeff_100%)]" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-sm font-semibold text-green-700 mb-6">
            <MessageCircle className="w-4 h-4" />
            WhatsApp Processing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Your Finance Assistant{" "}
            <span className="text-green-600">on WhatsApp</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            Simply send invoices, receipts, and purchase orders to Invonix via
            WhatsApp and receive structured, accounting-ready financial data.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm">
              <div className="bg-white rounded-3xl shadow-2xl shadow-green-200/40 border border-green-100 overflow-hidden">
                <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Invonix Assistant</p>
                    <p className="text-[11px] text-green-100">Online - finance automation</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                </div>

                <div className="bg-[#e5ddd5] p-4 space-y-3 min-h-[320px]">
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.3 }}
                      className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          msg.type === "sent"
                            ? "bg-[#dcf8c6] rounded-tr-sm"
                            : "bg-white rounded-tl-sm"
                        }`}
                      >
                        {msg.file && (
                          <div className="flex items-center gap-2 mb-1.5 p-2 bg-white/60 rounded-lg border border-green-200">
                            <FileText className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="text-[11px] font-semibold text-slate-700">
                                finance-documents.zip
                              </p>
                              <p className="text-[9px] text-muted">8 files - PDF/JPG</p>
                            </div>
                          </div>
                        )}
                        <p className="text-[13px] text-slate-800 leading-relaxed">
                          {msg.text}
                        </p>
                        <p
                          className={`text-[10px] mt-1 text-right ${
                            msg.type === "sent"
                              ? "text-green-700/60"
                              : "text-slate-400"
                          }`}
                        >
                          {msg.time}
                          {msg.type === "sent" && " ✓✓"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-slate-100">
                  <div className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-xs text-slate-400">
                    Send a financial document...
                  </div>
                  <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="space-y-5 mb-8">
              {whatsappFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center flex-shrink-0 transition-colors">
                    <feature.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-green-500/20">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-100 uppercase tracking-wider">
                    WhatsApp Finance Inbox
                  </p>
                  <h3 className="text-xl font-bold">
                    Capture documents from the channel your team already uses.
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {["PDF", "JPG", "PNG", "Receipts", "Purchase Orders"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white/20 rounded-full"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-200" />
                <span className="text-green-100">
                  Instant processing - AI extraction - accounting-ready output
                </span>
              </div>
            </div>

            <Link
              href="/signup"
              className="mt-6 group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Start WhatsApp Processing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
