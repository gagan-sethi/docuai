"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import PlanComparison from "@/components/PlanComparison";
import { PRIMARY_CTA_LABEL, TRIAL_STRIP } from "@/lib/siteConfig";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Plan cards, from /api/plan/list */}
      <Pricing />

      {/* Comparison table, generated from the same plan data (CB-10) */}
      <PlanComparison />

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to automate finance operations?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Turn your invoices and receipts into reviewed, accounting-ready
              data, with VAT visibility you can reconcile.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="btn-shine group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-10 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all hover:scale-105 sm:w-auto"
              >
                {PRIMARY_CTA_LABEL}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/20 px-10 py-4 text-base font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">{TRIAL_STRIP}</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
