/**
 * Same-origin proxy route for document previews.
 * Forwards requests to Express backend with Bearer token header.
 */

import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const token =
    req.cookies.get("docuai_token")?.value ||
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${decodeURIComponent(token)}`;
  }

  const upstreamRes = await fetch(apiUrl(`/api/documents/${id}/preview`), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstreamRes.ok) {
    const errorBody = await upstreamRes.text().catch(() => "Preview unavailable");
    return new NextResponse(errorBody, {
      status: upstreamRes.status,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  }

  const resHeaders = new Headers();
  resHeaders.set("content-type", upstreamRes.headers.get("content-type") || "application/pdf");
  const disposition = upstreamRes.headers.get("content-disposition");
  if (disposition) {
    resHeaders.set("content-disposition", disposition);
  } else {
    resHeaders.set("content-disposition", "inline");
  }
  resHeaders.set("cache-control", "private, max-age=3600");

  return new NextResponse(upstreamRes.body, {
    status: 200,
    headers: resHeaders,
  });
}
