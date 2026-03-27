import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type Params = {
  params: Promise<{ orderNo: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
  const { orderNo } = await params;
  const body = await req.json();
  return proxyToBackend({
    req,
    method: "POST",
    path: `/api/v1/merchant/orders/${orderNo}/transition`,
    body
  });
}
