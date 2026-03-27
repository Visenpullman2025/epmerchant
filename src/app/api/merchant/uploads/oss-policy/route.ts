import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  const scene = req.nextUrl.searchParams.get("scene") || "";
  const query = scene ? `?scene=${encodeURIComponent(scene)}` : "";
  return proxyToBackend({
    req,
    method: "GET",
    path: `/api/v1/merchant/uploads/oss-policy${query}`
  });
}
