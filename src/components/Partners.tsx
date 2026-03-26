"use client";

import { motion } from "framer-motion";
import {
  Users,
  Link2,
  BarChart3,
  DollarSign,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const partnerBenefits = [
  {
    icon: Link2,
    title: "Unique Referral Link",
    description:
      "Get a personalized referral link to share with your clients",
  },
  {
    icon: BarChart3,
    title: "Track Referrals",
    description:
      "Real-time dashboard showing referred clients and their activity",
  },
  {
    icon: DollarSign,
    title: "Earn Commission",
    description:
      "Earn recurring commissions on every referred client subscription",
  },
  {
    icon: Users,
    title: "Grow Together",
    description:
      "Help your clients automate while building a new revenue stream",
  },
];

export default function Partners() {
  return (
    <section id="partners" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900" />
      <div className="absolute inset-0 opacity-5 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
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
              Grow your revenue with our{" "}
              <span className="text-secondary">Affiliate Program</span>
            </h2>

            <p className="mt-5 text-lg text-slate-300 leading-relaxed">
              Perfect for accounting firms, consultants, and tech partners.
              Refer your clients to DocuAI and earn recurring commissions on
              every subscription.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Partner signup with unique referral links",
                "Automated tracking of referred clients",
                "Transparent commission dashboard",
                "Admin panel for partner management",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-sm text-white/80">{item}</span>
                </li>
              ))}
            </ul>

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

          {/* Right: Benefits Grid */}
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
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
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
