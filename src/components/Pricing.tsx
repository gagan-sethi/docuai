"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

// Define the PlanOption type (matching the modal)
type PlanOption = {
  _id?: string;
  id?: string;
  name?: string;
  label?: string;
  price?: number;
  discountedPrice?: number;
  discountApplied?: boolean;
  appliedDiscountPercent?: number;
  discountPercent?: number;
  interval?: string;
  documentsPerMonth?: number | string;
  features?: string[];
  visibility?: "public" | "hidden";
  isTrial?: boolean;
  trialDays?: number;
  isTrialEligible?: boolean;
  hasUsedTrial?: boolean;
  campaignDiscount?: any | null;
};

// Define the display plan type
type DisplayPlan = PlanOption & {
  displayName: string;
  displayPrice: string;
  period: string;
  positioning: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  docsDisplay: string;
  isEnterprise: boolean;
  isFree: boolean;
  actualPrice: number;
};

// Hardcoded fallback plans if API fails
const fallbackPlans: PlanOption[] = [
  {
    name: "Starter",
    label: "Starter",
    price: 49,
    interval: "month",
    features: [
      "100 documents/month",
      "AI document extraction",
      "Expense tracking",
      "Excel & CSV export",
      "Basic financial dashboard",
      "1 user account",
    ],
  },
  {
    name: "Professional",
    label: "Professional",
    price: 149,
    interval: "month",
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
  },
  {
    name: "Accounting Firm",
    label: "Accounting Firm",
    price: 299,
    interval: "month",
    features: [
      "Multi-company management",
      "Client workspaces",
      "Partner dashboard",
      "Referral tracking",
      "Bulk document review",
      "Recurring commission support",
      "Team permissions",
    ],
  },
  {
    name: "Enterprise",
    label: "Enterprise",
    price: 0,
    interval: "",
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
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch plans from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl("/api/plan/list"), {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled && json?.success) {
          console.log("Fetched plans:", json.data);
          setPlans(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to format price
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Map API plans to display format
  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  // Map API plan to the display format
  const mappedPlans: DisplayPlan[] = displayPlans.map((plan) => {
    const price = plan.price ?? 0;
    const isFree = price === 0;
    const isEnterprise = plan.name?.toLowerCase().includes("enterprise") || false;
    
    // Determine if it's popular (you can set logic based on your data)
    const isPopular = plan.name?.toLowerCase().includes("professional") || 
                      plan.name?.toLowerCase().includes("popular") || false;

    // Format positioning based on plan name
    let positioning = "For Small Businesses";
    if (plan.name?.toLowerCase().includes("professional")) {
      positioning = "For Growing Businesses";
    } else if (plan.name?.toLowerCase().includes("accounting") || plan.name?.toLowerCase().includes("firm")) {
      positioning = "For Accountants & Bookkeepers";
    } else if (plan.name?.toLowerCase().includes("enterprise")) {
      positioning = "For Large Organizations";
    }

    // Format price display
    let priceDisplay = isFree ? "Free" : usdFormatter.format(price);
    if (isEnterprise) priceDisplay = "Custom";

    // Format period - FIXED: Don't show /month for free plans
    const period = isFree ? "" : (plan.interval ? `/${plan.interval}` : "");

    // Format features - ensure it's an array
    const features = plan.features || [
      "AI document extraction",
      "Excel & CSV export",
      "Basic financial dashboard",
    ];

    // Determine CTA text
    let cta = "Start Free Trial";
    if (isFree) cta = "Get Started";
    if (isEnterprise) cta = "Contact Sales";

    // Format documents per month
    const docsPerMonth = plan.documentsPerMonth ?? "Unlimited";
    const docsDisplay = docsPerMonth === "Unlimited" 
      ? "Unlimited documents" 
      : `${docsPerMonth} documents/month`;

    return {
      ...plan,
      displayName: plan.label || plan.name || "Plan",
      displayPrice: priceDisplay,
      period: period,
      positioning: positioning,
      description: `${
        price === 0 
          ? "Perfect for getting started with document automation" 
          : `${plan.name} plan for growing finance operations`
      }`,
      features: features,
      cta: cta,
      popular: isPopular,
      docsDisplay: docsDisplay,
      isEnterprise: isEnterprise,
      isFree: isFree,
      actualPrice: price,
    };
  });

  // Separate Enterprise plan if it exists
  const enterprisePlan = mappedPlans.find(p => p.isEnterprise);
  const regularPlans = mappedPlans.filter(p => !p.isEnterprise);

  // Combine: regular plans first, then enterprise
  const sortedPlans: DisplayPlan[] = [...regularPlans];
  if (enterprisePlan) {
    sortedPlans.push(enterprisePlan);
  }

  if (loading) {
    return (
      <section id="pricing" className="relative py-24 lg:py-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-sm font-semibold text-primary tracking-wide uppercase mb-3">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Loading plans...
            </h2>
          </div>
        </div>
      </section>
    );
  }

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
          {sortedPlans.map((plan, i) => (
            <motion.div
              key={plan._id || plan.id || i}
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
                  {plan.displayName}
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                {/* FIXED: Added text wrapping and overflow handling for large prices */}
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-4xl font-extrabold text-slate-900 break-words max-w-full">
                    {plan.displayPrice}
                  </span>
                  <span className="text-muted whitespace-nowrap">{plan.period}</span>
                </div>
                {!plan.isFree && !plan.isEnterprise && plan.documentsPerMonth && (
                  <div className="text-sm text-muted mt-1">
                    {plan.docsDisplay}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.slice(0, 8).map((feature: string) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.isEnterprise ? "#demo" : "/signup"}
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