/**
 * Thin proxy → docuai-api `/api/merge-csv/:jobId` (status)
 * and `/api/merge-csv/:jobId/download` (CSV body) when `?download=1`.
 */

import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;
  const url = new URL(req.url);
  const wantDownload = url.searchParams.get("download") === "1";

  const upstreamPath = wantDownload
    ? `/api/merge-csv/${encodeURIComponent(jobId)}/download`
    : `/api/merge-csv/${encodeURIComponent(jobId)}`;

  const cookie = req.headers.get("cookie") ?? "";
  const auth = req.headers.get("authorization") ?? "";

  const upstream = await fetch(apiUrl(upstreamPath), {
    method: "GET",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(auth ? { authorization: auth } : {}),
    },
    cache: "no-store",
  });

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  headers.set("content-type", contentType);
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
