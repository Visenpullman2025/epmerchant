import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

const merchantLocales = new Set(["zh", "en", "th"]);

type Params = {
  params: Promise<{ orderNo: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
  const { orderNo } = await params;
  const body = await req.json();
  const cookieLocale = req.cookies.get("merchant_locale")?.value;
  const extraHeaders: Record<string, string> = {};
  if (cookieLocale && merchantLocales.has(cookieLocale)) {
    extraHeaders["Accept-Language"] = cookieLocale;
  }
  return proxyToBackend({
    req,
    method: "POST",
    path: `/api/v1/merchant/orders/${orderNo}/transition`,
    body,
    extraHeaders: Object.keys(extraHeaders).length ? extraHeaders : undefined
  });
}
