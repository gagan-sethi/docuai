import type { ProcessedDocument } from "./types";

export interface UploadBatchRecord {
  id: string;
  number: number;
  label: string;
  uploadedAt: string;
  documentCount: number;
  documentIds: string[];
  fileNames: string[];
  createdBy?: string;
  status: "processing" | "complete" | "partial";
}

export interface BatchSummary {
  id: string;
  number?: number;
  label: string;
  uploadedAt: string;
  documentCount: number;
  documentIds: string[];
  fileNames: string[];
  createdBy?: string;
  status?: UploadBatchRecord["status"];
}

const BATCH_STORAGE_KEY = "docuai.uploadBatches";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readBatches(): UploadBatchRecord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBatches(batches: UploadBatchRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batches));
}

function upsertBatch(batch: UploadBatchRecord) {
  const batches = readBatches();
  writeBatches([batch, ...batches.filter((item) => item.id !== batch.id)]);
}

function padBatchNumber(value: number): string {
  return String(value).padStart(3, "0");
}

export function formatBatchLabel(value: number): string {
  return `Batch #${padBatchNumber(value)}`;
}

export function batchFileReference(batch: Pick<BatchSummary, "id" | "number" | "label"> | undefined): string {
  if (!batch) return "batch";
  if (typeof batch.number === "number") return `batch-${padBatchNumber(batch.number)}`;
  const labelNumber = batch.label.match(/\d+/)?.[0];
  if (labelNumber) return `batch-${padBatchNumber(Number(labelNumber))}`;
  return batch.id.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "batch";
}

export function batchDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function batchSummaryLine(batch: Pick<BatchSummary, "label" | "documentCount" | "uploadedAt">): string {
  return `${batch.label} - ${batch.documentCount} document${batch.documentCount === 1 ? "" : "s"} uploaded on ${batchDateLabel(batch.uploadedAt)}`;
}

export function getStoredBatches(): UploadBatchRecord[] {
  return readBatches();
}

export function createUploadBatch(fileNames: string[], createdBy?: string): UploadBatchRecord {
  const batches = readBatches();
  const number = batches.reduce((max, batch) => Math.max(max, batch.number || 0), 0) + 1;
  const uploadedAt = new Date().toISOString();
  const batch: UploadBatchRecord = {
    id: `batch-${padBatchNumber(number)}-${uploadedAt.slice(0, 10)}`,
    number,
    label: formatBatchLabel(number),
    uploadedAt,
    documentCount: fileNames.length,
    documentIds: [],
    fileNames,
    createdBy,
    status: "processing",
  };
  writeBatches([batch, ...batches]);
  return batch;
}

export async function createUploadBatchFromApi(
  endpoint: string,
  fileNames: string[],
  createdBy?: string
): Promise<UploadBatchRecord> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ documentCount: fileNames.length, fileNames }),
    });
    if (res.ok) {
      const data = await res.json();
      const batch = data.batch as Partial<UploadBatchRecord> | undefined;
      if (batch?.id && batch.label && batch.uploadedAt) {
        const record: UploadBatchRecord = {
          id: batch.id,
          number: Number(batch.number) || 0,
          label: batch.label,
          uploadedAt: batch.uploadedAt,
          documentCount: Number(batch.documentCount) || fileNames.length,
          documentIds: Array.isArray(batch.documentIds) ? batch.documentIds : [],
          fileNames: Array.isArray(batch.fileNames) ? batch.fileNames : fileNames,
          createdBy: batch.createdBy || createdBy,
          status: batch.status || "processing",
        };
        upsertBatch(record);
        return record;
      }
    }
  } catch {
    /* fall back to local batch generation below */
  }
  return createUploadBatch(fileNames, createdBy);
}

export function recordBatchDocument(batchId: string, documentId: string, fileName?: string) {
  const batches = readBatches();
  const updated = batches.map((batch) => {
    if (batch.id !== batchId) return batch;
    const documentIds = Array.from(new Set([...batch.documentIds, documentId]));
    const fileNames = fileName ? Array.from(new Set([...batch.fileNames, fileName])) : batch.fileNames;
    return { ...batch, documentIds, fileNames };
  });
  writeBatches(updated);
}

export function completeUploadBatch(batchId: string) {
  const batches = readBatches();
  const updated = batches.map((batch) => {
    if (batch.id !== batchId) return batch;
    const status: UploadBatchRecord["status"] =
      batch.documentIds.length >= batch.documentCount ? "complete" : "partial";
    return { ...batch, status };
  });
  writeBatches(updated);
}

export function getDocumentBatchId(doc: ProcessedDocument): string {
  return doc.batchId || "";
}

export function getDocumentBatchLabel(doc: ProcessedDocument): string {
  if (doc.batchLabel) return doc.batchLabel;
  if (typeof doc.batchNumber === "number") return formatBatchLabel(doc.batchNumber);
  return doc.batchId || "Unbatched";
}

export function annotateDocumentsWithBatches(docs: ProcessedDocument[]): ProcessedDocument[] {
  const batches = readBatches();
  if (batches.length === 0) return docs;

  const byDocumentId = new Map<string, UploadBatchRecord>();
  for (const batch of batches) {
    for (const docId of batch.documentIds) {
      byDocumentId.set(docId, batch);
    }
  }

  return docs.map((doc) => {
    if (doc.batchId) return doc;
    const batch = byDocumentId.get(doc.id);
    if (!batch) return doc;
    return {
      ...doc,
      batchId: batch.id,
      batchLabel: batch.label,
      batchNumber: batch.number,
      batchUploadedAt: batch.uploadedAt,
      batchDocumentCount: batch.documentCount,
      createdByName: doc.createdByName || batch.createdBy,
    };
  });
}

export function buildBatchSummaries(docs: ProcessedDocument[] = []): BatchSummary[] {
  const map = new Map<string, BatchSummary>();

  for (const batch of readBatches()) {
    map.set(batch.id, {
      id: batch.id,
      number: batch.number,
      label: batch.label,
      uploadedAt: batch.uploadedAt,
      documentCount: batch.documentCount,
      documentIds: [...batch.documentIds],
      fileNames: [...batch.fileNames],
      createdBy: batch.createdBy,
      status: batch.status,
    });
  }

  for (const doc of docs) {
    if (!doc.batchId) continue;
    const existing = map.get(doc.batchId);
    if (existing) {
      existing.documentIds = Array.from(new Set([...existing.documentIds, doc.id]));
      existing.fileNames = Array.from(new Set([...existing.fileNames, doc.fileName]));
      existing.documentCount = Math.max(existing.documentCount, doc.batchDocumentCount || existing.documentIds.length);
      if (!existing.uploadedAt) existing.uploadedAt = doc.batchUploadedAt || doc.createdAt;
      continue;
    }
    map.set(doc.batchId, {
      id: doc.batchId,
      number: doc.batchNumber,
      label: getDocumentBatchLabel(doc),
      uploadedAt: doc.batchUploadedAt || doc.createdAt,
      documentCount: doc.batchDocumentCount || 1,
      documentIds: [doc.id],
      fileNames: [doc.fileName],
      createdBy: doc.createdByName || doc.createdBy,
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const byDate = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    if (byDate !== 0) return byDate;
    return (b.number || 0) - (a.number || 0);
  });
}

export function getLatestBatch(docs: ProcessedDocument[] = []): BatchSummary | undefined {
  return buildBatchSummaries(docs)[0];
}
