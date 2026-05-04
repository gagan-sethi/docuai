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
  docType?: string; // Invoice, Purchase Order, Delivery Note, Receipt, etc.
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

export interface IssueType {
  _id: string;
  name: string,
  description: string,
}

export interface SupportTicket {
  _id: string;
  issueType: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

