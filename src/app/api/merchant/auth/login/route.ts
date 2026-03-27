import type {
  ApiError,
  ApiSuccess,
  LocaleCode,
  LoginRequest,
  LoginResponse
} from "@shared/api/contracts/merchant-api";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import { buildBackendUrl } from "@/lib/api/backend";
import {
  normalizeMerchantReviewStatus,
  type MerchantReviewStatus
} from "@/lib/merchant/verification-status";

const locales: LocaleCode[] = ["zh", "en", "th"];

function extractPreferredLocale(data: Record<string, unknown>, fallback: LocaleCode): LocaleCode {
  const locale = data.preferredLocale || data.preferred_locale;
  if (typeof locale === "string" && locales.includes(locale as LocaleCode)) {
    return locale as LocaleCode;
  }
  return fallback;
}

function extractToken(data: Record<string, unknown>): string | null {
  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.bearerToken,
    data.bearer_token
  ];
  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }
  return null;
}

function readSetCookies(headers: Headers): string[] {
  const withMethod = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withMethod.getSetCookie === "function") {
    return withMethod.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function readCookieValue(request: Request, key: string): string | null {
  const raw = request.headers.get("cookie") || "";
  const target = `${key}=`;
  for (const part of raw.split(";")) {
    const item = part.trim();
    if (item.startsWith(target)) {
      return decodeURIComponent(item.slice(target.length));
    }
  }
  return null;
}

function buildNotifyUrl(request: Request): string {
  const origin = new URL(request.url).origin;
  return `${origin}/api/merchant/review/notify`;
}

async function registerReviewNotifyUrl(token: string | null, request: Request): Promise<void> {
  if (!token) return;
  const notifyUrl = buildNotifyUrl(request);
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

async function fetchMerchantStatus(
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LoginRequest>;

    if (!body.email || !body.password) {
      return apiError(400, 40001, "Email and password are required", [
        { field: "email", message: "email required" },
        { field: "password", message: "password required" }
      ]);
    }

    const requestPayload: LoginRequest = {
      email: body.email,
      password: body.password,
      ...(body.locale ? { locale: body.locale } : {})
    };

    const upstream = await fetch(buildBackendUrl("/api/v1/merchant/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        "x-request-id": request.headers.get("x-request-id") || ""
      },
      body: JSON.stringify(requestPayload)
    });

    if (!upstream.ok) {
      const upstreamError = (await upstream.json()) as ApiError;
      return apiError(
        upstream.status,
        upstreamError.code || 50001,
        upstreamError.message || "Login failed",
        upstreamError.errors
      );
    }

    const upstreamPayload = (await upstream.json()) as ApiSuccess<Record<string, unknown>>;
    const requestedLocale = locales.includes((requestPayload.locale || "") as LocaleCode)
      ? (requestPayload.locale as LocaleCode)
      : "en";
    const preferredLocale = extractPreferredLocale(upstreamPayload.data || {}, requestedLocale);
    const token = extractToken(upstreamPayload.data || {});
    await registerReviewNotifyUrl(token, request);
    const merchantStatus = await fetchMerchantStatus(token, request);

    const payload: LoginResponse = { success: true, preferredLocale, merchantStatus };
    const response = apiSuccess(payload);
    if (token) {
      response.cookies.set("merchant_token", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/"
      });
    }
    response.cookies.set("merchant_locale", preferredLocale, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    response.cookies.set("merchant_status", merchantStatus, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    for (const cookie of readSetCookies(upstream.headers)) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch {
    return apiError(400, 40001, "Invalid request body");
  }
}
