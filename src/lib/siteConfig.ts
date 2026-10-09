/**
 * Single source of truth for public-facing contact details, trial wording,
 * and the feature flags that gate not-yet-live surfaces.
 *
 * Every placeholder phone number, mismatched support address, and
 * contradictory trial claim flagged in the Oct 2026 QA report came from the
 * same root cause: the same fact was hard-coded in several components. Put
 * the fact here once and every surface stays consistent.
 */

function env(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

// ─── Contact ────────────────────────────────────────────────────
// One domain, used for every support/sales surface (site, portal, emails).
export const SUPPORT_EMAIL = env("NEXT_PUBLIC_SUPPORT_EMAIL") || "support@invonix.ai";
export const SALES_EMAIL = env("NEXT_PUBLIC_SALES_EMAIL") || "hello@invonix.ai";
export const COMPANY_CITY = env("NEXT_PUBLIC_COMPANY_CITY") || "Dubai, UAE";

// ─── WhatsApp intake ────────────────────────────────────────────
/**
 * The verified WhatsApp Business number in E.164 form (digits only, no "+").
 * Left empty until a real number is provisioned — WHATSAPP_LIVE is false
 * while it is empty, which hides every WhatsApp CTA rather than showing a
 * fictional "+1 (555) …" number next to a "Coming soon" label.
 */
export const WHATSAPP_NUMBER_E164 = env("NEXT_PUBLIC_WHATSAPP_NUMBER").replace(/[^\d]/g, "");
export const WHATSAPP_LIVE = WHATSAPP_NUMBER_E164.length >= 8;

/** Display form of the WhatsApp number, e.g. "+971 50 123 4567". */
export function whatsAppDisplayNumber(): string {
  if (!WHATSAPP_LIVE) return "";
  const digits = WHATSAPP_NUMBER_E164;
  // Group as +CC NN NNN NNNN for the UAE-style numbers we issue; fall back
  // to a single group for anything we don't have a pattern for.
  if (digits.startsWith("971") && digits.length === 12) {
    return `+971 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
}

export function whatsAppLink(message?: string): string {
  if (!WHATSAPP_LIVE) return "";
  const base = `https://wa.me/${WHATSAPP_NUMBER_E164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// ─── Trial model ────────────────────────────────────────────────
/**
 * Days of free trial offered on paid plans. 0 means "no trial" and every
 * surface then says "start free" instead of promising a trial the billing
 * configuration doesn't grant. Set NEXT_PUBLIC_TRIAL_DAYS once the trial is
 * actually enabled on the plans in the admin panel, and keep the two in sync.
 */
export const TRIAL_DAYS = (() => {
  const parsed = Number(env("NEXT_PUBLIC_TRIAL_DAYS"));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
})();
export const TRIAL_ENABLED = TRIAL_DAYS > 0;

/** Label for the primary signup button across the site. */
export const PRIMARY_CTA_LABEL = TRIAL_ENABLED
  ? `Start ${TRIAL_DAYS}-Day Free Trial`
  : "Get Started Free";

/** The reassurance strip that sits under signup CTAs. */
export const TRIAL_STRIP = TRIAL_ENABLED
  ? `Free ${TRIAL_DAYS}-day trial • No credit card required • Cancel anytime`
  : "Start free • No credit card required • Cancel anytime";

/** Sub-heading used on the signup form. */
export const SIGNUP_SUBHEADING = TRIAL_ENABLED
  ? `Start your ${TRIAL_DAYS}-day free trial. No credit card needed.`
  : "Start on the free plan. No credit card needed.";

// ─── Surfaces that are not live yet ─────────────────────────────
/**
 * The blog is served from WordPress and currently holds template content, so
 * it stays out of the nav and returns 404 until real posts are published.
 */
export const BLOG_LIVE = env("NEXT_PUBLIC_ENABLE_BLOG") === "true";

/** Partner programme has no application page or published commission terms. */
export const PARTNER_PROGRAM_LIVE = env("NEXT_PUBLIC_ENABLE_PARTNER_PROGRAM") === "true";

/** Public API access is not exposed to customers yet. */
export const PUBLIC_API_LIVE = env("NEXT_PUBLIC_ENABLE_PUBLIC_API") === "true";

// ─── Default signup phone hint ──────────────────────────────────
export const PHONE_PLACEHOLDER = env("NEXT_PUBLIC_PHONE_PLACEHOLDER") || "+971 50 123 4567";
