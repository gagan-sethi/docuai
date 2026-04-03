/**
 * GET  /api/documents        — List all documents for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/store";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  const userId = user?._id?.toString();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : undefined;

  const [documents, stats] = await Promise.all([
    documentStore.list({ userId, status, limit, page }),
    documentStore.stats(userId),
  ]);

  // Strip localBuffer from API responses (large base64 data)
  const sanitized = documents.map(({ localBuffer, ...rest }) => rest);

  return NextResponse.json({
    documents: sanitized,
    total: sanitized.length,
    stats,
  });
}
