import { NextRequest } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

export function getBackendBaseUrl() {
  return process.env.BACKEND_API_BASE_URL || DEFAULT_BACKEND_BASE_URL;
}

export function buildBackendUrl(path: string) {
  const base = getBackendBaseUrl().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function requestIdFrom(req: NextRequest | Request) {
  return req.headers.get("x-request-id") || null;
}
