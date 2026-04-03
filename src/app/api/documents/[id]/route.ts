/**
 * GET   /api/documents/[id]  — Get a single document with full extracted data
 * PATCH /api/documents/[id]  — Update document (edit fields, change status, approve/reject)
 * DELETE /api/documents/[id] — Delete a document
 */

import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/store";
import Activity from "@/models/Activity";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await documentStore.get(id);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Strip localBuffer from response (large base64 data)
  const { localBuffer, ...sanitized } = doc;
  return NextResponse.json(sanitized);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await request.json();

  // Allowed update fields
  const allowedFields = [
    "status",
    "fields",
    "lineItems",
    "docType",
    "overallConfidence",
  ];

  const filtered: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      filtered[key] = updates[key];
    }
  }

  // If approving, set approvedAt
  if (updates.status === "approved") {
    filtered.approvedAt = new Date().toISOString();
  }

  const doc = await documentStore.update(id, filtered);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Log activity & create notification for status changes
  const user = await getAuthUser(request);
  if (user && (updates.status === "approved" || updates.status === "rejected")) {
    await connectDB();
    const action = updates.status === "approved" ? "doc_approved" : "doc_rejected";
    await Promise.all([
      Activity.create({
        userId: user._id,
        action,
        description: `Document "${doc.fileName}" ${updates.status}`,
        metadata: { documentId: id, docType: doc.docType },
      }),
      Notification.create({
        userId: user._id,
        type: updates.status === "approved" ? "doc_approved" : "doc_rejected",
        title: `Document ${updates.status === "approved" ? "Approved" : "Rejected"}`,
        message: `"${doc.fileName}" has been ${updates.status}.`,
        data: { documentId: id },
      }),
    ]);
  }

  // Strip localBuffer from response
  const { localBuffer, ...sanitized } = doc;
  return NextResponse.json(sanitized);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await documentStore.get(id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await documentStore.delete(id);

  const user = await getAuthUser(request);
  if (user) {
    await connectDB();
    await Activity.create({
      userId: user._id,
      action: "doc_deleted",
      description: `Document "${doc.fileName}" deleted`,
      metadata: { documentId: id },
    });
  }

  return NextResponse.json({ message: "Document deleted" });
}
