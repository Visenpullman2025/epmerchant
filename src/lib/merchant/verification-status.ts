export type MerchantReviewStatus =
  | "unsubmitted"
  | "pending"
  | "approved"
  | "rejected";

function mapStatusString(raw: string): MerchantReviewStatus | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (["approved", "verified", "passed", "pass", "success"].includes(value)) {
    return "approved";
  }
  if (["rejected", "reject", "failed", "fail", "denied"].includes(value)) {
    return "rejected";
  }
  if (["pending", "reviewing", "processing", "in_review"].includes(value)) {
    return "pending";
  }
  if (["unsubmitted", "not_submitted", "none", "draft"].includes(value)) {
    return "unsubmitted";
  }
  return null;
}

export function normalizeMerchantReviewStatus(
  data: unknown,
  fallback: MerchantReviewStatus = "pending"
): MerchantReviewStatus {
  if (!data || typeof data !== "object") {
    return fallback;
  }
  const record = data as Record<string, unknown>;
  const candidates = [
    record.merchantStatus,
    record.merchant_status,
    record.applicationStatus,
    record.application_status,
    record.status,
    record.reviewStatus,
    record.review_status,
    record.state
  ];
  for (const item of candidates) {
    if (typeof item === "string") {
      const mapped = mapStatusString(item);
      if (mapped) return mapped;
    }
  }

  const boolCandidates = [
    record.isMerchantVerified,
    record.is_merchant_verified,
    record.merchantVerified,
    record.merchant_verified
  ];
  if (boolCandidates.some((item) => item === true)) {
    return "approved";
  }
  return fallback;
}
