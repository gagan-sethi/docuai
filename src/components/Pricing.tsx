"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiUrl } from "@/lib/api";

type CampaignDiscount = {
  type?: "fixed" | "percentage";
  value?: number;
  name?: string;
  label?: string;
  startDate?: string;
  endDate?: string;
};

type PlanOption = {
  _id?: string;
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  price?: number | string;
  discountedPrice?: number | string;
  currency?: string;
  discountApplied?: boolean;
  appliedDiscountPercent?: number;
  discountPercent?: number;
  interval?: string;
  documentsPerMonth?: number | string;
  pagesPerMonth?: number | string;
  usersLimit?: number | string;
  companyLimit?: number | string;
  storageLimitBytes?: number;
  features?: string[] | string;
  visibility?: "public" | "hidden";
  isActive?: boolean;
  isTrial?: boolean;
  trialDays?: number;
  isTrialEligible?: boolean;
  hasUsedTrial?: boolean;
  campaignDiscount?: CampaignDiscount | null;
};

type PlanListResponse = {
  success?: boolean;
  data?: unknown;
  error?: string;
};

type DisplayPlan = PlanOption & {
  key: string;
  displayName: string;
  displayPrice: string;
  originalPrice?: string;
  period: string;
  billingNote: string;
  positioning: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  badge?: string;
  docsDisplay: string;
  userDisplay?: string;
  companyDisplay?: string;
  storageDisplay?: string;
  isEnterprise: boolean;
  isFree: boolean;
  hasDiscount: boolean;
  monthlyEquivalent: number;
};

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

const defaultFeatures = [
  "AI document extraction",
  "Excel and CSV export",
  "Financial dashboard",
];

const quotaFeaturePattern =
  /\b(documents?\s+per\s+month|users?\s+limit|company\s+limit|storage\s+limit)\b/i;

function toNumber(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function currencyCode(plan: PlanOption): string {
  const code = (plan.currency || "USD").toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

function isMinorUnitAmount(plan: PlanOption, amount: number): boolean {
  const interval = plan.interval?.toLowerCase();
  if (!Number.isInteger(amount) || amount <= 0) return false;

  if (amount >= 10000) return true;
  if (interval === "year" && amount >= 1000) return true;

  return false;
}

function moneyAmount(plan: PlanOption, value: number | string | undefined): number {
  const amount = toNumber(value) ?? 0;
  return isMinorUnitAmount(plan, amount) ? amount / 100 : amount;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }
}

function formatPeriod(interval?: string): string {
  switch (interval?.toLowerCase()) {
    case "month":
      return "/mo";
    case "year":
      return "/yr";
    case "week":
      return "/wk";
    default:
      return interval ? `/${interval}` : "";
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatLimit(
  value: number | string | undefined,
  singular: string,
  plural: string
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value === "string") {
    return value.toLowerCase() === "unlimited"
      ? `Unlimited ${plural}`
      : `${value} ${plural}`;
  }

  return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

function formatStorage(bytes?: number): string | undefined {
  if (!bytes || bytes <= 0) return undefined;

  const gigabytes = bytes / 1024 / 1024 / 1024;
  const formatted =
    gigabytes >= 10 ? Math.round(gigabytes).toString() : gigabytes.toFixed(1);

  return `${formatted.replace(/\.0$/, "")} GB storage`;
}

function cleanFeature(feature: string): string {
  return feature
    .trim()
    .replace(/\bapi\b/gi, "API")
    .replace(/\bvat\b/gi, "VAT")
    .replace(/\bwhatsapp\b/gi, "WhatsApp")
    .replace(/\s+/g, " ");
}

function getFeatures(plan: PlanOption): string[] {
  const rawFeatures = Array.isArray(plan.features)
    ? plan.features
    : typeof plan.features === "string"
    ? plan.features.split(",")
    : defaultFeatures;

  const cleaned = rawFeatures
    .map((feature) => cleanFeature(String(feature)))
    .filter(Boolean)
    .filter((feature) => !quotaFeaturePattern.test(feature));

  return Array.from(new Set(cleaned)).slice(0, 7);
}

function isPublicPlan(plan: PlanOption): boolean {
  return plan.visibility !== "hidden" && plan.isActive !== false;
}

function getPlanPositioning(plan: PlanOption, isFree: boolean): string {
  const name = `${plan.name || ""} ${plan.label || ""}`.toLowerCase();

  if (isFree) return "Start automating";
  if (name.includes("professional") || name.includes("pro")) {
    return "Growing finance teams";
  }
  if (name.includes("accounting") || name.includes("firm")) {
    return "Accounting firms";
  }
  if (name.includes("enterprise")) return "Large operations";
  if (plan.interval?.toLowerCase() === "year") return "Annual billing";

  return "Small businesses";
}

function getPlanDescription(
  plan: PlanOption,
  displayName: string,
  isFree: boolean
): string {
  if (plan.description?.trim()) return plan.description.trim();

  if (isFree) {
    return "For testing document automation before your finance volume grows.";
  }

  return `${displayName} for document capture, finance reporting, and team workflows.`;
}

function getDiscountLabel(plan: PlanOption): string | undefined {
  if (plan.campaignDiscount?.label) return plan.campaignDiscount.label;

  const percent = plan.appliedDiscountPercent || plan.discountPercent;
  if (plan.discountApplied && percent && percent > 0) {
    return `${percent}% off`;
  }

  return undefined;
}

function mapPlan(plan: PlanOption, index: number): DisplayPlan {
  const displayName = plan.label || plan.name || "Plan";
  const currency = currencyCode(plan);
  const basePrice = moneyAmount(plan, plan.price);
  const discountedPrice = moneyAmount(plan, plan.discountedPrice);
  const hasDiscount =
    plan.discountApplied === true &&
    discountedPrice > 0 &&
    discountedPrice < basePrice;
  const payablePrice = hasDiscount ? discountedPrice : basePrice;
  const nameForChecks = `${plan.name || ""} ${plan.label || ""}`.toLowerCase();
  const isEnterprise = nameForChecks.includes("enterprise");
  const isFree = !isEnterprise && basePrice === 0;
  const isAnnual = plan.interval?.toLowerCase() === "year";
  const monthlyEquivalent = isAnnual ? payablePrice / 12 : payablePrice;
  const isPopular =
    nameForChecks.includes("professional") ||
    nameForChecks.includes("popular") ||
    (isAnnual && payablePrice > 0);
  const discountLabel = getDiscountLabel(plan);
  const docsDisplay =
    formatLimit(plan.documentsPerMonth, "doc/mo", "docs/mo") ||
    "Unlimited docs";
  const userDisplay = formatLimit(plan.usersLimit, "user", "users");
  const companyDisplay = formatLimit(plan.companyLimit, "company", "companies");
  const storageDisplay = formatStorage(plan.storageLimitBytes);

  let displayPrice = isFree ? "Free" : formatMoney(payablePrice, currency);
  if (isEnterprise) displayPrice = "Custom";

  let billingNote = isFree ? "No credit card required" : "Monthly billing";
  if (isEnterprise) {
    billingNote = "Tailored pricing and onboarding";
  } else if (isAnnual && payablePrice > 0) {
    billingNote = `${formatMoney(monthlyEquivalent, currency)}/mo billed yearly`;
  } else if (hasDiscount) {
    billingNote = "Discount applied at checkout";
  }

  let cta = "Choose Plan";
  if (isFree) cta = "Get Started";
  if (isEnterprise) cta = "Contact Sales";
  if (!isFree && !isEnterprise && plan.isTrial && (plan.trialDays ?? 0) > 0) {
    cta = `Start ${plan.trialDays}-Day Trial`;
  }

  return {
    ...plan,
    key: String(plan._id || plan.id || `${displayName}-${index}`),
    displayName,
    displayPrice,
    originalPrice: hasDiscount ? formatMoney(basePrice, currency) : undefined,
    period: isFree || isEnterprise ? "" : formatPeriod(plan.interval),
    billingNote,
    positioning: getPlanPositioning(plan, isFree),
    description: getPlanDescription(plan, displayName, isFree),
    features: getFeatures(plan),
    cta,
    popular: isPopular,
    badge: discountLabel || (isAnnual && payablePrice > 0 ? "Best value" : undefined),
    docsDisplay,
    userDisplay,
    companyDisplay,
    storageDisplay,
    isEnterprise,
    isFree,
    hasDiscount,
    monthlyEquivalent,
  };
}

function sortPlans(plans: DisplayPlan[]): DisplayPlan[] {
  return [...plans].sort((a, b) => {
    if (a.isEnterprise !== b.isEnterprise) return a.isEnterprise ? 1 : -1;
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    return a.monthlyEquivalent - b.monthlyEquivalent;
  });
}

function gridClass(planCount: number): string {
  if (planCount <= 1) return "max-w-md";
  if (planCount === 2) return "max-w-4xl md:grid-cols-2";
  if (planCount === 3) return "max-w-6xl md:grid-cols-2 lg:grid-cols-3";
  return "max-w-7xl md:grid-cols-2 xl:grid-cols-4";
}

function PricingHeader({ loading }: { loading?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="text-center max-w-3xl mx-auto mb-14"
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary tracking-wide uppercase mb-3">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
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
  );
}

function PricingSkeleton() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface to-white" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PricingHeader loading />
        <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto md:grid-cols-2 lg:grid-cols-3">
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

function PlanMeta({
  icon: Icon,
  text,
}: {
  icon: typeof FileText;
  text?: string;
}) {
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
        plan.popular
          ? "border-primary/35 ring-1 ring-primary/15"
          : "border-slate-100"
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
        <h3 className="text-xl font-bold text-slate-950">
          {plan.displayName}
        </h3>
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
            <span className="pb-1 text-sm font-semibold text-muted">
              {plan.period}
            </span>
          )}
        </div>
        <p className="mt-2 min-h-[20px] text-sm text-slate-500">
          {plan.billingNote}
        </p>
      </div>

      <div className="grid gap-2 pb-5">
        <PlanMeta icon={FileText} text={plan.docsDisplay} />
        <PlanMeta icon={Users} text={plan.userDisplay} />
        <PlanMeta icon={Building2} text={plan.companyDisplay} />
        <PlanMeta icon={Database} text={plan.storageDisplay} />
      </div>

      <ul className="space-y-3 border-t border-slate-100 pt-5 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            <span className="text-sm leading-relaxed text-slate-600">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.isEnterprise ? "#demo" : "/signup"}
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

export default function Pricing() {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"backend" | "fallback">("fallback");

  useEffect(() => {
    let cancelled = false;

    async function fetchPlans() {
      try {
        setLoading(true);

        if (!API_BASE_URL) {
          if (!cancelled) {
            setPlans(fallbackPlans);
            setSource("fallback");
          }
          return;
        }

        const res = await fetch(apiUrl("/api/plan/list"), {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Plan list request failed with ${res.status}`);
        }

        const json = (await res.json()) as PlanListResponse;
        const apiPlans = Array.isArray(json.data)
          ? (json.data as PlanOption[])
          : [];
        const publicPlans = apiPlans.filter(isPublicPlan);

        if (!json.success || publicPlans.length === 0) {
          throw new Error(json.error || "No public plans returned");
        }

        if (!cancelled) {
          setPlans(publicPlans);
          setSource("backend");
        }
      } catch (err) {
        console.warn("Falling back to local pricing plans", err);
        if (!cancelled) {
          setPlans(fallbackPlans);
          setSource("fallback");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPlans = useMemo(
    () => sortPlans(plans.map((plan, index) => mapPlan(plan, index))),
    [plans]
  );

  if (loading) {
    return <PricingSkeleton />;
  }

  return (
    <section
      id="pricing"
      data-pricing-source={source}
      data-plan-count={sortedPlans.length}
      className="relative py-24 lg:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface to-white" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PricingHeader />

        <div
          className={`grid grid-cols-1 gap-6 mx-auto items-stretch ${gridClass(
            sortedPlans.length
          )}`}
        >
          {sortedPlans.map((plan, i) => (
            <PricingCard key={plan.key} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
