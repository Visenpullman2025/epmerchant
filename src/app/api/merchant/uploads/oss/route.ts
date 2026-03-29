import { NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api/merchant-api";
import { buildBackendUrl, requestIdFrom } from "@/lib/api/backend";
import { apiError, apiSuccess } from "@/lib/api/contract-response";

type OssPolicyData = {
  host: string;
  dir: string;
  policy: string;
  signature: string;
  accessId: string;
  expire: number | string;
  securityToken?: string;
  publicBaseUrl?: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildObjectKey(dir: string, fileName: string) {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}${stamp}-${sanitizeFileName(fileName)}`;
}

export async function POST(req: NextRequest) {
  const requestId = requestIdFrom(req);
  const token =
    req.cookies.get("merchant_token")?.value || req.headers.get("x-merchant-token") || "";
  if (!token) {
    return apiError(401, 40101, "Unauthorized", undefined, requestId);
  }

  const formData = await req.formData();
  const scene = String(formData.get("scene") || "");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError(400, 40001, "Missing upload file", undefined, requestId);
  }

  const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
  const query = scene ? `?scene=${encodeURIComponent(scene)}` : "";
  const policyUpstream = await fetch(buildBackendUrl(`/api/v1/merchant/uploads/oss-policy${query}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
    },
    cache: "no-store"
  });

  if (!policyUpstream.ok) {
    const policyError = (await policyUpstream.json()) as ApiError;
    return apiError(
      policyUpstream.status,
      policyError.code || 50001,
      policyError.message || "Load OSS policy failed",
      policyError.errors,
      requestId
    );
  }

  const policyPayload = (await policyUpstream.json()) as ApiSuccess<OssPolicyData>;
  const policy = policyPayload.data;
  const key = buildObjectKey(policy.dir, file.name);
  const uploadFormData = new FormData();
  uploadFormData.append("key", key);
  uploadFormData.append("policy", policy.policy);
  uploadFormData.append("OSSAccessKeyId", policy.accessId);
  uploadFormData.append("Signature", policy.signature);
  uploadFormData.append("success_action_status", "200");
  if (policy.securityToken) {
    uploadFormData.append("x-oss-security-token", policy.securityToken);
  }
  uploadFormData.append("file", file, file.name);

  const uploadResponse = await fetch(policy.host, {
    method: "POST",
    body: uploadFormData
  });
  if (!uploadResponse.ok) {
    return apiError(502, 50001, "OSS upload failed", undefined, requestId);
  }

  const baseUrl = (policy.publicBaseUrl || policy.host).replace(/\/$/, "");
  return apiSuccess({ url: `${baseUrl}/${key}` }, requestId);
}
