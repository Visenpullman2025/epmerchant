import type { NextResponse } from "next/server";
import type { LocaleCode } from "@/lib/api/merchant-api";
import type { MerchantReviewStatus } from "@/lib/merchant/verification-status";
import { readSetCookies } from "@/lib/merchant/auth-session-tokens";

export function applyMerchantLoginSessionCookies(
  response: NextResponse,
  opts: {
    token: string | null;
    preferredLocale: LocaleCode;
    merchantStatus: MerchantReviewStatus;
  }
) {
  const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/" };
  if (opts.token) {
    response.cookies.set("merchant_token", opts.token, cookieOpts);
  }
  response.cookies.set("merchant_locale", opts.preferredLocale, cookieOpts);
  response.cookies.set("merchant_status", opts.merchantStatus, cookieOpts);
}

export function appendUpstreamSetCookieHeaders(response: NextResponse, upstreamHeaders: Headers) {
  for (const cookie of readSetCookies(upstreamHeaders)) {
    response.headers.append("set-cookie", cookie);
  }
}
