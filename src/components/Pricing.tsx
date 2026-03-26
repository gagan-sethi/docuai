"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small businesses getting started",
    features: [
      "100 documents/month",
      "PDF & image upload",
      "AI OCR extraction",
      "Excel & CSV export",
      "Email support",
      "1 user account",
    ],
    cta: "Start Free Trial",
    popular: false,
    gradient: "from-slate-600 to-slate-800",
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing teams with higher volume",
    features: [
      "1,000 documents/month",
      "Everything in Starter",
      "WhatsApp integration",
      "Bulk upload",
      "Priority support",
      "5 user accounts",
      "Sub-admin roles",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
    gradient: "from-primary to-primary-dark",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom needs",
    features: [
      "Unlimited documents",
      "Everything in Professional",
      "ERP integration",
      "Custom fields & workflows",
      "Dedicated account manager",
      "Unlimited users",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-accent to-violet-700",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32">
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
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Start free, upgrade when you&apos;re ready. No hidden fees, no long-term
            contracts.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl ${
                plan.popular
                  ? "bg-white shadow-2xl shadow-primary/10 border-2 border-primary/20 scale-105 z-10"
                  : "bg-white shadow-lg shadow-slate-100 border border-slate-100"
              } p-8 flex flex-col`}
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
                <h3 className="text-xl font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted mt-1">{plan.description}</p>
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
                href="/signup"
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
