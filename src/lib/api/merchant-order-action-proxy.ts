import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

const merchantLocales = new Set(["zh", "en", "th"]);

export type MerchantOrderBackendAction = "confirm" | "start-service" | "finish-service" | "cancel";

function merchantOrderExtraHeaders(req: NextRequest): Record<string, string> | undefined {
  const cookieLocale = req.cookies.get("merchant_locale")?.value;
  if (cookieLocale && merchantLocales.has(cookieLocale)) {
    return { "Accept-Language": cookieLocale };
  }
  return undefined;
}

/** 代理商户订单语义动作至 Laravel：`/api/v1/merchant/orders/{orderNo}/{action}` */
export async function proxyMerchantOrderAction(req: NextRequest, orderNo: string, action: MerchantOrderBackendAction) {
  const body = await req.json();
  const extraHeaders = merchantOrderExtraHeaders(req);
  return proxyToBackend({
    req,
    method: "POST",
    path: `/api/v1/merchant/orders/${orderNo}/${action}`,
    body,
    extraHeaders: extraHeaders && Object.keys(extraHeaders).length ? extraHeaders : undefined
  });
}
