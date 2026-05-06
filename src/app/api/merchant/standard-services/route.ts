import { NextRequest } from "next/server";
import { buildBackendUrl, requestIdFrom } from "@/lib/api/backend";
import { apiError, apiSuccess } from "@/lib/api/contract-response";
import type { MerchantStandardServiceItem } from "@/lib/api/merchant-api";

type BackendSuccess = {
  code?: number;
  message?: string;
  data?: unknown;
};

const supportedLocales = new Set(["zh", "en", "th"]);

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request);
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "zh";
  const safeLocale = supportedLocales.has(locale) ? locale : "zh";

  const url = new URL(buildBackendUrl("/api/v1/standard-services"));
  url.searchParams.set("locale", safeLocale);

  const categoryCode = searchParams.get("categoryCode");
  if (categoryCode) url.searchParams.set("categoryCode", categoryCode);

  try {
    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": request.headers.get("x-request-id") || ""
      },
      cache: "no-store"
    });
    const payload = (await upstream.json()) as BackendSuccess;

    if (!upstream.ok || payload.code !== 0 || !Array.isArray(payload.data)) {
      return apiError(
        upstream.status,
        payload.code || 50201,
        payload.message || "standard services unavailable",
        undefined,
        requestId
      );
    }

    return apiSuccess(normalizeStandardServices(payload.data), requestId);
  } catch {
    return apiError(502, 50201, "standard services unavailable", undefined, requestId);
  }
}

function normalizeStandardServices(data: unknown[]): MerchantStandardServiceItem[] {
  return data
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      standardServiceCode: String(item.standardServiceCode || ""),
      name: String(item.name || item.standardServiceCode || ""),
      description: typeof item.description === "string" ? item.description : undefined,
      categoryCode: typeof item.categoryCode === "string" ? item.categoryCode : undefined,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : undefined
    }))
    .filter((item) => item.standardServiceCode !== "" && item.name !== "");
}
