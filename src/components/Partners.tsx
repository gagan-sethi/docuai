"use client";

import { motion } from "framer-motion";
import {
  Users,
  Link2,
  BarChart3,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Headphones,
} from "lucide-react";
import Link from "next/link";

const designedFor = [
  "Accounting Firms",
  "Bookkeepers",
  "Tax Consultants",
  "ERP Consultants",
  "Business Advisors",
];

const partnerBenefits = [
  {
    icon: DollarSign,
    title: "Recurring Commissions",
    description:
      "Earn recurring commissions when your clients automate finance operations with Invonix.",
  },
  {
    icon: Link2,
    title: "Referral Tracking",
    description:
      "Use unique referral links and transparent attribution for every client signup.",
  },
  {
    icon: BarChart3,
    title: "Partner Dashboard",
    description:
      "Track referred clients, plan activity, commissions, and performance in one place.",
  },
  {
    icon: Users,
    title: "Client Management",
    description:
      "Support multiple client companies and help them move from manual bookkeeping to automation.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description:
      "Get partner enablement, onboarding help, and sales support for larger client accounts.",
  },
];

export default function Partners() {
  return (
    <section id="partners" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900" />
      <div className="absolute inset-0 opacity-5 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-white/90 mb-6">
              <Users className="w-4 h-4" />
              Partner Program
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Partner Program for Accounting Firms{" "}
              <span className="text-secondary">& Consultants</span>
            </h2>

            <p className="mt-5 text-lg text-slate-300 leading-relaxed">
              Help clients automate invoices, expenses, VAT reporting, and
              financial visibility while building a recurring revenue stream
              around modern finance automation.
            </p>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-secondary" />
                <p className="text-sm font-semibold text-white">Designed for</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-3">
                {designedFor.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-sm text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <Link
                href="/signup"
                className="btn-shine group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-900 bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                Become a Partner
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-6"
          >
            {partnerBenefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors ${
                  i === partnerBenefits.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
