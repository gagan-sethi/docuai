"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadPublicPlans,
  planSignupHref,
  type DisplayPlan,
} from "@/lib/plans";
import { TRIAL_ENABLED, TRIAL_DAYS } from "@/lib/siteConfig";

function PricingHeader({ loading }: { loading?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mx-auto mb-14 max-w-3xl text-center"
    >
      <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Pricing
      </span>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        Plans for every{" "}
        <span className="gradient-text">finance automation stage</span>
      </h2>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        Start with document automation, then add VAT reporting, multi-company
        and team controls as your finance operations grow.
      </p>
      <p className="mt-4 text-sm font-medium text-slate-500">
        {TRIAL_ENABLED
          ? `All paid plans include a ${TRIAL_DAYS}-day free trial. No credit card required to start.`
          : "Start on the free plan — no credit card required. Upgrade when your volume grows."}
      </p>
    </motion.div>
  );
}

function PricingSkeleton() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface to-white" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingHeader loading />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="min-h-[520px] rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="mt-6 h-7 w-40 rounded bg-slate-100" />
              <div className="mt-4 h-20 rounded bg-slate-100" />
              <div className="mt-8 h-12 w-36 rounded bg-slate-100" />
              <div className="mt-8 space-y-3">
                {[0, 1, 2, 3].map((line) => (
                  <div key={line} className="h-4 rounded bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanMeta({ icon: Icon, text }: { icon: typeof FileText; text?: string }) {
  if (!text) return null;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function PricingCard({ plan, index }: { plan: DisplayPlan; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`relative flex h-full min-h-[560px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 ${
        plan.popular ? "border-primary/35 ring-1 ring-primary/15" : "border-slate-100"
      }`}
    >
      <div className="flex min-h-[42px] items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span>{plan.positioning}</span>
        </div>
        {plan.badge && (
          <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-bold text-primary">
            {plan.hasDiscount ? (
              <Tag className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {plan.badge}
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-xl font-bold text-slate-950">{plan.displayName}</h3>
        <p className="mt-3 min-h-[66px] text-sm leading-relaxed text-muted">
          {plan.description}
        </p>
      </div>

      <div className="my-6 border-y border-slate-100 py-5">
        {plan.originalPrice && (
          <div className="mb-1 text-sm font-semibold text-slate-400 line-through">
            {plan.originalPrice}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="max-w-full break-words text-4xl font-extrabold tracking-normal text-slate-950">
            {plan.displayPrice}
          </span>
          {plan.period && (
            <span className="pb-1 text-sm font-semibold text-muted">{plan.period}</span>
          )}
        </div>
        <p className="mt-2 min-h-[20px] text-sm text-slate-500">{plan.billingNote}</p>
      </div>

      <div className="grid gap-2 pb-5">
        <PlanMeta icon={FileText} text={plan.docsDisplay} />
        <PlanMeta icon={Layers} text={plan.pagesDisplay} />
        <PlanMeta icon={Users} text={plan.userDisplay} />
        <PlanMeta icon={Building2} text={plan.companyDisplay} />
        <PlanMeta icon={Database} text={plan.storageDisplay} />
      </div>

      <ul className="flex-1 space-y-3 border-t border-slate-100 pt-5">
        {plan.features.slice(0, 7).map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            <span className="text-sm leading-relaxed text-slate-600">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={planSignupHref(plan)}
        className={`btn-shine group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-200 ${
          plan.popular
            ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
            : "border border-slate-200 bg-slate-50 text-slate-800 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}

function gridClass(planCount: number): string {
  if (planCount <= 1) return "max-w-md";
  if (planCount === 2) return "max-w-4xl md:grid-cols-2";
  if (planCount === 3) return "max-w-6xl md:grid-cols-2 lg:grid-cols-3";
  return "max-w-7xl md:grid-cols-2 xl:grid-cols-4";
}

export default function Pricing() {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");

  useEffect(() => {
    let cancelled = false;

    loadPublicPlans().then((result) => {
      if (cancelled) return;
      setPlans(result.plans);
      setSource(result.source);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PricingSkeleton />;
  }

  return (
    <section
      id="pricing"
      data-pricing-source={source}
      data-plan-count={plans.length}
      className="relative py-24 lg:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface to-white" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingHeader />

        <div
          className={`mx-auto grid grid-cols-1 items-stretch gap-6 ${gridClass(plans.length)}`}
        >
          {plans.map((plan, i) => (
            <PricingCard key={plan.key} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
