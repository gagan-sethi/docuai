/**
 * Canonical FAQ content — the single source for both the public /faq page and
 * the in-app Help Center at /dashboard/support.
 *
 * The two used to maintain their own copies, which drifted: they disagreed on
 * how many questions each category held and gave different answers about
 * accounting integrations, security and supported document types (UX-06, Oct
 * 2026 QA review). Edit an answer here and both surfaces change together.
 *
 * Answers are structured rather than JSX so a non-React surface can render
 * them too. Keep every claim here checkable against the product.
 */

import { SUPPORT_EMAIL, TRIAL_DAYS, TRIAL_ENABLED, WHATSAPP_LIVE } from "./siteConfig";

export type FaqAnswer = {
  /** Leading paragraph. Required unless the answer is only a list. */
  lead?: string;
  /** List items rendered as bullets or as pills. */
  items?: string[];
  itemStyle?: "bullets" | "chips";
  /** Label/value pairs, for limits that vary by plan. */
  rows?: Array<{ label: string; value: string }>;
  /** Closing caveat, rendered in a muted tone. */
  note?: string;
};

export type FaqEntry = { q: string; a: FaqAnswer };

export type FaqCategoryId =
  | "general"
  | "documents"
  | "ai"
  | "batches"
  | "dashboard"
  | "users"
  | "exports"
  | "integrations"
  | "security"
  | "billing"
  | "referral"
  | "support"
  | "enterprise"
  | "getting-started";

export type FaqCategory = {
  id: FaqCategoryId;
  label: string;
  description: string;
  items: FaqEntry[];
};

/** The four document types the classifier actually emits. */
const DOCUMENT_TYPES = [
  "Sales invoices",
  "Expense invoices",
  "Purchase orders",
  "Receipts",
];

export const faqCategories: FaqCategory[] = [
  {
    id: "general",
    label: "General",
    description: "What Invonix is and who it is for",
    items: [
      {
        q: "What is Invonix?",
        a: {
          lead:
            "Invonix is an AI-powered document processing platform. It extracts data from invoices, receipts, purchase orders and other financial documents so your team keys in less and reconciles faster. Every extraction is reviewed by a person before it counts.",
        },
      },
      {
        q: "Who is Invonix designed for?",
        a: {
          lead: "Invonix is built for:",
          items: [
            "Accounting firms",
            "Bookkeepers",
            "SMEs",
            "Trading companies",
            "Logistics companies",
            "Construction companies",
            "Manufacturing companies",
            "Retail businesses",
            "Corporate finance teams",
          ],
          itemStyle: "bullets",
        },
      },
      {
        q: "Which countries does Invonix serve?",
        a: {
          lead:
            "Invonix is built for finance teams in the UAE, the wider GCC and Africa, with AED and multi-currency capture and UAE VAT fields as standard.",
        },
      },
    ],
  },
  {
    id: "documents",
    label: "Document Processing",
    description: "Supported documents, formats and batch uploads",
    items: [
      {
        q: "What document types can Invonix process?",
        a: {
          lead: "Invonix classifies four document types:",
          items: DOCUMENT_TYPES,
          itemStyle: "bullets",
          note:
            "Anything it cannot place is marked Unclassified and sent to review rather than guessed at.",
        },
      },
      {
        q: "What file formats are supported?",
        a: { items: ["PDF", "JPG", "JPEG", "PNG", "TIFF"], itemStyle: "chips" },
      },
      {
        q: "Can I upload multiple documents at once?",
        a: {
          lead:
            "Yes. Invonix supports bulk upload, and each upload session is grouped into its own batch so you can export or review it as a unit.",
        },
      },
      {
        q: "Does Invonix support Arabic documents?",
        a: {
          lead:
            "Yes. Arabic and English documents are both supported, including mixed-language invoices.",
        },
      },
      {
        q: "Does Invonix support handwritten documents?",
        a: {
          lead:
            "Handwritten and typed documents are both accepted, and the input type is detected per file — you can override the detection before processing.",
          note:
            "Handwriting is harder to read than print, so handwritten documents typically come back with lower confidence and should always be reviewed.",
        },
      },
      {
        q: "What happens if the AI extracts incorrect information?",
        a: {
          lead:
            "You correct it. Every extracted field is editable in the review screen, and a document only enters your reports once someone approves it. Correcting a field also marks it as manually set, so it is not overwritten later.",
        },
      },
    ],
  },
  {
    id: "ai",
    label: "AI & OCR",
    description: "Confidence scores, classification and VAT extraction",
    items: [
      {
        q: "How accurate is Invonix?",
        a: {
          lead:
            "Accuracy depends on the document. Rather than quote a single figure, Invonix reports a confidence score for every field and for the document as a whole, so you can see exactly which extractions are solid and which need a closer look.",
          note:
            "Low-confidence documents are routed to review instead of being treated as verified. Clean, printed PDFs score highest; blurred photos and handwriting score lowest.",
        },
      },
      {
        q: "Does Invonix automatically identify document types?",
        a: {
          lead:
            "Yes. Each document is classified into one of the four supported types with a confidence score, and you can change the type manually at any time.",
        },
      },
      {
        q: "Can Invonix extract VAT information?",
        a: {
          lead:
            "Yes. Subtotal, tax rate, VAT amount and the supplier's TRN are extracted where they appear on the document, and the VAT report reconciles VAT collected against VAT paid.",
        },
      },
      {
        q: "Does Invonix learn from my corrections?",
        a: {
          lead:
            "Your corrections are stored against the document and are used to improve classification and category suggestions within your own workspace. We do not use your documents to train shared AI models.",
        },
      },
    ],
  },
  {
    id: "batches",
    label: "Upload Batches",
    description: "Batch IDs, organisation and audit workflows",
    items: [
      {
        q: "What is upload batch management?",
        a: {
          lead:
            "Every upload session receives its own batch ID — Batch #001, Batch #002 and so on — so documents stay grouped by when they were uploaded.",
        },
      },
      {
        q: "Why is batch management useful?",
        a: {
          lead: "It lets you:",
          items: [
            "Process documents by upload session",
            "Export only the most recent uploads",
            "Organise documents by period",
            "Keep audit and reconciliation workflows traceable",
          ],
          itemStyle: "bullets",
        },
      },
    ],
  },
  {
    id: "dashboard",
    label: "Financial Dashboard",
    description: "Reports, filters and period selection",
    items: [
      {
        q: "What does the Financial dashboard show?",
        a: {
          lead: "Computed from your approved documents:",
          items: [
            "Revenue",
            "Expenses",
            "Net profit",
            "VAT payable or refundable",
            "Monthly trends",
            "Expenses by category",
          ],
          itemStyle: "bullets",
          note: "Only approved documents are counted, so figures never move on an unreviewed extraction.",
        },
      },
      {
        q: "Can I filter reports by date?",
        a: {
          lead: "Yes. The available periods are:",
          items: [
            "This month",
            "Last month",
            "This quarter",
            "Last quarter",
            "This year",
            "Last year",
            "Custom date range",
          ],
          itemStyle: "bullets",
        },
      },
      {
        q: "Can I export reports?",
        a: {
          lead: "Yes. VAT and P&L reports export as:",
          items: ["Excel (XLSX)", "CSV", "PDF"],
          itemStyle: "chips",
        },
      },
    ],
  },
  {
    id: "users",
    label: "Multi-Company & Users",
    description: "Team roles, companies and access control",
    items: [
      {
        q: "Can I manage multiple companies?",
        a: {
          lead:
            "Yes, up to the company limit on your plan. Documents, finance reports and exports are all scoped to the company you have selected.",
          note: "See the Pricing page for the company limit on each plan.",
        },
      },
      {
        q: "Can multiple users access the same workspace?",
        a: {
          lead:
            "Yes, up to the seat limit on your plan. Invited teammates share the same document library and the same monthly allowance as the workspace owner.",
          note: "See the Pricing page for the seat limit on each plan.",
        },
      },
      {
        q: "What can each team role do?",
        a: {
          lead: "There are three roles in a workspace:",
          rows: [
            { label: "Owner", value: "Everything, including billing and company records" },
            { label: "Admin", value: "Documents, review, reports and team invitations" },
            { label: "Member", value: "Upload, review and report — no billing or team access" },
          ],
        },
      },
    ],
  },
  {
    id: "exports",
    label: "Exports",
    description: "What you can export and in what shape",
    items: [
      {
        q: "Can I export only today's uploaded documents?",
        a: {
          lead: "Yes. You can export:",
          items: [
            "The latest upload batch",
            "A specific batch",
            "Only the documents you select",
            "A custom date range",
            "The current month, quarter or year",
          ],
          itemStyle: "bullets",
        },
      },
      {
        q: "Can I export approved documents only?",
        a: {
          lead: "Yes. Filter by status before exporting:",
          items: ["Approved", "Pending review", "All documents"],
          itemStyle: "chips",
        },
      },
    ],
  },
  {
    id: "integrations",
    label: "Accounting Software",
    description: "How Invonix fits alongside your accounting system",
    items: [
      {
        q: "Does Invonix integrate with QuickBooks, Xero, Wafeq or Zoho Books?",
        a: {
          lead:
            "Through file export, not a live connection. Invonix produces Excel and CSV files with columns shaped for import into those systems.",
          note:
            "There is no direct API integration or two-way sync today. If you need one, tell us which system and we will factor it into the roadmap.",
        },
      },
      {
        q: "Can I use Invonix alongside my existing accounting software?",
        a: {
          lead:
            "Yes — that is the intended use. Invonix handles capture and review, and hands your accounting system clean, structured data.",
        },
      },
    ],
  },
  {
    id: "security",
    label: "Security & Privacy",
    description: "Where your documents go and who can see them",
    items: [
      {
        q: "Is my data secure?",
        a: {
          lead:
            "Documents are encrypted in transit and at rest and stored privately — the storage URLs are not publicly readable, and downloads go through short-lived signed links. Passwords are hashed and never recoverable in plain text.",
        },
      },
      {
        q: "Who can access my documents?",
        a: {
          lead:
            "Only people you have invited into your workspace, subject to their role. Administrative access to production systems is restricted and audit-logged.",
        },
      },
      {
        q: "Do you share customer data?",
        a: {
          lead:
            "We never sell customer data, and we never use your documents to train AI models. Processing a document does involve third-party services:",
          items: [
            "Amazon Web Services — document storage and OCR",
            "OpenAI — structuring the extracted text",
            "Stripe — subscription billing",
          ],
          itemStyle: "bullets",
          note:
            "Each one is listed in our Privacy Policy with what it receives, where it processes it, and how long we keep the data.",
        },
      },
    ],
  },
  {
    id: "billing",
    label: "Pricing & Billing",
    description: "Plans, trials, upgrades and cancellation",
    items: [
      {
        q: "Is there a free trial?",
        a: {
          lead: TRIAL_ENABLED
            ? `Yes. Paid plans include a ${TRIAL_DAYS}-day free trial, with no credit card required to start. One trial per customer.`
            : "There is a free plan you can use indefinitely within its monthly allowance, with no credit card required. Paid plans are billed from the day you subscribe.",
          note: "See the Pricing page for the current allowance on each plan.",
        },
      },
      {
        q: "Can I upgrade or downgrade my plan later?",
        a: {
          lead:
            "Yes, from the Billing page in your dashboard. An upgrade takes effect immediately; a downgrade takes effect at the end of the paid period.",
        },
      },
      {
        q: "Can I cancel my subscription?",
        a: {
          lead:
            "Yes, at any time from the Billing page. Access continues until the end of the period you have paid for. Export your data before closing the account.",
        },
      },
      {
        q: "What happens if I hit my monthly limit?",
        a: {
          lead:
            "Invonix warns you as you approach the limit. Once you reach it, further processing pauses until the next period, or until you upgrade.",
        },
      },
    ],
  },
  {
    id: "referral",
    label: "Referral Program",
    description: "Sharing a referral code and how the discount applies",
    items: [
      {
        q: "How does the referral program work?",
        a: {
          lead:
            "Accounting firms can generate a referral code from the Referrals page and share it with clients. When a client signs up using that code, the configured discount is applied to their subscription and the referral is attributed to the firm.",
          note:
            "Referral codes are entered during signup. The discount percentage is set per code.",
        },
      },
    ],
  },
  {
    id: "support",
    label: "Training & Support",
    description: "How to reach us and how quickly we reply",
    items: [
      {
        q: "How do I get support?",
        a: {
          lead: "Support is available through:",
          items: [
            `Email — ${SUPPORT_EMAIL}`,
            "In-app support tickets from Help & Support in your dashboard",
            ...(WHATSAPP_LIVE ? ["WhatsApp"] : []),
          ],
          itemStyle: "bullets",
          note: "We reply to support enquiries within one business day.",
        },
      },
      {
        q: "Do you provide training materials?",
        a: {
          lead: "Yes. Every customer has access to:",
          items: [
            "Video tutorials in the dashboard",
            "This FAQ, in the app and on the website",
            "Step-by-step guidance on the upload and review screens",
          ],
          itemStyle: "bullets",
        },
      },
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise Onboarding",
    description: "What larger deployments include",
    items: [
      {
        q: "Do you offer enterprise onboarding?",
        a: {
          lead:
            "Yes, by arrangement. Enterprise engagements are scoped individually and can include:",
          items: [
            "Dedicated onboarding sessions",
            "Team training",
            "Multi-user and multi-company setup assistance",
            "Workflow configuration support",
            "Priority support",
            "A named account contact",
          ],
          itemStyle: "bullets",
          note:
            "Scope and service levels are agreed in writing before onboarding begins. Contact us to discuss your requirements.",
        },
      },
    ],
  },
  {
    id: "getting-started",
    label: "Getting Started",
    description: "The path from signup to your first export",
    items: [
      {
        q: "How do I start using Invonix?",
        a: {
          lead: "Seven steps from signup to a finished export:",
          items: [
            "Create an account",
            "Add your company, with its currency and TRN",
            "Upload documents",
            "Review the AI-extracted fields",
            "Approve the documents",
            "Check the financial dashboard",
            "Export your reports and structured data",
          ],
          itemStyle: "bullets",
        },
      },
      {
        q: "How long does setup take?",
        a: {
          lead:
            "Most businesses create an account and process their first documents on the same day. There is nothing to install.",
        },
      },
    ],
  },
];

/** Total number of published questions, for a "N questions" count. */
export const faqQuestionCount = faqCategories.reduce(
  (total, category) => total + category.items.length,
  0,
);

/** Flattened list, for search. */
export const faqFlatItems = faqCategories.flatMap((category) =>
  category.items.map((item) => ({ ...item, categoryId: category.id, categoryLabel: category.label })),
);

/** Plain-text rendering of an answer, for searching and for plain surfaces. */
export function faqAnswerToText(answer: FaqAnswer): string {
  return [
    answer.lead,
    ...(answer.items ?? []),
    ...(answer.rows ?? []).map((row) => `${row.label}: ${row.value}`),
    answer.note,
  ]
    .filter(Boolean)
    .join(" ");
}
