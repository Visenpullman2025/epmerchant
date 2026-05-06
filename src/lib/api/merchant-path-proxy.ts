import { NextRequest, NextResponse } from "next/server";
import { sanitizeListQueryString } from "@/lib/api/limits";
import { proxyToBackend } from "@/lib/api/proxy";

/** BFF `/api/merchant/...` → Laravel `/api/v1/merchant/...`（`services/:id/create-data` 走公共 `/api/v1/services/...`） */
export function buildMerchantUpstreamPath(segments: string[]): string {
  if (segments.length === 1 && segments[0] === "standard-services") {
    return "/api/v1/standard-services";
  }
  if (
    segments[0] === "services" &&
    segments.length === 3 &&
    segments[2] === "create-data"
  ) {
    return `/api/v1/services/${encodeURIComponent(segments[1])}/create-data`;
  }
  return `/api/v1/merchant/${segments.map((s) => encodeURIComponent(s)).join("/")}`;
}

export async function proxyMerchantCatchAll(
  req: NextRequest,
  method: "GET" | "POST" | "PUT",
  segments: string[]
) {
  if (!segments.length) {
    return NextResponse.json({ code: 404, message: "Not found" }, { status: 404 });
  }

  const query = method === "GET" ? sanitizeListQueryString(req.nextUrl.search) : req.nextUrl.search;
  const path = `${buildMerchantUpstreamPath(segments)}${query}`;

  if (method === "PUT" && segments.join("/") === "availability") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ code: 40001, message: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    return proxyToBackend({ req, method: "PUT", path, body });
  }

  if (method === "POST" || method === "PUT") {
    const body = await req.json().catch(() => undefined);
    return proxyToBackend({
      req,
      method,
      path,
      ...(body !== undefined ? { body } : {})
    });
  }

  return proxyToBackend({ req, method: "GET", path });
}
