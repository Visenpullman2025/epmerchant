import type { ApiSuccess } from "@/lib/api/merchant-api";
import { buildBackendUrl } from "@/lib/api/backend";
import {
  normalizeMerchantReviewStatus,
  type MerchantReviewStatus
} from "@/lib/merchant/verification-status";
import { readCookieValue } from "@/lib/merchant/auth-session-tokens";

function buildReviewNotifyUrl(request: Request): string {
  const origin = new URL(request.url).origin;
  return `${origin}/api/merchant/review/notify`;
}

/** 登录成功后向后端登记 Webhook URL（失败忽略） */
export async function registerReviewNotifyUrl(token: string | null, request: Request): Promise<void> {
  if (!token) return;
  const notifyUrl = buildReviewNotifyUrl(request);
  try {
    await fetch(buildBackendUrl("/api/v1/merchant/review/notify-url"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        "x-request-id": request.headers.get("x-request-id") || "",
        Authorization: token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`,
        "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
      },
      body: JSON.stringify({ notifyUrl })
    });
  } catch {
    // ignore
  }
}

/** 拉取 `auth/me` 与 Cookie 兜底，得到商户审核态 */
export async function fetchMerchantStatusAfterLogin(
  token: string | null,
  request: Request
): Promise<MerchantReviewStatus> {
  const cookieStatus = readCookieValue(request, "merchant_status");
  const fallback =
    cookieStatus === "approved" ||
    cookieStatus === "rejected" ||
    cookieStatus === "pending" ||
    cookieStatus === "unsubmitted"
      ? cookieStatus
      : "unsubmitted";
  if (!token) return fallback;

  const upstream = await fetch(buildBackendUrl("/api/v1/merchant/auth/me"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
      "x-request-id": request.headers.get("x-request-id") || "",
      Authorization: token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`,
      "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
    },
    cache: "no-store"
  });

  if (upstream.status === 404) return fallback;
  if (!upstream.ok) {
    return fallback;
  }

  const payload = (await upstream.json()) as ApiSuccess<Record<string, unknown>>;
  return normalizeMerchantReviewStatus(payload.data, fallback);
}
