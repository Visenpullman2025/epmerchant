import { NextRequest } from "next/server";
import type {
  ApiError,
  LocaleCode,
  SaveLocaleRequest,
  SaveLocaleResponse
} from "@/lib/api/merchant-api";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import { buildBackendUrl } from "@/lib/api/backend";

const locales: LocaleCode[] = ["zh", "en", "th"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SaveLocaleRequest>;
    if (!body.locale || !locales.includes(body.locale as LocaleCode)) {
      return apiError(400, 40001, "Invalid locale", [
        { field: "locale", message: "locale must be zh/en/th" }
      ]);
    }

    const payload: SaveLocaleResponse = {
      success: true,
      preferredLocale: body.locale as LocaleCode
    };

    const token = request.cookies.get("merchant_token")?.value || "";
    const authorization = token
      ? token.toLowerCase().startsWith("bearer ")
        ? token
        : `Bearer ${token}`
      : "";

    const upstream = await fetch(buildBackendUrl("/api/v1/merchant/preferences/locale"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
        "x-request-id": request.headers.get("x-request-id") || "",
        ...(authorization ? { Authorization: authorization } : {}),
        ...(token ? { "X-Merchant-Token": token.replace(/^Bearer\s+/i, "") } : {})
      },
      body: JSON.stringify({ locale: body.locale })
    });

    if (!upstream.ok) {
      const upstreamError = (await upstream.json()) as ApiError;
      return apiError(
        upstream.status,
        upstreamError.code || 50001,
        upstreamError.message || "Failed to save locale",
        upstreamError.errors
      );
    }

    const response = apiSuccess(payload);
    response.cookies.set("merchant_locale", body.locale as LocaleCode, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    return response;
  } catch {
    return apiError(400, 40001, "Invalid request body");
  }
}
