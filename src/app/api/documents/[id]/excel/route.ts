/**
 * GET /api/documents/[id]/excel
 * Generates a CSV file (Excel-compatible) from the extracted document data.
 * For a full XLSX, a library like `exceljs` can be added later.
 */

import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await documentStore.get(id);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Build CSV content
  const lines: string[] = [];

  // Document header info
  lines.push("DocuAI — Extracted Document Data");
  lines.push("");
  lines.push(`Document,${csvEscape(doc.fileName)}`);
  lines.push(`Type,${csvEscape(doc.docType || "Unknown")}`);
  lines.push(`Confidence,${doc.overallConfidence}%`);
  lines.push(`Processed,${doc.processedAt || doc.updatedAt}`);
  lines.push(`Status,${doc.status}`);
  lines.push("");

  // Extracted fields
  lines.push("=== EXTRACTED FIELDS ===");
  lines.push("Field,Value,Confidence,Edited");
  for (const field of doc.fields) {
    lines.push(
      `${csvEscape(field.label)},${csvEscape(field.value)},${field.confidence}%,${field.edited ? "Yes" : "No"}`
    );
  }
  lines.push("");

  // Line items
  if (doc.lineItems.length > 0) {
    lines.push("=== LINE ITEMS ===");
    lines.push("Code,Description,Quantity,Unit Price,Total,Confidence");
    for (const item of doc.lineItems) {
      lines.push(
        `${csvEscape(item.code)},${csvEscape(item.description)},${item.qty},${csvEscape(item.unitPrice)},${csvEscape(item.total)},${item.confidence}%`
      );
    }
  }

  const csv = lines.join("\n");
  const fileName = `${doc.fileName.replace(/\.[^.]+$/, "")}_extracted.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function csvEscape(value: string): string {
  if (!value) return "";
  // If the value contains a comma, newline, or quote, wrap in quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
