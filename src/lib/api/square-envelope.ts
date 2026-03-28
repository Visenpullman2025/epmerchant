import { NextResponse } from "next/server";

export function squareOk<T>(data: T, status = 200, message = "ok") {
  return NextResponse.json({ code: 0, message, data }, { status });
}

export function squareFail<T>(message: string, status = 500, code = status, data: T | null = null) {
  return NextResponse.json({ code, message, data }, { status });
}
