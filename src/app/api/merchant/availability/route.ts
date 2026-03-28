import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend({
    req,
    method: "GET",
    path: "/api/v1/merchant/availability"
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ code: 40001, message: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  return proxyToBackend({
    req,
    method: "PUT",
    path: "/api/v1/merchant/availability",
    body
  });
}
