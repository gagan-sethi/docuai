"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    positioning: "For Small Businesses",
    description: "Automate core invoice, receipt, and expense workflows.",
    features: [
      "100 documents/month",
      "AI document extraction",
      "Expense tracking",
      "Excel & CSV export",
      "Basic financial dashboard",
      "1 user account",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    positioning: "For Growing Businesses",
    description: "Scale finance automation across teams and document channels.",
    features: [
      "1,000 documents/month",
      "Everything in Starter",
      "WhatsApp processing",
      "Batch processing",
      "VAT reporting",
      "Financial analytics",
      "5 user accounts",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Accounting Firm",
    price: "$299",
    period: "/month",
    positioning: "For Accountants & Bookkeepers",
    description: "Manage client companies, referrals, and accounting-ready exports.",
    features: [
      "Multi-company management",
      "Client workspaces",
      "Partner dashboard",
      "Referral tracking",
      "Bulk document review",
      "Recurring commission support",
      "Team permissions",
    ],
    cta: "Become a Partner",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    positioning: "For Large Organizations",
    description: "Advanced security, integrations, and workflows for high-volume finance teams.",
    features: [
      "Unlimited document volume",
      "Everything in Professional",
      "ERP and accounting integrations",
      "Custom approval workflows",
      "Role-based access",
      "Audit logs",
      "Dedicated account manager",
      "SLA support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32">
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
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Plans for every{" "}
            <span className="gradient-text">finance automation stage</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Start with document automation, add WhatsApp, VAT reporting, client
            management, and enterprise controls as your finance operations grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-6 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl ${
                plan.popular
                  ? "bg-white shadow-2xl shadow-primary/10 border-2 border-primary/20 xl:scale-105 z-10"
                  : "bg-white shadow-lg shadow-slate-100 border border-slate-100"
              } p-7 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-lg shadow-primary/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    {plan.positioning}
                  </p>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-muted">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "#demo" : "/signup"}
                className={`btn-shine group w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                  plan.popular
                    ? "text-white bg-gradient-to-r from-primary to-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
                    : "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
