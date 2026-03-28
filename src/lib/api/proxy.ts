import { NextRequest, NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/api/backend";

type ProxyOptions = {
  req: NextRequest;
  path: string;
  method: "GET" | "POST" | "PUT";
  body?: unknown;
  /** 追加到上游请求（如 Accept-Language） */
  extraHeaders?: Record<string, string>;
};

export async function proxyToBackend({
  req,
  path,
  method,
  body,
  extraHeaders
}: ProxyOptions) {
  const cookieToken = req.cookies.get("merchant_token")?.value || "";
  const headerToken = req.headers.get("x-merchant-token") || "";
  const token = cookieToken || headerToken;
  const authorization = token
    ? token.toLowerCase().startsWith("bearer ")
      ? token
      : `Bearer ${token}`
    : "";

  const upstream = await fetch(buildBackendUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
      "x-request-id": req.headers.get("x-request-id") || "",
      ...(authorization ? { Authorization: authorization } : {}),
      ...(token ? { "X-Merchant-Token": token.replace(/^Bearer\s+/i, "") } : {}),
      ...(extraHeaders || {})
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/json"
    }
  });
}
