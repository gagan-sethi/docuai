// ─── Shared types for the DocuAI processing pipeline ────────────

export type DocumentStatus =
  | "uploading"
  | "uploaded"
  | "processing"
  | "structuring"
  | "review"
  | "approved"
  | "rejected"
  | "error";

export type DocumentSource = "upload" | "whatsapp";

export type OcrEngine = "textract" | "paddleocr" | "none";

// ─── Document classification (Phase: Financial Engine) ──────────

/**
 * Canonical document types used by the financial engine.
 * - sales_invoice: client is the seller → adds to Revenue + VAT Collected
 * - expense_invoice: client is the buyer → adds to Expenses + VAT Paid
 * - purchase_order: procurement tracking, NO financial impact
 * - receipt: treated as operational expense
 * - unknown: AI could not classify (or pre-classification)
 */
export type DocType =
  | "sales_invoice"
  | "expense_invoice"
  | "purchase_order"
  | "receipt"
  | "unknown";

/**
 * Expense categories auto-suggested by the AI for expense_invoice and receipt
 * documents. The user can override via the UI dropdown.
 */
export type ExpenseCategory =
  | "logistics"
  | "marketing"
  | "printing"
  | "utilities"
  | "rent"
  | "food_beverage"
  | "transport"
  | "raw_materials"
  | "other";

/**
 * Structured financial summary attached to every processed document.
 * The backend should populate this from the extracted fields after
 * classification. Frontend uses it directly for the financial dashboard,
 * P&L and VAT reports.
 */
export interface FinancialSummary {
  currency: string;          // ISO 4217, e.g. "AED", "USD"
  subtotal: number;          // pre-VAT amount
  vatRate: number;           // 0-100, e.g. 5 for 5%
  vatAmount: number;         // VAT amount in currency
  grandTotal: number;        // subtotal + vatAmount
  invoiceDate?: string;      // ISO date when invoice was issued
  trn?: string;              // tax registration / VAT number
  counterparty?: string;     // supplier (for expenses) or customer (for sales)
  invoiceNumber?: string;
}

export interface ExtractedField {
  id: string;
  label: string;
  value: string;
  confidence: number;
  edited: boolean;
  textractKey?: string; // original Textract key name
}

export interface LineItem {
  id: string;
  code: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  confidence: number;
}

export interface ProcessedDocument {
  id: string;
  type?: string;           // API-facing canonical document type
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key?: string;          // absent when running without S3
  localBuffer?: string;    // base64-encoded file for local/demo mode
  s3Url?: string;
  isHandwritten?: boolean; // flagged as handwritten by user
  ocrEngine?: OcrEngine;   // which OCR engine was used
  status: DocumentStatus;
  source: DocumentSource;
  docType?: string;        // legacy free-text label (Invoice, PO, etc.) — kept for back-compat
  docTypeCode?: DocType;   // canonical classification used by the financial engine
  docTypeConfidence?: number; // 0-100, AI's confidence in the classification
  docTypeManual?: boolean; // true if the user manually overrode the AI's choice
  expenseCategory?: ExpenseCategory;
  expenseCategoryManual?: boolean;
  financial?: FinancialSummary;
  ai_verified?: boolean;
  ocr_accuracy?: number | null;
  auto_categorized?: boolean;
  overallConfidence: number;
  fields: ExtractedField[];
  lineItems: LineItem[];
  rawTextractOutput?: Record<string, unknown>;
  rawOcrText?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  approvedAt?: string;
  error?: string;
}

// ─── API request/response types ─────────────────────────────────

export interface UploadResponse {
  documentId: string;
  s3Key?: string;
  status: DocumentStatus;
}

export interface ProcessResponse {
  documentId: string;
  status: DocumentStatus;
  docType: string;
  overallConfidence: number;
  fields: ExtractedField[];
  lineItems: LineItem[];
}

export interface DocumentListResponse {
  documents: ProcessedDocument[];
  total: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Category {
  icon: string;
  title: string;
  description: string;
  iconBg: string;
}

export interface Guide {
  tag: string;
  tagClass: string;
  title: string;
  description: string;
  link: string;
}

export interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
}

export type SupportPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export interface IssueType {
  _id: string;
  name: string,
  description: string,
  priority: SupportPriority;
}

export interface SupportTicket {
  _id: string;
  issueType: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}
