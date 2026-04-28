import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api/merchant-api";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import { buildBackendUrl } from "@/lib/api/backend";
import { normalizeMerchantProfilePayload } from "@/lib/merchant/merchant-profile-normalizer";
import { proxyToBackend } from "@/lib/api/proxy";

export async function GET() {
  const token = (await cookies()).get("merchant_token")?.value;
  if (!token) {
    return apiError(401, 40101, "Unauthorized");
  }

  const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
  const profileUpstream = await fetch(buildBackendUrl("/api/v1/merchant/profile"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
    },
    cache: "no-store"
  });
  if (!profileUpstream.ok) {
    const profileError = (await profileUpstream.json()) as ApiError;
    return apiError(
      profileUpstream.status,
      profileError.code || 50001,
      profileError.message || "Load profile failed",
      profileError.errors
    );
  }

  const profilePayload = (await profileUpstream.json()) as ApiSuccess<Record<string, unknown>>;
  const data = profilePayload.data || {};
  const cookieStatus = (await cookies()).get("merchant_status")?.value;
  const payload = normalizeMerchantProfilePayload(data, cookieStatus);
  return apiSuccess(payload);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToBackend({
    req,
    method: "POST",
    path: "/api/v1/merchant/profile",
    body
  });
}
