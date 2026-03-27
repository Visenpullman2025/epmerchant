import { NextResponse } from "next/server";
import type { ApiError, ApiErrorItem, ApiSuccess } from "@shared/api/contracts/merchant-api";

function nowIso() {
  return new Date().toISOString();
}

export function apiSuccess<T>(data: T, requestId: string | null = null) {
  const payload: ApiSuccess<T> = {
    code: 0,
    message: "ok",
    data,
    requestId,
    timestamp: nowIso()
  };
  return NextResponse.json(payload);
}

export function apiError(
  status: number,
  code: number,
  message: string,
  errors?: ApiErrorItem[],
  requestId: string | null = null
) {
  const payload: ApiError = {
    code,
    message,
    errors,
    requestId,
    timestamp: nowIso()
  };
  return NextResponse.json(payload, { status });
}
