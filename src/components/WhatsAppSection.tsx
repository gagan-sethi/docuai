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
} from "lucide-react";
import Link from "next/link";

const chatMessages = [
  {
    type: "sent" as const,
    text: "Sending Invoice_March_2026.pdf",
    time: "10:32 AM",
    file: true,
  },
  {
    type: "received" as const,
    text: 'Document received and processing. We\'ll notify you when extraction is complete.',
    time: "10:32 AM",
  },
  {
    type: "received" as const,
    text: "Data extraction complete! Invoice #INV-2026-0394 — Total: AED 12,450.00. View in dashboard or download Excel.",
    time: "10:33 AM",
  },
];

const whatsappFeatures = [
  {
    icon: Send,
    title: "Just Forward Documents",
    desc: "Send invoices, POs, or receipts as photos or PDFs — like texting a colleague.",
  },
  {
    icon: Sparkles,
    title: "Auto-Processed by AI",
    desc: "Textract OCR + GPT-4o extracts all fields, line items, and totals automatically.",
  },
  {
    icon: Clock,
    title: "Instant Acknowledgments",
    desc: 'Receive confirmations: "Document received", "Extraction complete — view in dashboard".',
  },
  {
    icon: FileText,
    title: "Ready to Download",
    desc: "Extracted data appears in your dashboard. Review, approve, and download as Excel.",
  },
];

export default function WhatsAppSection() {
  return (
    <section id="whatsapp" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-white to-emerald-50/60" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-sm font-semibold text-green-700 mb-6">
            <MessageCircle className="w-4 h-4" />
            Main Feature — WhatsApp Integration
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Process documents{" "}
            <span className="text-green-600">via WhatsApp</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            No login needed. No dashboard required. Just send your invoices, purchase orders, or receipts
            to our WhatsApp number — and get structured Excel data back.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm">
              {/* Phone frame */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-green-200/40 border border-green-100 overflow-hidden">
                {/* WhatsApp header */}
                <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">DocuAI Bot</p>
                    <p className="text-[11px] text-green-100">Online · Instant replies</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  </div>
                </div>

                {/* Chat area */}
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
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                          msg.type === "sent"
                            ? "bg-[#dcf8c6] rounded-tr-sm"
                            : "bg-white rounded-tl-sm"
                        }`}
                      >
                        {msg.file && (
                          <div className="flex items-center gap-2 mb-1.5 p-2 bg-white/60 rounded-lg border border-green-200">
                            <FileText className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="text-[11px] font-semibold text-slate-700">Invoice_March_2026.pdf</p>
                              <p className="text-[9px] text-muted">2.4 MB · PDF</p>
                            </div>
                          </div>
                        )}
                        <p className="text-[13px] text-slate-800 leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${msg.type === "sent" ? "text-green-700/60" : "text-slate-400"}`}>
                          {msg.time}
                          {msg.type === "sent" && " ✓✓"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input bar */}
                <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-slate-100">
                  <div className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-xs text-slate-400">
                    Send a document...
                  </div>
                  <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Features + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="space-y-6 mb-8">
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
                    <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* WhatsApp number card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl shadow-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-100 uppercase tracking-wider">
                      Send Documents To
                    </p>
                    <p className="text-xl font-bold tracking-wide">+971 4 XXX XXXX</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {["PDF", "JPG", "PNG", "Photos"].map((fmt) => (
                  <span key={fmt} className="px-2.5 py-1 text-[11px] font-semibold bg-white/20 rounded-full">
                    {fmt}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-200" />
                <span className="text-green-100">Auto-processing · Instant replies · No login needed</span>
              </div>
            </div>

            <Link
              href="/signup"
              className="mt-6 group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Get Started with WhatsApp
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
