"use client";

import { motion } from "framer-motion";
import {
  Upload,
  ScanSearch,
  BrainCircuit,
  Table2,
  FileDown,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Documents",
    description:
      "Drag & drop PDFs, photos, or scanned documents. Supports bulk upload and WhatsApp integration.",
    color: "#4f46e5",
    detail: "PDF, JPG, PNG, Scanned docs",
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "AI OCR Processing",
    description:
      "Our AI engine extracts text, tables, rows, and columns with advanced preprocessing for best results.",
    color: "#06b6d4",
    detail: "Deskewing, denoising, enhancement",
  },
  {
    icon: BrainCircuit,
    step: "03",
    title: "Smart Structuring",
    description:
      "AI understands document context and organizes data into clean, structured datasets automatically.",
    color: "#8b5cf6",
    detail: "No templates required",
  },
  {
    icon: Table2,
    step: "04",
    title: "Review & Edit",
    description:
      "View extracted data in a clear table format. Edit any values for perfect accuracy before export.",
    color: "#10b981",
    detail: "Visual correction interface",
  },
  {
    icon: FileDown,
    step: "05",
    title: "Export & Integrate",
    description:
      "Download as Excel or CSV, or push directly to your ERP system via API integration.",
    color: "#f97316",
    detail: "XLSX, CSV, API",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 opacity-5 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="inline-block text-sm font-semibold text-secondary tracking-wide uppercase mb-3">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            From document to data{" "}
            <span className="text-secondary">in seconds</span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 leading-relaxed">
            Five simple steps to transform any document into structured,
            actionable data.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-20 -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:-translate-y-2 h-full">
                  {/* Step number */}
                  <div
                    className="text-5xl font-black opacity-5 absolute top-4 right-4"
                    style={{ color: step.color }}
                  >
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <step.icon
                      className="w-7 h-7"
                      style={{ color: step.color }}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Detail tag */}
                  <div
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${step.color}10`,
                      color: step.color,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>

                {/* Arrow between steps */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
