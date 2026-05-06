import type { MerchantProfileResponse } from "@/lib/api/merchant-api";
import { normalizeMerchantReviewStatus } from "@/lib/merchant/verification-status";

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

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function normalizeLocation(value: unknown): MerchantProfileResponse["location"] {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const lat = toNumberOrNull(record.lat);
  const lng = toNumberOrNull(record.lng);
  return {
    baseAddress:
      (typeof record.baseAddress === "string" && record.baseAddress) ||
      (typeof record.base_address === "string" && record.base_address) ||
      "",
    placeId:
      (typeof record.placeId === "string" && record.placeId) ||
      (typeof record.place_id === "string" && record.place_id) ||
      "",
    lat,
    lng,
    serviceRadiusMeters:
      toNumberOrNull(record.serviceRadiusMeters) ?? toNumberOrNull(record.service_radius_meters),
    areas: normalizeStringArray(record.areas),
    locationVerified:
      typeof record.locationVerified === "boolean"
        ? record.locationVerified
        : typeof record.location_verified === "boolean"
          ? record.location_verified
          : lat != null && lng != null,
    updatedAt:
      (typeof record.updatedAt === "string" && record.updatedAt) ||
      (typeof record.updated_at === "string" && record.updated_at) ||
      null
  };
}

/** 将上游 profile 原始 data 转为商户端统一 `MerchantProfileResponse` */
export function normalizeMerchantProfilePayload(
  data: Record<string, unknown>,
  cookieStatus: string | undefined
): MerchantProfileResponse {
  const verificationRaw =
    typeof data.verification === "object" && data.verification
      ? (data.verification as Record<string, unknown>)
      : null;
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

  return {
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
    location: normalizeLocation(data.location),
    verification: verificationRaw
      ? {
          applicationNo:
            (typeof verificationRaw.applicationNo === "string" && verificationRaw.applicationNo) ||
            (typeof verificationRaw.application_no === "string" && verificationRaw.application_no) ||
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
}
