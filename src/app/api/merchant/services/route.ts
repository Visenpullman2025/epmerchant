import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend({
    req,
    method: "GET",
    path: "/api/v1/merchant/services"
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToBackend({
    req,
    method: "POST",
    path: "/api/v1/merchant/services",
    body
  });
}
