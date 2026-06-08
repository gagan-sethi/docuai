"use client";

import { motion } from "framer-motion";
import {
  ScanText,
  BrainCircuit,
  FileSpreadsheet,
  Smartphone,
  Shield,
  CreditCard,
  Layers,
  BarChart3,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: ScanText,
    title: "AI Document Extraction",
    description:
      "Automatically extract data from invoices, receipts, purchase orders, quotations, and financial documents.",
    color: "#1457c9",
    bgColor: "bg-primary/5",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Processing",
    description:
      "Send invoices and receipts directly via WhatsApp and receive structured financial data instantly.",
    color: "#16a34a",
    bgColor: "bg-green-50",
  },
  {
    icon: BrainCircuit,
    title: "Smart Document Understanding",
    description:
      "AI automatically identifies document types, suppliers, customers, VAT fields, payment terms, and accounting categories.",
    color: "#06b6d4",
    bgColor: "bg-secondary/5",
  },
  {
    icon: BarChart3,
    title: "Financial Dashboard",
    description:
      "Monitor revenue, expenses, profit, VAT payable, and document activity in real time.",
    color: "#f97316",
    bgColor: "bg-orange-50",
  },
  {
    icon: Layers,
    title: "Batch Processing",
    description:
      "Process hundreds of documents at once and export unified reports for VAT, reconciliation, and month-end close.",
    color: "#082f73",
    bgColor: "bg-accent/5",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel & CSV Export",
    description:
      "Download accounting-ready reports in a structured format for spreadsheets, ERP tools, and finance teams.",
    color: "#10b981",
    bgColor: "bg-success/5",
  },
  {
    icon: Building2,
    title: "Multi-Company Management",
    description:
      "Manage multiple companies, branches, or client entities from a single secure account.",
    color: "#0f766e",
    bgColor: "bg-teal-50",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access, audit logs, encrypted storage, and secure cloud infrastructure for sensitive finance data.",
    color: "#475569",
    bgColor: "bg-slate-50",
  },
  {
    icon: CreditCard,
    title: "Subscription & Billing Management",
    description:
      "Manage plans, usage limits, billing, and team access as your document volume grows.",
    color: "#db2777",
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Everything You Need to Automate{" "}
            <span className="gradient-text">Financial Operations</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Invonix connects document extraction, expense workflows, VAT
            reporting, analytics, and secure collaboration in one finance
            automation platform.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                  className="w-6 h-6"
                  style={{ color: feature.color }}
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
