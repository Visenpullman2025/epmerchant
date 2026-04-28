import type { LocaleCode } from "@/lib/api/merchant-api";

export const MERCHANT_AUTH_LOCALES: LocaleCode[] = ["zh", "en", "th"];

export function extractPreferredLocale(data: Record<string, unknown>, fallback: LocaleCode): LocaleCode {
  const locale = data.preferredLocale || data.preferred_locale;
  if (typeof locale === "string" && MERCHANT_AUTH_LOCALES.includes(locale as LocaleCode)) {
    return locale as LocaleCode;
  }
  return fallback;
}

export function extractMerchantAuthToken(data: Record<string, unknown>): string | null {
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

export function readSetCookies(headers: Headers): string[] {
  const withMethod = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withMethod.getSetCookie === "function") {
    return withMethod.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

export function readCookieValue(request: Request, key: string): string | null {
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
