import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@shared/api/contracts/merchant-api";
import type { MerchantProfileResponse } from "@shared/api/contracts/merchant-api";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import { buildBackendUrl } from "@/lib/api/backend";
import { normalizeMerchantReviewStatus } from "@/lib/merchant/verification-status";
import { proxyToBackend } from "@/lib/api/proxy";

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function normalizeBoundCategories(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const code =
        (typeof record.code === "string" && record.code) ||
        (typeof record.categoryCode === "string" && record.categoryCode) ||
        (typeof record.category_code === "string" && record.category_code) ||
        "";
      if (!code) return null;
      return {
        code,
        name:
          (typeof record.name === "string" && record.name) ||
          (typeof record.categoryName === "string" && record.categoryName) ||
          (typeof record.category_name === "string" && record.category_name) ||
          code
      };
    })
    .filter(Boolean) as { code: string; name: string }[];
}

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
  const verificationRaw =
    typeof data.verification === "object" && data.verification
      ? (data.verification as Record<string, unknown>)
      : null;
  const cookieStatus = (await cookies()).get("merchant_status")?.value;
  const normalizedStatus = normalizeMerchantReviewStatus(
    data,
    cookieStatus === "approved" || cookieStatus === "rejected" ? cookieStatus : "pending"
  );
  const status: "unsubmitted" | "pending" | "approved" | "rejected" =
    normalizedStatus === "unsubmitted"
      ? "unsubmitted"
      : normalizedStatus === "approved"
        ? "approved"
        : normalizedStatus === "rejected"
          ? "rejected"
          : "pending";
  const payload: MerchantProfileResponse = {
    // 兼容后端当前可能返回的不同命名，统一收口给前端页面使用。
    serviceTypes: (() => {
      const direct = normalizeStringArray(data.serviceTypes);
      if (direct.length) return direct;
      const snake = normalizeStringArray(data.service_types);
      if (snake.length) return snake;
      return normalizeStringArray(data.boundServiceTypes);
    })(),
    boundServiceCategories: (() => {
      const direct = normalizeBoundCategories(data.boundServiceCategories);
      if (direct.length) return direct;
      return normalizeBoundCategories(data.bound_service_categories);
    })(),
    id:
      (typeof data.id === "string" && data.id) ||
      (typeof data.userId === "string" && data.userId) ||
      (typeof data.user_id === "string" && data.user_id) ||
      "unknown",
    merchantName:
      (typeof data.merchantName === "string" && data.merchantName) ||
      (typeof data.merchant_name === "string" && data.merchant_name) ||
      (typeof data.name === "string" && data.name) ||
      "",
    contactPhone:
      (typeof data.contactPhone === "string" && data.contactPhone) ||
      (typeof data.contact_phone === "string" && data.contact_phone) ||
      (typeof data.phone === "string" && data.phone) ||
      "",
    status,
    merchantStatus: status,
    serviceIntro:
      (typeof data.serviceIntro === "string" && data.serviceIntro) ||
      (typeof data.service_intro === "string" && data.service_intro) ||
      "",
    online: typeof data.online === "boolean" ? data.online : true,
    verification: verificationRaw
      ? {
          applicationNo:
            (typeof verificationRaw.applicationNo === "string" &&
              verificationRaw.applicationNo) ||
            (typeof verificationRaw.application_no === "string" &&
              verificationRaw.application_no) ||
            undefined,
          ownerName:
            (typeof verificationRaw.ownerName === "string" && verificationRaw.ownerName) ||
            (typeof verificationRaw.owner_name === "string" && verificationRaw.owner_name) ||
            undefined,
          idNumber:
            (typeof verificationRaw.idNumber === "string" && verificationRaw.idNumber) ||
            (typeof verificationRaw.id_number === "string" && verificationRaw.id_number) ||
            undefined,
          businessLicenseUrl:
            (typeof verificationRaw.businessLicenseUrl === "string" &&
              verificationRaw.businessLicenseUrl) ||
            (typeof verificationRaw.business_license_url === "string" &&
              verificationRaw.business_license_url) ||
            undefined,
          documentFrontUrl:
            (typeof verificationRaw.documentFrontUrl === "string" &&
              verificationRaw.documentFrontUrl) ||
            (typeof verificationRaw.document_front_url === "string" &&
              verificationRaw.document_front_url) ||
            undefined,
          documentBackUrl:
            (typeof verificationRaw.documentBackUrl === "string" &&
              verificationRaw.documentBackUrl) ||
            (typeof verificationRaw.document_back_url === "string" &&
              verificationRaw.document_back_url) ||
            undefined,
          selfieUrl:
            (typeof verificationRaw.selfieUrl === "string" && verificationRaw.selfieUrl) ||
            (typeof verificationRaw.selfie_url === "string" && verificationRaw.selfie_url) ||
            undefined,
          status:
            verificationRaw.status === "approved" ||
            verificationRaw.status === "rejected" ||
            verificationRaw.status === "pending"
              ? verificationRaw.status
              : undefined,
          reviewNote:
            (typeof verificationRaw.reviewNote === "string" && verificationRaw.reviewNote) ||
            (typeof verificationRaw.review_note === "string" && verificationRaw.review_note) ||
            "",
          reviewedAt:
            (typeof verificationRaw.reviewedAt === "string" && verificationRaw.reviewedAt) ||
            (typeof verificationRaw.reviewed_at === "string" && verificationRaw.reviewed_at) ||
            undefined
        }
      : null
  };
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
