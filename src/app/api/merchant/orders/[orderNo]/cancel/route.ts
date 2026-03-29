import { NextRequest } from "next/server";
import { proxyMerchantOrderAction } from "@/lib/api/merchant-order-action-proxy";

type Params = {
  params: Promise<{ orderNo: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
  const { orderNo } = await params;
  return proxyMerchantOrderAction(req, orderNo, "cancel");
}
