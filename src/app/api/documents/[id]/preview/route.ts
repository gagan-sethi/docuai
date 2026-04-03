/**
 * GET /api/documents/[id]/preview
 * Serves the original uploaded file for inline preview.
 * Returns the raw file bytes with proper Content-Type so the
 * browser can render images / PDFs directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/store";
import { s3Client, S3_BUCKET, isS3Configured } from "@/lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await documentStore.get(id);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  let fileBytes: Buffer | null = null;

  // Try S3 first
  if (isS3Configured && s3Client && doc.s3Key) {
    try {
      const s3Response = await s3Client.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: doc.s3Key })
      );
      const bodyBytes = await s3Response.Body?.transformToByteArray();
      if (bodyBytes) {
        fileBytes = Buffer.from(bodyBytes);
      }
    } catch (err) {
      console.error("[preview] Failed to read from S3:", err);
    }
  }

  // Fall back to in-memory buffer
  if (!fileBytes && doc.localBuffer) {
    fileBytes = Buffer.from(doc.localBuffer, "base64");
  }

  if (!fileBytes) {
    return NextResponse.json(
      { error: "File data not available. The document may have already been processed and the buffer cleared." },
      { status: 404 }
    );
  }

  // Return raw file with correct content type
  const uint8 = new Uint8Array(fileBytes);
  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": doc.fileType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
