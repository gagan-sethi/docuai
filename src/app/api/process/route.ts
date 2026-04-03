/**
 * POST /api/process
 * Takes a document ID, retrieves the file (from S3 or in-memory),
 * runs Amazon Textract when configured, then sends output to OpenAI
 * for intelligent structuring.
 *
 * Modes:
 *  - Full:  S3 → Textract OCR → OpenAI structuring → store results
 *  - Local: in-memory buffer → (skip Textract) → OpenAI structuring → store results
 *  - Demo:  no AWS, no OpenAI → returns realistic sample data
 */

import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  textractClient,
  extractWithTextract,
} from "@/lib/textract";
import { s3Client, S3_BUCKET, isS3Configured } from "@/lib/aws";
import { openai, isAIConfigured, aiProvider, azureDeployment } from "@/lib/openai";
import { paddleOcrFromFile, paddleOcrFromBase64, isPaddleOcrAvailable } from "@/lib/paddleocr";
import { documentStore } from "@/lib/store";
import type { ExtractedField, LineItem } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 300; // Allow up to 5 min for multi-page Textract + OpenAI

// ─── Textract helpers are now in @/lib/textract.ts ──────────────

// ─── OpenAI structuring ────────────────────────────────────────

async function structureWithOpenAI(
  fullText: string,
  kvPairs: Record<string, { value: string; confidence: number }>,
  tables: string[][][],
  fileName: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{
  docType: string;
  fields: ExtractedField[];
  lineItems: LineItem[];
  overallConfidence: number;
}> {
  const hasOcrText = fullText && !fullText.startsWith("[File:");

  const prompt = hasOcrText
    ? `You are an expert document data extraction AI. Analyze the following OCR output from a business document and structure it into clean, validated data.

## Document File Name: ${fileName}

## Raw OCR Text:
${fullText}

## Detected Key-Value Pairs (from Textract):
${JSON.stringify(kvPairs, null, 2)}

## Detected Tables:
${JSON.stringify(tables, null, 2)}`
    : `You are an expert document data extraction AI. Analyze the attached document image and extract all data from it.

## Document File Name: ${fileName}

IMPORTANT: Read the ACTUAL content from the document image. Do NOT invent or fabricate any data. Extract exactly what you see in the document.`;

  const instructions = `
## Instructions:
1. **Identify the document type** (Invoice, Purchase Order, Delivery Note, Receipt, Bill of Lading, Quotation, Credit Note, or Other).
2. **Extract header fields** — look for: Document Number, Date, Vendor/Supplier Name, Vendor Code, Customer Name, PO Number, Invoice Number, Payment Terms, Currency, Delivery Date, Shipping Address, Subtotal, Tax/VAT, Grand Total, Due Date, and any other relevant business fields.
3. **Extract line items** — look for item codes, descriptions, quantities, unit prices, totals. If the table data is ambiguous, use context to assign correct columns.
4. **Improve accuracy** — cross-validate totals (sum of line items vs. stated subtotal), fix OCR errors in numbers (e.g., "l" → "1", "O" → "0"), standardize date formats, clean up currency values.
5. **Handle handwritten text** — if the text appears handwritten or has low OCR confidence, flag it but still attempt best-effort extraction.
6. **Assign confidence scores** (0-100) based on OCR quality and cross-validation.
7. **NEVER invent data** — only extract what is actually present in the document. If a field is not found, do not include it.

## Response Format (JSON only, no markdown):
{
  "docType": "Invoice",
  "overallConfidence": 92,
  "fields": [
    { "label": "Document Type", "value": "Invoice", "confidence": 99 },
    { "label": "Invoice Number", "value": "INV-2026-001", "confidence": 95 },
    ...more fields
  ],
  "lineItems": [
    { "code": "PRD-001", "description": "Item name", "qty": 5, "unitPrice": "100.00", "total": "500.00", "confidence": 94 },
    ...more items
  ]
}

Important: Return ONLY valid JSON, no explanation text, no markdown code fences.`;

  // Use the Azure deployment name if using Azure, otherwise "gpt-4o"
  const modelName = aiProvider === "azure" && azureDeployment
    ? azureDeployment
    : "gpt-4o";

  // Build the user message — with or without image
  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" | "low" | "auto" } }
  > = [];

  // If we have an image and no OCR text, send the image to GPT-4o Vision
  if (imageBase64 && imageMimeType && !hasOcrText) {
    const mimeForDataUrl = imageMimeType === "application/pdf" ? "image/png" : imageMimeType;
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeForDataUrl};base64,${imageBase64}`,
        detail: "high",
      },
    });
    console.log(`[process] Sending document image to GPT-4o Vision (${mimeForDataUrl})`);
  }

  userContent.push({ type: "text", text: prompt + instructions });

  console.log(`[process] Calling AI (${aiProvider}) model=${modelName}${imageBase64 && !hasOcrText ? " [with vision]" : ""}...`);

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "system",
        content:
          "You are a document data extraction specialist. Always respond with valid JSON only. No markdown, no explanations. Extract business document data with high accuracy. NEVER fabricate or invent data — only extract what is actually in the document.",
      },
      { role: "user", content: userContent },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content || "{}";

  // Clean response — remove markdown fences if present
  const cleaned = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Add IDs to fields and lineItems
    const fields: ExtractedField[] = (parsed.fields || []).map(
      (f: { label: string; value: string; confidence: number }, i: number) => ({
        id: `f${i + 1}`,
        label: f.label,
        value: f.value,
        confidence: f.confidence || 80,
        edited: false,
      })
    );

    const lineItems: LineItem[] = (parsed.lineItems || []).map(
      (
        item: {
          code: string;
          description: string;
          qty: number;
          unitPrice: string;
          total: string;
          confidence: number;
        },
        i: number
      ) => ({
        id: `l${i + 1}`,
        code: item.code || "",
        description: item.description || "",
        qty: item.qty || 0,
        unitPrice: item.unitPrice || "0.00",
        total: item.total || "0.00",
        confidence: item.confidence || 80,
      })
    );

    return {
      docType: parsed.docType || "Unknown",
      fields,
      lineItems,
      overallConfidence: parsed.overallConfidence || 80,
    };
  } catch {
    console.error("Failed to parse OpenAI response:", cleaned);
    return {
      docType: "Unknown",
      fields: [],
      lineItems: [],
      overallConfidence: 0,
    };
  }
}

// ─── OpenAI / Azure OpenAI availability check ─────────────────
// Now uses the centralized check from @/lib/openai
const isOpenAIConfigured = isAIConfigured;

// ─── Demo / fallback data ──────────────────────────────────────

function generateDemoData(fileName: string): {
  docType: string;
  fields: ExtractedField[];
  lineItems: LineItem[];
  overallConfidence: number;
} {
  const isInvoice = /invoice/i.test(fileName);
  const isPO = /po|purchase/i.test(fileName);
  const isReceipt = /receipt/i.test(fileName);
  const docType = isInvoice
    ? "Invoice"
    : isPO
      ? "Purchase Order"
      : isReceipt
        ? "Receipt"
        : "Invoice";

  // Randomised vendor / customer pools so each upload looks different
  const vendors = [
    { name: "Hamdan Trading LLC", code: "VND-0042" },
    { name: "Gulf Supplies FZE", code: "VND-0118" },
    { name: "Rashid Industrial Co.", code: "VND-0073" },
    { name: "Emirates Office Solutions", code: "VND-0205" },
    { name: "Al Ain Distribution FZCO", code: "VND-0091" },
    { name: "Sharjah Paper Mills", code: "VND-0164" },
  ];
  const customers = [
    "Al Futtaim Group",
    "Majid Al Futtaim Holding",
    "Dubai Municipality",
    "ADNOC Distribution",
    "Emaar Properties",
    "Etisalat Business",
  ];
  const currencies = ["AED", "AED", "AED", "USD", "SAR"];
  const paymentTerms = ["Net 30", "Net 45", "Net 60", "Due on Receipt", "Net 15"];

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randConf = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

  const vendor = pick(vendors);
  const customer = pick(customers);
  const currency = pick(currencies);
  const payment = pick(paymentTerms);
  const docNum = `${docType === "Invoice" ? "INV" : docType === "Purchase Order" ? "PO" : "REC"}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Randomised line items from a pool
  const itemPool = [
    { code: "PRD-001", description: "Office Paper A4 (500 sheets)", price: 45 },
    { code: "PRD-002", description: "Printer Ink Cartridge Black", price: 120 },
    { code: "PRD-003", description: "Filing Folders (pack of 25)", price: 35 },
    { code: "PRD-004", description: "Sticky Notes (12-pack)", price: 18 },
    { code: "PRD-005", description: "Ballpoint Pens (box of 50)", price: 22 },
    { code: "PRD-006", description: "Desk Organiser Tray", price: 85 },
    { code: "PRD-007", description: "Laminating Pouches (100-pack)", price: 55 },
    { code: "SVC-010", description: "Document Scanning Service", price: 8350 },
    { code: "SVC-011", description: "Courier & Logistics", price: 450 },
    { code: "SVC-012", description: "Office Equipment Maintenance", price: 1200 },
    { code: "MAT-020", description: "Thermal Paper Rolls (box of 10)", price: 95 },
    { code: "MAT-021", description: "Binding Combs Assortment", price: 42 },
  ];

  // Pick 3-6 random items
  const numItems = 3 + Math.floor(Math.random() * 4);
  const shuffled = [...itemPool].sort(() => Math.random() - 0.5).slice(0, numItems);

  const lineItems: LineItem[] = shuffled.map((item, i) => {
    const qty = item.price > 1000 ? 1 : Math.floor(2 + Math.random() * 48);
    const total = qty * item.price;
    return {
      id: `l${i + 1}`,
      code: item.code,
      description: item.description,
      qty,
      unitPrice: item.price.toFixed(2),
      total: total.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      confidence: randConf(85, 98),
    };
  });

  const subtotal = shuffled.reduce((sum, item, i) => {
    const qty = lineItems[i].qty;
    return sum + qty * item.price;
  }, 0);
  const vat = Math.round(subtotal * 5) / 100;
  const grandTotal = subtotal + vat;

  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + (payment === "Net 30" ? 30 : payment === "Net 45" ? 45 : payment === "Net 60" ? 60 : payment === "Net 15" ? 15 : 0));
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

  const fields: ExtractedField[] = [
    { id: "f1", label: "Document Type", value: docType, confidence: randConf(96, 99), edited: false },
    { id: "f2", label: `${docType} Number`, value: docNum, confidence: randConf(93, 98), edited: false },
    { id: "f3", label: "Date", value: fmtDate(today), confidence: randConf(95, 99), edited: false },
    { id: "f4", label: "Vendor Name", value: vendor.name, confidence: randConf(88, 97), edited: false },
    { id: "f5", label: "Vendor Code", value: vendor.code, confidence: randConf(85, 95), edited: false },
    { id: "f6", label: "Customer Name", value: customer, confidence: randConf(90, 98), edited: false },
    { id: "f7", label: "Currency", value: currency, confidence: randConf(96, 99), edited: false },
    { id: "f8", label: "Subtotal", value: subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 }), confidence: randConf(90, 97), edited: false },
    { id: "f9", label: "VAT (5%)", value: vat.toLocaleString("en-US", { minimumFractionDigits: 2 }), confidence: randConf(93, 99), edited: false },
    { id: "f10", label: "Grand Total", value: grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 }), confidence: randConf(91, 98), edited: false },
    { id: "f11", label: "Payment Terms", value: payment, confidence: randConf(82, 94), edited: false },
    { id: "f12", label: "Due Date", value: fmtDate(dueDate), confidence: randConf(86, 95), edited: false },
  ];

  return { docType, fields, lineItems, overallConfidence: randConf(88, 97) };
}

// ─── Main handler ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const doc = await documentStore.get(documentId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    await documentStore.update(documentId, { status: "processing" });

    let fileBytes: Uint8Array | undefined;
    let fullText = "";
    let kvPairs: Record<string, { value: string; confidence: number }> = {};
    let tables: string[][][] = [];
    let textractBlockCount = 0;

    // ────────────────────────────────────────────────────────────
    // Step 1: Obtain the file bytes
    // ────────────────────────────────────────────────────────────
    if (isS3Configured && s3Client && doc.s3Key) {
      // ── S3 mode ──
      const s3Response = await s3Client.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: doc.s3Key })
      );
      fileBytes = await s3Response.Body?.transformToByteArray();

      if (!fileBytes) {
        await documentStore.update(documentId, { status: "error", error: "Could not read file from S3" });
        return NextResponse.json({ error: "Could not read file from S3" }, { status: 500 });
      }
      console.log(`[process] Read ${fileBytes.length} bytes from S3`);
    } else if (doc.localBuffer) {
      // ── Local / demo mode ──
      fileBytes = new Uint8Array(Buffer.from(doc.localBuffer, "base64"));
      console.log(`[process] Using in-memory buffer (${fileBytes.length} bytes)`);
    } else {
      // No file available at all
      await documentStore.update(documentId, {
        status: "error",
        error: "No file data available. S3 is not configured and no local buffer was stored.",
      });
      return NextResponse.json(
        { error: "No file data available" },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────────
    // Step 2: OCR — PaddleOCR (handwritten), Textract (printed), or skip
    // ────────────────────────────────────────────────────────────
    let ocrEngine: "textract" | "paddleocr" | "none" = "none";

    if (doc.isHandwritten && fileBytes) {
      // ── Handwritten → PaddleOCR ──
      console.log("[process] Document flagged as handwritten — trying PaddleOCR...");
      const paddleAvailable = await isPaddleOcrAvailable();

      if (paddleAvailable) {
        let paddleResult;

        if (doc.localBuffer) {
          // Send base64 directly — avoids re-encoding
          paddleResult = await paddleOcrFromBase64(
            doc.localBuffer,
            doc.fileName,
            doc.fileType
          );
        } else {
          paddleResult = await paddleOcrFromFile(fileBytes, doc.fileName, doc.fileType);
        }

        if (paddleResult && paddleResult.text) {
          fullText = paddleResult.text;
          ocrEngine = "paddleocr";
          console.log(
            `[process] PaddleOCR extracted ${paddleResult.blocks.length} blocks, ` +
            `${fullText.length} chars, ${paddleResult.confidence}% confidence, ` +
            `${paddleResult.processingTimeMs}ms`
          );

          // Build kvPairs from PaddleOCR blocks for OpenAI context
          // PaddleOCR doesn't natively do key-value extraction,
          // but we pass the raw text to OpenAI for structuring
        } else {
          console.warn("[process] PaddleOCR returned no text — falling back");
        }
      } else {
        console.warn("[process] PaddleOCR service not available — will try Textract/OpenAI fallback");
      }
    }

    // If no OCR done yet (printed doc or PaddleOCR unavailable), try Textract
    if (ocrEngine === "none" && textractClient) {
      try {
        console.log("[process] Running Amazon Textract...");

        // Use the smart extraction that picks single-page (bytes) or
        // multi-page (S3-based async) automatically.
        const textractResult = await extractWithTextract({
          fileBytes,
          s3Key: doc.s3Key,
          fileType: doc.fileType,
        });

        textractBlockCount = textractResult.blocks.length;

        if (textractResult.blocks.length > 0) {
          fullText = textractResult.fullText;
          kvPairs = textractResult.kvPairs;
          tables = textractResult.tables;
          ocrEngine = "textract";
        }
        console.log(
          `[process] Textract extracted ${textractResult.blocks.length} blocks, ` +
          `${textractResult.pageCount} page(s), ${fullText.length} chars`
        );
      } catch (textractErr) {
        const errMsg = textractErr instanceof Error ? textractErr.message : String(textractErr);
        console.error("[process] Textract failed:", errMsg, textractErr);
        // Store the error so it's visible in the API response
        await documentStore.update(documentId, {
          rawTextractOutput: { error: errMsg },
        });
      }
    } else if (ocrEngine === "none") {
      console.log("[process] No OCR engine available — skipping OCR step");
    }

    await documentStore.update(documentId, { status: "structuring", rawOcrText: fullText || undefined });

    // ────────────────────────────────────────────────────────────
    // Step 3: Structure with OpenAI (if configured) or use demo data
    // ────────────────────────────────────────────────────────────
    let structured: {
      docType: string;
      fields: ExtractedField[];
      lineItems: LineItem[];
      overallConfidence: number;
    };

    if (isOpenAIConfigured) {
      // When we have OCR text, use it; otherwise send the image to GPT-4o Vision
      const textForAI = fullText || `[File: ${doc.fileName}, Type: ${doc.fileType}, Size: ${doc.fileSize} bytes. No OCR text extracted.]`;

      // Prepare image base64 for Vision — only for image types (not PDFs)
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      const isImageType = ["image/jpeg", "image/png", "image/webp", "image/tiff"].includes(doc.fileType);

      if (!fullText && doc.localBuffer && isImageType) {
        imageBase64 = doc.localBuffer;
        imageMimeType = doc.fileType;
        console.log("[process] No OCR text — will use GPT-4o Vision to read the document image directly");
      } else if (!fullText && fileBytes && isImageType) {
        imageBase64 = Buffer.from(fileBytes).toString("base64");
        imageMimeType = doc.fileType;
        console.log("[process] No OCR text — will use GPT-4o Vision to read the document image directly");
      } else if (!fullText) {
        console.log("[process] No OCR text and document is PDF or unsupported for vision — GPT-4o will work from filename only");
      }

      structured = await structureWithOpenAI(textForAI, kvPairs, tables, doc.fileName, imageBase64, imageMimeType);
      console.log(`[process] AI structured → ${structured.docType}, ${structured.fields.length} fields`);
    } else {
      // No OpenAI key either — use demo data
      console.log("[process] OpenAI not configured — using demo data");
      structured = generateDemoData(doc.fileName);
    }

    // ────────────────────────────────────────────────────────────
    // Step 4: Store results
    // ────────────────────────────────────────────────────────────
    const processedAt = new Date().toISOString();
    await documentStore.update(documentId, {
      status: "review",
      docType: structured.docType,
      overallConfidence: structured.overallConfidence,
      fields: structured.fields,
      lineItems: structured.lineItems,
      ocrEngine,
      rawTextractOutput: {
        blockCount: textractBlockCount,
        keyValuePairs: kvPairs,
        tableCount: tables.length,
        fullTextLength: fullText.length,
        mode: ocrEngine === "paddleocr"
          ? "paddleocr+openai"
          : isS3Configured
            ? "s3+textract"
            : isOpenAIConfigured
              ? "local+openai"
              : "demo",
      },
      rawOcrText: fullText || undefined,
      processedAt,
      // Keep localBuffer so the preview route can serve the original file
    });

    return NextResponse.json({
      documentId,
      status: "review",
      docType: structured.docType,
      overallConfidence: structured.overallConfidence,
      fields: structured.fields,
      lineItems: structured.lineItems,
      processedAt,
      ocrEngine,
      isHandwritten: doc.isHandwritten || false,
      mode: ocrEngine === "paddleocr"
        ? "paddleocr"
        : isS3Configured
          ? "full"
          : isOpenAIConfigured
            ? "openai-only"
            : "demo",
    });
  } catch (error: unknown) {
    console.error("Processing error:", error);

    // Try to update document status
    try {
      const body = await request.clone().json();
      if (body.documentId) {
        await documentStore.update(body.documentId, {
          status: "error",
          error: error instanceof Error ? error.message : "Processing failed",
        });
      }
    } catch {
      // Ignore
    }

    const message =
      error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
