/**
 * Mongoose model — DocumentRecord
 * Persists processed documents in MongoDB (replaces in-memory store).
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: string; // UUID from upload
  userId: mongoose.Types.ObjectId;
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key?: string;
  s3Url?: string;
  localBuffer?: string;
  isHandwritten?: boolean;
  ocrEngine?: "textract" | "paddleocr" | "none";
  status:
    | "uploading"
    | "uploaded"
    | "processing"
    | "structuring"
    | "review"
    | "approved"
    | "rejected"
    | "error";
  source: "upload" | "whatsapp";
  docType?: string;
  overallConfidence: number;
  fields: Array<{
    id: string;
    label: string;
    value: string;
    confidence: number;
    edited: boolean;
    textractKey?: string;
  }>;
  lineItems: Array<{
    id: string;
    code: string;
    description: string;
    qty: number;
    unitPrice: string;
    total: string;
    confidence: number;
  }>;
  rawTextractOutput?: Record<string, unknown>;
  rawOcrText?: string;
  processedAt?: Date;
  approvedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FieldSchema = new Schema(
  {
    id: String,
    label: String,
    value: String,
    confidence: { type: Number, default: 0 },
    edited: { type: Boolean, default: false },
    textractKey: String,
  },
  { _id: false }
);

const LineItemSchema = new Schema(
  {
    id: String,
    code: String,
    description: String,
    qty: { type: Number, default: 0 },
    unitPrice: { type: String, default: "0.00" },
    total: { type: String, default: "0.00" },
    confidence: { type: Number, default: 0 },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    s3Key: String,
    s3Url: String,
    localBuffer: { type: String, select: false }, // Large data, exclude by default
    isHandwritten: { type: Boolean, default: false },
    ocrEngine: {
      type: String,
      enum: ["textract", "paddleocr", "none"],
      default: "none",
    },
    status: {
      type: String,
      enum: [
        "uploading",
        "uploaded",
        "processing",
        "structuring",
        "review",
        "approved",
        "rejected",
        "error",
      ],
      default: "uploaded",
      index: true,
    },
    source: {
      type: String,
      enum: ["upload", "whatsapp"],
      default: "upload",
    },
    docType: String,
    overallConfidence: { type: Number, default: 0 },
    fields: [FieldSchema],
    lineItems: [LineItemSchema],
    rawTextractOutput: { type: Schema.Types.Mixed },
    rawOcrText: { type: String, select: false },
    processedAt: Date,
    approvedAt: Date,
    error: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
DocumentSchema.index({ userId: 1, status: 1 });
DocumentSchema.index({ userId: 1, createdAt: -1 });

const DocumentRecord: Model<IDocument> =
  mongoose.models.DocumentRecord ||
  mongoose.model<IDocument>("DocumentRecord", DocumentSchema);

export default DocumentRecord;
