"use client";

import { motion } from "framer-motion";
import {
  ScanText,
  BrainCircuit,
  TableProperties,
  FileSpreadsheet,
  Smartphone,
  Shield,
  Users,
  CreditCard,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: ScanText,
    title: "AI-Powered OCR",
    description:
      "Extract text from PDFs, images, and scanned documents with 90–95% accuracy. Handles low-quality photos, tables, and complex layouts.",
    color: "from-primary to-indigo-600",
    bgColor: "bg-primary/5",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Integration",
    description:
      "Send invoices & POs via WhatsApp — auto-processed instantly. No login needed. Our #1 feature for mobile-first businesses.",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
  },
  {
    icon: BrainCircuit,
    title: "Smart Document Understanding",
    description:
      "AI automatically detects product codes, quantities, prices, customer details, dates, and PO numbers — no templates required.",
    color: "from-secondary to-cyan-600",
    bgColor: "bg-secondary/5",
  },
  {
    icon: FileSpreadsheet,
    title: "Download Excel Instantly",
    description:
      "One-click Excel export after processing. Get structured XLSX or CSV files ready for your accounting system or ERP.",
    color: "from-success to-emerald-600",
    bgColor: "bg-success/5",
  },
  {
    icon: Layers,
    title: "AI Batch Merge to One Sheet",
    description:
      "Select 100s of invoices — AI unifies vendor columns (VAT No, Tax ID, GSTIN → one column) and exports a single audit-ready spreadsheet.",
    color: "from-primary to-secondary",
    bgColor: "bg-primary/5",
  },
  {
    icon: TableProperties,
    title: "Structured Data Output",
    description:
      "Converts unstructured documents into clean, structured datasets with customer codes, product details, quantities, and totals.",
    color: "from-accent to-violet-600",
    bgColor: "bg-accent/5",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "End-to-end encryption, secure file storage on AWS S3, role-based access control, and protected API endpoints.",
    color: "from-slate-600 to-slate-800",
    bgColor: "bg-slate-50",
  },
  {
    icon: Users,
    title: "Role-Based Dashboard",
    description:
      "Admin, sub-admin, and end-user roles with appropriate permissions. Upload, view, edit, and export from one place.",
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: CreditCard,
    title: "Subscription Billing",
    description:
      "Stripe-powered subscription billing with auto-renewal, automated invoicing, and commission tracking for partners.",
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-50",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Everything you need to{" "}
            <span className="gradient-text">automate</span> document processing
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            From upload to structured export — our AI handles every step of your
            document workflow with precision and speed.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon
                  className={`w-6 h-6 bg-gradient-to-r ${feature.color} bg-clip-text`}
                  style={{
                    color: feature.color.includes("primary")
                      ? "#4f46e5"
                      : feature.color.includes("secondary")
                      ? "#06b6d4"
                      : feature.color.includes("accent")
                      ? "#8b5cf6"
                      : feature.color.includes("success")
                      ? "#10b981"
                      : feature.color.includes("green")
                      ? "#22c55e"
                      : feature.color.includes("slate")
                      ? "#475569"
                      : feature.color.includes("orange")
                      ? "#f97316"
                      : "#ec4899",
                  }}
                />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
