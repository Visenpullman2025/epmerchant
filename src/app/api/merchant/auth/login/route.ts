import type {
  ApiError,
  ApiSuccess,
  LocaleCode,
  LoginRequest,
  LoginResponse
} from "@/lib/api/merchant-api";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import { buildBackendUrl } from "@/lib/api/backend";
import {
  MERCHANT_AUTH_LOCALES,
  extractMerchantAuthToken,
  extractPreferredLocale
} from "@/lib/merchant/auth-session-tokens";
import {
  appendUpstreamSetCookieHeaders,
  applyMerchantLoginSessionCookies
} from "@/lib/merchant/auth-login-cookies";
import {
  fetchMerchantStatusAfterLogin,
  registerReviewNotifyUrl
} from "@/lib/merchant/auth-login-status-sync";

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
    const requestedLocale: LocaleCode = MERCHANT_AUTH_LOCALES.includes(
      (requestPayload.locale || "") as LocaleCode
    )
      ? (requestPayload.locale as LocaleCode)
      : "en";
    const preferredLocale = extractPreferredLocale(upstreamPayload.data || {}, requestedLocale);
    const token = extractMerchantAuthToken(upstreamPayload.data || {});

    await registerReviewNotifyUrl(token, request);
    const merchantStatus = await fetchMerchantStatusAfterLogin(token, request);

    const payload: LoginResponse = { success: true, preferredLocale, merchantStatus };
    const response = apiSuccess(payload);
    applyMerchantLoginSessionCookies(response, { token, preferredLocale, merchantStatus });
    appendUpstreamSetCookieHeaders(response, upstream.headers);
    return response;
  } catch {
    return apiError(400, 40001, "Invalid request body");
  }
}
