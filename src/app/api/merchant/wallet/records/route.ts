import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.search || "";
  return proxyToBackend({
    req,
    method: "GET",
    path: `/api/v1/merchant/wallet/records${query}`
  });
}
