/**
 * MongoDB-backed document store.
 * Wraps the DocumentRecord Mongoose model behind a clean async interface.
 * All methods require a userId to scope data to the authenticated user.
 *
 * For unauthenticated / background jobs (e.g., process route updating status),
 * use the `byDocumentId` helpers that look up by documentId alone.
 */

import mongoose from "mongoose";
import connectDB from "./mongodb";
import DocumentRecord, { IDocument } from "@/models/DocumentRecord";
import type { ProcessedDocument } from "./types";

// Helper: convert userId string to ObjectId for queries
function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

// ─── Helpers to convert between Mongoose doc and ProcessedDocument ──

function toProcessed(doc: IDocument): ProcessedDocument {
  return {
    id: doc.documentId,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    fileType: doc.fileType,
    s3Key: doc.s3Key,
    s3Url: doc.s3Url,
    localBuffer: doc.localBuffer,
    isHandwritten: doc.isHandwritten,
    ocrEngine: doc.ocrEngine,
    status: doc.status,
    source: doc.source,
    docType: doc.docType,
    overallConfidence: doc.overallConfidence,
    fields: doc.fields as ProcessedDocument["fields"],
    lineItems: doc.lineItems as ProcessedDocument["lineItems"],
    rawTextractOutput: doc.rawTextractOutput,
    rawOcrText: doc.rawOcrText,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    processedAt: doc.processedAt?.toISOString?.(),
    approvedAt: doc.approvedAt?.toISOString?.(),
    error: doc.error,
  };
}

// ─── DocumentStore ──────────────────────────────────────────────

class DocumentStore {
  /**
   * Create a new document record.
   */
  async create(
    doc: ProcessedDocument & { userId?: string }
  ): Promise<ProcessedDocument> {
    await connectDB();
    const record = await DocumentRecord.create({
      documentId: doc.id,
      userId: doc.userId || "000000000000000000000000", // fallback for unauthenticated
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      s3Key: doc.s3Key,
      s3Url: doc.s3Url,
      localBuffer: doc.localBuffer,
      isHandwritten: doc.isHandwritten,
      status: doc.status,
      source: doc.source,
      overallConfidence: doc.overallConfidence,
      fields: doc.fields,
      lineItems: doc.lineItems,
    });
    return toProcessed(record);
  }

  /**
   * Get a document by its UUID (documentId).
   * Includes localBuffer for processing.
   */
  async get(documentId: string): Promise<ProcessedDocument | undefined> {
    await connectDB();
    const doc = await DocumentRecord.findOne({ documentId }).select(
      "+localBuffer +rawOcrText"
    );
    return doc ? toProcessed(doc) : undefined;
  }

  /**
   * Update a document by its UUID.
   */
  async update(
    documentId: string,
    updates: Partial<ProcessedDocument>
  ): Promise<ProcessedDocument | undefined> {
    await connectDB();

    // Map ProcessedDocument fields to DocumentRecord fields
    const mongoUpdates: Record<string, unknown> = {};
    const directFields = [
      "fileName",
      "fileSize",
      "fileType",
      "s3Key",
      "s3Url",
      "localBuffer",
      "isHandwritten",
      "ocrEngine",
      "status",
      "source",
      "docType",
      "overallConfidence",
      "fields",
      "lineItems",
      "rawTextractOutput",
      "rawOcrText",
      "error",
    ];

    for (const key of directFields) {
      if (key in updates) {
        mongoUpdates[key] = (updates as Record<string, unknown>)[key];
      }
    }

    // Handle date fields
    if (updates.processedAt) {
      mongoUpdates.processedAt = new Date(updates.processedAt);
    }
    if (updates.approvedAt) {
      mongoUpdates.approvedAt = new Date(updates.approvedAt);
    }

    const doc = await DocumentRecord.findOneAndUpdate(
      { documentId },
      { $set: mongoUpdates },
      { new: true }
    ).select("+localBuffer +rawOcrText");

    return doc ? toProcessed(doc) : undefined;
  }

  /**
   * Delete a document by its UUID.
   */
  async delete(documentId: string): Promise<boolean> {
    await connectDB();
    const result = await DocumentRecord.deleteOne({ documentId });
    return result.deletedCount > 0;
  }

  /**
   * List documents, scoped by userId.
   */
  async list(options?: {
    userId?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ProcessedDocument[]> {
    await connectDB();

    const filter: Record<string, unknown> = {};
    if (options?.userId) filter.userId = toObjectId(options.userId);
    if (options?.status) filter.status = options.status;

    const limit = options?.limit || 50;
    const page = options?.page || 1;

    const docs = await DocumentRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<IDocument[]>();

    return docs.map(toProcessed);
  }

  /**
   * Count documents, optionally by status and userId.
   */
  async count(status?: string, userId?: string): Promise<number> {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (userId) filter.userId = toObjectId(userId);
    return DocumentRecord.countDocuments(filter);
  }

  /**
   * Get aggregate stats, optionally scoped to a userId.
   */
  async stats(userId?: string) {
    await connectDB();

    const match: Record<string, unknown> = {};
    if (userId) match.userId = toObjectId(userId);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          uploading: {
            $sum: { $cond: [{ $eq: ["$status", "uploading"] }, 1, 0] },
          },
          processing: {
            $sum: {
              $cond: [
                { $in: ["$status", ["processing", "structuring"]] },
                1,
                0,
              ],
            },
          },
          review: {
            $sum: { $cond: [{ $eq: ["$status", "review"] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          errors: {
            $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] },
          },
          totalConfidence: {
            $sum: {
              $cond: [{ $gt: ["$overallConfidence", 0] }, "$overallConfidence", 0],
            },
          },
          confidenceCount: {
            $sum: {
              $cond: [{ $gt: ["$overallConfidence", 0] }, 1, 0],
            },
          },
        },
      },
    ];

    const [result] = await DocumentRecord.aggregate(pipeline);

    if (!result) {
      return {
        total: 0,
        uploading: 0,
        processing: 0,
        review: 0,
        approved: 0,
        rejected: 0,
        errors: 0,
        avgConfidence: 0,
      };
    }

    return {
      total: result.total,
      uploading: result.uploading,
      processing: result.processing,
      review: result.review,
      approved: result.approved,
      rejected: result.rejected,
      errors: result.errors,
      avgConfidence:
        result.confidenceCount > 0
          ? Math.round(result.totalConfidence / result.confidenceCount)
          : 0,
    };
  }
}

// Singleton instance
const globalStore = globalThis as typeof globalThis & {
  _documentStore?: DocumentStore;
};

if (!globalStore._documentStore) {
  globalStore._documentStore = new DocumentStore();
}

export const documentStore: DocumentStore = globalStore._documentStore;
