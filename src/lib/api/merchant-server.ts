import { headers } from "next/headers";
import type { ApiError, ApiSuccess } from "@/lib/api/merchant-api";

function normalizeMerchantBffPath(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/api/merchant/")) {
    return cleanPath;
  }
  return `/api/merchant${cleanPath}`;
}

export async function getMerchantBffJson<T>(path: string): Promise<T | null> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") || "http";

  if (!host) {
    return null;
  }

  const response = await fetch(`${protocol}://${host}${normalizeMerchantBffPath(path)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: headerList.get("cookie") || "",
      "x-request-id": headerList.get("x-request-id") || ""
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;

  if (!response.ok || !payload || payload.code !== 0 || !("data" in payload)) {
    return null;
  }

  return payload.data;
}
