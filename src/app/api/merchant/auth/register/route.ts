import type {
  ApiError,
  ApiSuccess,
  LocaleCode,
  RegisterRequest,
  RegisterResponse
} from "@shared/api/contracts/merchant-api";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import { buildBackendUrl } from "@/lib/api/backend";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RegisterRequest>;

    if (!body.merchantName || !body.email || !body.password) {
      return apiError(400, 40001, "Merchant name, email and password are required", [
        { field: "merchantName", message: "merchantName required" },
        { field: "email", message: "email required" },
        { field: "password", message: "password required" }
      ]);
    }

    const requestPayload: RegisterRequest = {
      merchantName: body.merchantName,
      email: body.email,
      password: body.password,
      ...(body.contactPhone ? { contactPhone: body.contactPhone } : {}),
      ...(body.locale ? { locale: body.locale } : {})
    };

    const upstream = await fetch(buildBackendUrl("/api/v1/merchant/auth/register"), {
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
        upstreamError.message || "Register failed",
        upstreamError.errors
      );
    }

    const upstreamPayload = (await upstream.json()) as ApiSuccess<Record<string, unknown>>;
    const requestedLocale = locales.includes((requestPayload.locale || "") as LocaleCode)
      ? (requestPayload.locale as LocaleCode)
      : "en";
    const preferredLocale = extractPreferredLocale(upstreamPayload.data || {}, requestedLocale);
    const token = extractToken(upstreamPayload.data || {});

    const payload: RegisterResponse = { success: true, preferredLocale };
    const response = apiSuccess(payload);
    response.cookies.set("merchant_registered", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    response.cookies.set("merchant_status", "unsubmitted", {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
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
    for (const cookie of readSetCookies(upstream.headers)) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch {
    return apiError(400, 40001, "Invalid request body");
  }
}
