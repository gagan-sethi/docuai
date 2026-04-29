/**
 * Thin proxy → docuai-api `/api/merge-csv`.
 *
 * All merge logic (column unification, CSV building, AI calls, async
 * jobs) now lives in the Express backend. This route just forwards the
 * request and streams the response back so the browser can keep using
 * a same-origin URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  const body = await req.text();

  const upstream = await fetch(apiUrl("/api/merge-csv"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(auth ? { authorization: auth } : {}),
    },
    body,
    cache: "no-store",
  });

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  headers.set("content-type", contentType);
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);
  for (const h of ["x-docs-merged", "x-docs-missing"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
