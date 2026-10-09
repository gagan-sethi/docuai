/**
 * Shared public-plan loading and formatting.
 *
 * The pricing cards and the "Compare all features" table used to be two
 * independent sources of truth: the cards read /api/plan/list while the table
 * was a hand-maintained matrix of Starter / Professional / Accounting Firm /
 * Enterprise. They disagreed on plan names, user counts and storage, and the
 * table advertised three plans that could not be bought (CB-10, Oct 2026 QA
 * review). Both surfaces now derive from this module, so they cannot drift.
 */

import { API_BASE_URL, apiFetch, apiUrl } from "./api";

export type CampaignDiscount = {
  type?: "fixed" | "percentage" | "percent";
  value?: number;
  name?: string;
  label?: string;
  startDate?: string;
  endDate?: string;
};

export type PlanOption = {
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

export type DisplayPlan = Omit<PlanOption, "features"> & {
  key: string;
  /** Stable identifier passed to /signup?plan=… so the choice survives signup. */
  planId?: string;
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
  pagesDisplay?: string;
  userDisplay?: string;
  companyDisplay?: string;
  storageDisplay?: string;
  isEnterprise: boolean;
  isFree: boolean;
  hasDiscount: boolean;
  monthlyEquivalent: number;
};

/**
 * Used only when the API is unreachable, so the pricing section still renders
 * something coherent. These are marketing placeholders: the `data-pricing-source`
 * attribute on the section reports "fallback" whenever they are in use, which
 * is how QA can tell the page is not showing live plan data.
 */
export const fallbackPlans: PlanOption[] = [
  {
    name: "free",
    label: "Free",
    price: 0,
    interval: "month",
    documentsPerMonth: 3,
    usersLimit: 1,
    companyLimit: 1,
    storageLimitBytes: 512 * 1024 * 1024,
    features: ["AI document extraction", "Excel & CSV export", "Financial dashboard"],
  },
  {
    name: "starter",
    label: "Starter",
    price: 49,
    interval: "month",
    documentsPerMonth: 100,
    usersLimit: 5,
    companyLimit: 1,
    storageLimitBytes: 25 * 1024 * 1024 * 1024,
    features: [
      "AI document extraction",
      "Expense tracking",
      "Excel & CSV export",
      "Financial dashboard",
      "VAT reporting",
    ],
  },
];

const defaultFeatures = [
  "AI document extraction",
  "Excel and CSV export",
  "Financial dashboard",
];

/**
 * Quota lines arrive inside `features` as free text ("100 Documents per Month")
 * as well as in structured fields. They are rendered from the structured
 * fields, so strip them out of the feature list to avoid showing both.
 */
const quotaFeaturePattern =
  /\b(documents?\s+per\s+month|pages?\s+per\s+month|users?\s+limit|company\s+limit|storage\s*(limit)?)\b/i;

export function toNumber(value: number | string | undefined): number | undefined {
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

export function formatMoney(amount: number, currency: string): string {
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

/**
 * Storage size, shown to the precision the stored byte count actually has.
 * Rounding 24.5 GB up to "25 GB" on the website while the admin panel showed
 * 24.5 GB was one of the pricing inconsistencies in CB-10, so no rounding.
 */
export function formatStorageSize(bytes?: number): string | undefined {
  if (!bytes || bytes <= 0) return undefined;

  const gigabytes = bytes / 1024 / 1024 / 1024;
  if (gigabytes < 1) {
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  }
  const formatted = Number.isInteger(gigabytes)
    ? String(gigabytes)
    : gigabytes.toFixed(1).replace(/\.0$/, "");
  return `${formatted} GB`;
}

function formatStorage(bytes?: number): string | undefined {
  const size = formatStorageSize(bytes);
  return size ? `${size} storage` : undefined;
}

export function cleanFeature(feature: string): string {
  return feature
    .trim()
    .replace(/\bapi\b/gi, "API")
    .replace(/\bvat\b/gi, "VAT")
    .replace(/\bwhatsapp\b/gi, "WhatsApp")
    .replace(/\s+/g, " ");
}

/** Every feature on the plan, quota lines removed, deduplicated. */
export function getAllFeatures(plan: PlanOption): string[] {
  const rawFeatures = Array.isArray(plan.features)
    ? plan.features
    : typeof plan.features === "string"
      ? plan.features.split(",")
      : defaultFeatures;

  const cleaned = rawFeatures
    .map((feature) => cleanFeature(String(feature)))
    .filter(Boolean)
    .filter((feature) => !quotaFeaturePattern.test(feature));

  return Array.from(new Set(cleaned));
}

export function isPublicPlan(plan: PlanOption): boolean {
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
    const docs = toNumber(plan.documentsPerMonth);
    return docs
      ? `Try Invonix free with ${formatNumber(docs)} document${docs === 1 ? "" : "s"} a month.`
      : "Try Invonix free before your document volume grows.";
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

export function mapPlan(plan: PlanOption, index: number): DisplayPlan {
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
    formatLimit(plan.documentsPerMonth, "doc/mo", "docs/mo") || "Unlimited docs";
  const pagesDisplay = formatLimit(plan.pagesPerMonth, "page/mo", "pages/mo");
  const userDisplay = formatLimit(plan.usersLimit, "user", "users");
  const companyDisplay = formatLimit(plan.companyLimit, "company", "companies");
  const storageDisplay = formatStorage(plan.storageLimitBytes);
  const planId = plan._id || plan.id;

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
    key: String(planId || `${displayName}-${index}`),
    planId: planId ? String(planId) : undefined,
    displayName,
    displayPrice,
    originalPrice: hasDiscount ? formatMoney(basePrice, currency) : undefined,
    period: isFree || isEnterprise ? "" : formatPeriod(plan.interval),
    billingNote,
    positioning: getPlanPositioning(plan, isFree),
    description: getPlanDescription(plan, displayName, isFree),
    features: getAllFeatures(plan),
    cta,
    popular: isPopular,
    badge: discountLabel || (isAnnual && payablePrice > 0 ? "Best value" : undefined),
    docsDisplay,
    pagesDisplay,
    userDisplay,
    companyDisplay,
    storageDisplay,
    isEnterprise,
    isFree,
    hasDiscount,
    monthlyEquivalent,
  };
}

export function sortPlans(plans: DisplayPlan[]): DisplayPlan[] {
  return [...plans].sort((a, b) => {
    if (a.isEnterprise !== b.isEnterprise) return a.isEnterprise ? 1 : -1;
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    return a.monthlyEquivalent - b.monthlyEquivalent;
  });
}

/**
 * B-02: a plan button must carry the chosen plan through signup, otherwise
 * every "Choose Plan" landed the visitor on the Free plan.
 */
export function planSignupHref(plan: DisplayPlan): string {
  if (plan.isEnterprise) return "/contact";
  if (!plan.planId) return "/signup";
  return `/signup?plan=${encodeURIComponent(plan.planId)}`;
}

export type PlansResult = {
  plans: DisplayPlan[];
  source: "backend" | "fallback";
};

export async function loadPublicPlans(): Promise<PlansResult> {
  if (!API_BASE_URL) {
    return { plans: sortPlans(fallbackPlans.map(mapPlan)), source: "fallback" };
  }

  try {
    const res = await apiFetch(apiUrl("/api/plan/list"), { credentials: "include" });
    if (!res.ok) throw new Error(`Plan list request failed with ${res.status}`);

    const json = (await res.json()) as { success?: boolean; data?: unknown; error?: string };
    const apiPlans = Array.isArray(json.data) ? (json.data as PlanOption[]) : [];
    const publicPlans = apiPlans.filter(isPublicPlan);

    if (!json.success || publicPlans.length === 0) {
      throw new Error(json.error || "No public plans returned");
    }

    return { plans: sortPlans(publicPlans.map(mapPlan)), source: "backend" };
  } catch (err) {
    console.warn("Falling back to local pricing plans", err);
    return { plans: sortPlans(fallbackPlans.map(mapPlan)), source: "fallback" };
  }
}
