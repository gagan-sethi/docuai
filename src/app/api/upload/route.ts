/**
 * POST /api/upload
 * Receives a file via FormData, uploads it to S3 (if configured),
 * otherwise keeps the file in-memory for local/demo mode.
 * Creates a DocumentRecord in MongoDB with userId from auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client, S3_BUCKET, MEDIA_BASE_URL, isS3Configured } from "@/lib/aws";
import { documentStore } from "@/lib/store";
import { getAuthUser } from "@/lib/auth";
import Activity from "@/models/Activity";
import User, { PLAN_LIMITS, PlanType } from "@/models/User";
import connectDB from "@/lib/mongodb";
import type { ProcessedDocument } from "@/lib/types";

export const runtime = "nodejs";

// Max file size: 50MB
const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const isHandwritten = formData.get("isHandwritten") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/webp",
    ];
    const isAllowed =
      allowedTypes.includes(file.type) || file.name.endsWith(".pdf");
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unsupported file type. Accepted: PDF, JPG, PNG, TIFF" },
        { status: 400 }
      );
    }

    // ── Plan limit check — before doing any S3 upload work ──
    const user = await getAuthUser(request);
    const userId = user?._id?.toString();

    if (user) {
      await connectDB();
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        const plan = (dbUser.plan || "free") as PlanType;
        const limits = PLAN_LIMITS[plan];

        // Auto-reset monthly counter if needed
        const now = new Date();
        if (dbUser.documentsResetAt && now >= dbUser.documentsResetAt) {
          dbUser.documentsUsedThisMonth = 0;
          dbUser.documentsResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          await dbUser.save();
        }

        if (limits.documentsPerMonth !== Infinity && (dbUser.documentsUsedThisMonth || 0) >= limits.documentsPerMonth) {
          return NextResponse.json(
            {
              error: "Document limit reached",
              message: `You've used all ${limits.documentsPerMonth} documents on your ${limits.label} plan this month. Please upgrade to continue.`,
              plan,
              used: dbUser.documentsUsedThisMonth,
              limit: limits.documentsPerMonth,
              upgradeRequired: true,
            },
            { status: 403 }
          );
        }
      }
    }

    const documentId = uuidv4();
    const buffer = Buffer.from(await file.arrayBuffer());
    let s3Key: string | undefined;

    if (isS3Configured && s3Client) {
      // ── S3 mode: upload to bucket ──
      s3Key = `documents/${documentId}/${file.name}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            documentId,
            originalName: file.name,
          },
        })
      );

      console.log(`[upload] S3 upload → ${s3Key}`);
    } else {
      // ── Local mode: keep file in-memory ──
      console.log(
        `[upload] S3 not configured — storing file in-memory (${(file.size / 1024).toFixed(1)} KB)`
      );
    }

    // Create document record
    const now = new Date().toISOString();
    const s3Url = s3Key && MEDIA_BASE_URL
      ? `${MEDIA_BASE_URL.replace(/\/$/, "")}/${s3Key}`
      : undefined;

    const doc: ProcessedDocument & { userId?: string } = {
      id: documentId,
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ...(s3Key ? { s3Key } : {}),
      ...(s3Url ? { s3Url } : {}),
      // In local mode, persist the raw bytes so the process route can use them
      ...(!isS3Configured ? { localBuffer: buffer.toString("base64") } : {}),
      isHandwritten,
      status: "uploaded",
      source: "upload",
      overallConfidence: 0,
      fields: [],
      lineItems: [],
      createdAt: now,
      updatedAt: now,
    };

    await documentStore.create(doc);

    // Log activity & increment document usage counter
    if (user) {
      await connectDB();
      await Promise.all([
        Activity.create({
          userId: user._id,
          action: "doc_uploaded",
          description: `Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`,
          metadata: { documentId, fileName: file.name, fileType: file.type },
        }),
        User.findByIdAndUpdate(user._id, {
          $inc: { documentsUsedThisMonth: 1 },
        }),
      ]);
    }

    return NextResponse.json({
      documentId,
      ...(s3Key ? { s3Key } : {}),
      status: "uploaded",
      message: isS3Configured
        ? "File uploaded to S3 successfully. Ready for processing."
        : "File stored locally (S3 not configured). Ready for processing.",
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
