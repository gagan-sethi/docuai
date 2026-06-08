"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  Building2,
  DollarSign,
  Layers,
  Receipt,
  Sigma,
  Sparkles,
  Table2,
} from "lucide-react";

const intelligenceFeatures = [
  { title: "Revenue Analysis", icon: BarChart3, color: "#1457c9" },
  { title: "Expense Tracking", icon: Receipt, color: "#db2777" },
  { title: "Profit & Loss Monitoring", icon: DollarSign, color: "#16a34a" },
  { title: "VAT Calculations", icon: Sigma, color: "#f97316" },
  { title: "Supplier Insights", icon: Building2, color: "#0f766e" },
  { title: "Expense Categorization", icon: Layers, color: "#082f73" },
  { title: "Financial Trends", icon: Table2, color: "#06b6d4" },
  { title: "Business Performance Monitoring", icon: Briefcase, color: "#475569" },
];

const dashboardRows = [
  { label: "Sales invoices", value: "$126,480", delta: "+18%" },
  { label: "Expense invoices", value: "$47,920", delta: "-6%" },
  { label: "VAT payable", value: "$8,140", delta: "Due" },
  { label: "Net profit", value: "$78,560", delta: "+24%" },
];

export default function FinancialIntelligence() {
  return (
    <section id="financial-intelligence" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 dot-pattern opacity-5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_0.95fr] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-white/90 mb-6">
              <Sparkles className="w-4 h-4 text-secondary" />
              Financial Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              AI-Powered{" "}
              <span className="text-secondary">Financial Intelligence</span>
            </h2>
            <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-2xl">
              Go beyond OCR and gain real business insights. Invonix turns
              extracted financial documents into reports, calculations,
              categories, and performance signals your team can act on.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {intelligenceFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}22` }}
                  >
                    <feature.icon
                      className="w-5 h-5"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {feature.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 sm:p-6 shadow-2xl shadow-black/20"
          >
            <div className="rounded-2xl bg-white text-slate-900 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Invonix Insights
                  </p>
                  <h3 className="text-lg font-bold">Financial overview</h3>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted">Current month</p>
                  <p className="text-sm font-semibold text-success">Live</p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {dashboardRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {row.label}
                      </p>
                      <p className="text-xs text-muted">AI categorized</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {row.value}
                      </p>
                      <p className="text-xs font-semibold text-primary">
                        {row.delta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-4 text-white">
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    AI recommendation
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">
                    Review top supplier spend and VAT variance before month-end
                    approval.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
