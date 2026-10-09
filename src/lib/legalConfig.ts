/**
 * Facts the legal pages state about the business and its data flows.
 *
 * These are published commitments, so they live in one typed place rather
 * than being retyped into each policy page. Correct them here and Privacy,
 * Terms and Cookie Policy all update together.
 *
 * NOTE FOR THE OPERATOR: `LEGAL_ENTITY`, `TRADE_LICENCE` and
 * `REGISTERED_ADDRESS` must match the company's trade licence before launch.
 * They are read from env so they can be set per-environment without a code
 * change.
 */

function env(name: string, fallback: string): string {
  const value = process.env[name];
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
}

export const LEGAL_ENTITY = env("NEXT_PUBLIC_LEGAL_ENTITY", "Invonix");
export const TRADE_LICENCE = env("NEXT_PUBLIC_TRADE_LICENCE", "");
export const REGISTERED_ADDRESS = env(
  "NEXT_PUBLIC_REGISTERED_ADDRESS",
  "Dubai, United Arab Emirates",
);
export const GOVERNING_LAW = env("NEXT_PUBLIC_GOVERNING_LAW", "the United Arab Emirates");
export const COURTS = env("NEXT_PUBLIC_COURTS", "the courts of Dubai, United Arab Emirates");

/** Last substantive revision of the policy text in this repository. */
export const POLICY_EFFECTIVE_DATE = "9 October 2026";

/**
 * Where uploaded documents and extracted data are stored and processed.
 * Mirrors AWS_S3_REGION in the API service — keep the two in step, because
 * UAE PDPL requires the cross-border transfer to be disclosed accurately.
 */
export const STORAGE_REGION = env("NEXT_PUBLIC_STORAGE_REGION", "AWS ap-south-1 (Mumbai, India)");

export interface SubProcessor {
  name: string;
  purpose: string;
  location: string;
  dataShared: string;
}

/**
 * Every third party that receives customer content or personal data.
 * Derived from the processing pipeline in the API service: S3 storage,
 * Textract OCR, OpenAI extraction, Stripe billing, SMTP delivery.
 */
export const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: "Amazon Web Services (AWS)",
    purpose: "Document storage (S3) and OCR text detection (Textract)",
    location: STORAGE_REGION,
    dataShared: "Uploaded document files and the text extracted from them",
  },
  {
    name: "OpenAI",
    purpose: "Structuring OCR text into accounting fields (GPT-4o)",
    location: "United States",
    dataShared:
      "The text extracted from your documents. Sent via the OpenAI API, which does not use API content to train its models.",
  },
  {
    name: "Stripe",
    purpose: "Subscription billing and payment processing",
    location: "United States and Ireland",
    dataShared:
      "Billing name, email and subscription records. Card details are entered directly with Stripe and never reach our servers.",
  },
  {
    name: "MongoDB Atlas",
    purpose: "Application database for accounts, documents metadata and reports",
    location: STORAGE_REGION,
    dataShared: "Account details and extracted document data",
  },
  {
    name: "Transactional email provider",
    purpose: "Account, verification and billing notification emails",
    location: "As configured for your workspace region",
    dataShared: "Name, email address and the content of the notification",
  },
];

/** How long we keep each class of data. */
export const RETENTION = [
  {
    item: "Uploaded document files",
    period: "Kept while your account is active; deleted within 30 days of you deleting the document or closing the account",
  },
  {
    item: "Extracted financial data and reports",
    period: "Kept while your account is active; deleted within 30 days of account closure",
  },
  {
    item: "Billing and invoice records",
    period: "Retained for the period required by applicable tax and accounting law (typically 5 years)",
  },
  {
    item: "Security and audit logs",
    period: "12 months",
  },
];
