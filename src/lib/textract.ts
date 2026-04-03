import {
  TextractClient,
  AnalyzeDocumentCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  FeatureType,
  Block,
} from "@aws-sdk/client-textract";
import { S3_BUCKET } from "@/lib/aws";

/**
 * Textract client — uses the primary AWS credentials
 * (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) which must have
 * AmazonTextractFullAccess + S3 read permissions.
 *
 * NOTE: The S3-specific keys (AWS_S3_ACCESS_KEYS) are for bucket
 * upload/download only and may NOT have Textract permissions.
 * So we intentionally use the primary keys here.
 */
const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";

const isTextractConfigured = Boolean(accessKey && secretKey);

export const textractClient: TextractClient | null = isTextractConfigured
  ? new TextractClient({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    })
  : null;

if (isTextractConfigured) {
  console.log(
    `[textract] Client configured (region=${process.env.AWS_REGION || "ap-south-1"}, ` +
    `accessKeyId=${accessKey.slice(0, 8)}...)`
  );
} else {
  console.log("[textract] No AWS credentials — Textract disabled");
}

// ─── Helper: sleep ──────────────────────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Single-page extraction (images via raw bytes) ─────────────

export interface TextractResult {
  blocks: Block[];
  fullText: string;
  kvPairs: Record<string, { value: string; confidence: number }>;
  tables: string[][][];
  pageCount: number;
}

/**
 * Synchronous single-page extraction using AnalyzeDocument.
 * Works for JPEG, PNG, TIFF images (max 10 MB, single page).
 * Sends raw bytes — no S3 required.
 */
export async function extractSinglePage(
  fileBytes: Uint8Array
): Promise<TextractResult> {
  if (!textractClient) throw new Error("Textract client not configured");

  const response = await textractClient.send(
    new AnalyzeDocumentCommand({
      Document: { Bytes: fileBytes },
      FeatureTypes: [FeatureType.FORMS, FeatureType.TABLES],
    })
  );

  const blocks = response.Blocks || [];
  return {
    blocks,
    fullText: extractFullText(blocks),
    kvPairs: extractKeyValuePairs(blocks),
    tables: extractTables(blocks),
    pageCount: 1,
  };
}

// ─── Multi-page extraction (PDFs / multi-page TIFFs via S3) ────

/**
 * Asynchronous multi-page extraction using StartDocumentAnalysis
 * + GetDocumentAnalysis polling.  The file must already be in S3.
 *
 * Supports PDFs with any number of pages and multi-page TIFFs.
 */
export async function extractMultiPage(
  s3Key: string,
  bucket?: string
): Promise<TextractResult> {
  if (!textractClient) throw new Error("Textract client not configured");

  const bucketName = bucket || S3_BUCKET;
  if (!bucketName) {
    throw new Error("S3 bucket not configured for multi-page Textract");
  }

  console.log(
    `[textract] Starting async analysis for s3://${bucketName}/${s3Key}`
  );

  // 1. Start the async job
  const startResponse = await textractClient.send(
    new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: s3Key,
        },
      },
      FeatureTypes: [FeatureType.FORMS, FeatureType.TABLES],
    })
  );

  const jobId = startResponse.JobId;
  if (!jobId) throw new Error("Textract did not return a JobId");

  console.log(`[textract] Job started: ${jobId}`);

  // 2. Poll until complete
  let status = "IN_PROGRESS";
  let allBlocks: Block[] = [];
  let nextToken: string | undefined;
  let attempt = 0;
  const MAX_ATTEMPTS = 120; // up to ~4 minutes

  while (status === "IN_PROGRESS" && attempt < MAX_ATTEMPTS) {
    await sleep(2000); // wait 2 seconds between polls
    attempt++;

    const getResponse = await textractClient.send(
      new GetDocumentAnalysisCommand({ JobId: jobId })
    );

    status = getResponse.JobStatus || "FAILED";

    if (status === "SUCCEEDED") {
      // Collect blocks from the first response
      allBlocks = getResponse.Blocks || [];
      nextToken = getResponse.NextToken;

      // Paginate to get all remaining blocks
      while (nextToken) {
        const pageResponse = await textractClient.send(
          new GetDocumentAnalysisCommand({
            JobId: jobId,
            NextToken: nextToken,
          })
        );
        allBlocks = allBlocks.concat(pageResponse.Blocks || []);
        nextToken = pageResponse.NextToken;
      }

      console.log(
        `[textract] Job ${jobId} completed — ${allBlocks.length} blocks extracted`
      );
    } else if (status === "FAILED") {
      const msg = getResponse.StatusMessage || "Textract job failed";
      throw new Error(`Textract job failed: ${msg}`);
    }
    // else still IN_PROGRESS — keep polling
  }

  if (status !== "SUCCEEDED") {
    throw new Error(
      `Textract job timed out after ${attempt * 2}s (status: ${status})`
    );
  }

  // Count distinct pages
  const pageNumbers = new Set(
    allBlocks.filter((b) => b.Page).map((b) => b.Page!)
  );
  const pageCount = pageNumbers.size || 1;

  console.log(
    `[textract] Extracted ${allBlocks.length} blocks across ${pageCount} page(s)`
  );

  return {
    blocks: allBlocks,
    fullText: extractFullText(allBlocks),
    kvPairs: extractKeyValuePairs(allBlocks),
    tables: extractTables(allBlocks),
    pageCount,
  };
}

// ─── Smart extraction: picks single-page or multi-page ─────────

/**
 * Automatically decides whether to use sync (single-page) or
 * async (multi-page) extraction based on the file type and
 * whether an S3 key is available.
 *
 *  • PDF / multi-page TIFF  → async S3-based (multi-page)
 *  • Single image + S3 key  → try async, fall back to sync bytes
 *  • Single image + bytes   → sync byte-based (single page)
 */
export async function extractWithTextract(options: {
  fileBytes?: Uint8Array;
  s3Key?: string;
  fileType: string;
  bucket?: string;
}): Promise<TextractResult> {
  const { fileBytes, s3Key, fileType, bucket } = options;

  const isPdf = fileType === "application/pdf" || fileType.endsWith(".pdf");
  const isMultiPageTiff = fileType === "image/tiff";

  // Multi-page types MUST go through the async S3-based API
  if ((isPdf || isMultiPageTiff) && s3Key) {
    console.log(`[textract] Using async multi-page API for ${isPdf ? "PDF" : "TIFF"}`);
    return extractMultiPage(s3Key, bucket);
  }

  // For PDFs without an S3 key, we cannot use the sync API (it doesn't support PDF)
  if (isPdf && !s3Key) {
    throw new Error(
      "PDF files require S3-based extraction. Upload the file to S3 first."
    );
  }

  // Single image — try async S3 first, fall back to sync bytes
  if (s3Key) {
    try {
      console.log("[textract] Trying async S3-based API for image...");
      return await extractMultiPage(s3Key, bucket);
    } catch (err) {
      console.warn(
        "[textract] Async S3 extraction failed, falling back to byte-based sync:",
        err instanceof Error ? err.message : err
      );
      if (fileBytes) {
        console.log("[textract] Falling back to sync byte-based API...");
        return extractSinglePage(fileBytes);
      }
      throw err; // no bytes to fall back to
    }
  }

  if (fileBytes) {
    console.log("[textract] Using sync byte-based API for single image");
    return extractSinglePage(fileBytes);
  }

  throw new Error(
    "No file data for Textract. Provide either fileBytes or s3Key."
  );
}

// ─── Block-level helpers (exported for process route) ───────────

export function extractKeyValuePairs(
  blocks: Block[]
): Record<string, { value: string; confidence: number }> {
  const keyMap: Record<string, Block> = {};
  const valueMap: Record<string, Block> = {};
  const blockMap: Record<string, Block> = {};

  for (const block of blocks) {
    if (block.Id) blockMap[block.Id] = block;
    if (block.BlockType === "KEY_VALUE_SET") {
      if (block.EntityTypes?.includes("KEY")) {
        keyMap[block.Id!] = block;
      } else {
        valueMap[block.Id!] = block;
      }
    }
  }

  const kvPairs: Record<string, { value: string; confidence: number }> = {};

  for (const keyId of Object.keys(keyMap)) {
    const keyBlock = keyMap[keyId];
    const keyText = getTextFromBlock(keyBlock, blockMap);

    const valueRel = keyBlock.Relationships?.find((r) => r.Type === "VALUE");
    if (valueRel?.Ids) {
      for (const valueId of valueRel.Ids) {
        const valBlock = valueMap[valueId];
        if (valBlock) {
          const valueText = getTextFromBlock(valBlock, blockMap);
          const confidence = Math.round(
            ((keyBlock.Confidence || 0) + (valBlock.Confidence || 0)) / 2
          );
          if (keyText.trim()) {
            kvPairs[keyText.trim()] = {
              value: valueText.trim(),
              confidence,
            };
          }
        }
      }
    }
  }

  return kvPairs;
}

export function extractTables(blocks: Block[]): string[][][] {
  const blockMap: Record<string, Block> = {};
  for (const block of blocks) {
    if (block.Id) blockMap[block.Id] = block;
  }

  const tables: string[][][] = [];
  const tableBlocks = blocks.filter((b) => b.BlockType === "TABLE");

  for (const table of tableBlocks) {
    const rows: Record<number, Record<number, string>> = {};
    const cellBlocks = table.Relationships?.find((r) => r.Type === "CHILD");

    if (cellBlocks?.Ids) {
      for (const cellId of cellBlocks.Ids) {
        const cell = blockMap[cellId];
        if (cell?.BlockType === "CELL") {
          const row = cell.RowIndex || 0;
          const col = cell.ColumnIndex || 0;
          if (!rows[row]) rows[row] = {};
          rows[row][col] = getTextFromBlock(cell, blockMap);
        }
      }
    }

    const tableData: string[][] = [];
    const rowKeys = Object.keys(rows)
      .map(Number)
      .sort((a, b) => a - b);
    for (const rowKey of rowKeys) {
      const colKeys = Object.keys(rows[rowKey])
        .map(Number)
        .sort((a, b) => a - b);
      tableData.push(colKeys.map((c) => rows[rowKey][c]));
    }
    tables.push(tableData);
  }

  return tables;
}

export function getTextFromBlock(
  block: Block,
  blockMap: Record<string, Block>
): string {
  let text = "";
  const childRel = block.Relationships?.find((r) => r.Type === "CHILD");
  if (childRel?.Ids) {
    for (const id of childRel.Ids) {
      const child = blockMap[id];
      if (child?.BlockType === "WORD") {
        text += (child.Text || "") + " ";
      } else if (child?.BlockType === "SELECTION_ELEMENT") {
        text += child.SelectionStatus === "SELECTED" ? "☑ " : "☐ ";
      }
    }
  }
  return text.trim();
}

export function extractFullText(blocks: Block[]): string {
  return blocks
    .filter((b) => b.BlockType === "LINE")
    .map((b) => b.Text || "")
    .join("\n");
}
