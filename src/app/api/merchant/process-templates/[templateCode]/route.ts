import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type Props = {
  params: Promise<{ templateCode: string }>;
};

export async function GET(req: NextRequest, { params }: Props) {
  const { templateCode } = await params;
  return proxyToBackend({
    req,
    method: "GET",
    path: `/api/v1/merchant/process-templates/${templateCode}`
  });
}
