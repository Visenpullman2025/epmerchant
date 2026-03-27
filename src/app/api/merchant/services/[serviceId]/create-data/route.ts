import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type Props = {
  params: Promise<{ serviceId: string }>;
};

export async function GET(req: NextRequest, { params }: Props) {
  const { serviceId } = await params;
  return proxyToBackend({
    req,
    method: "GET",
    path: `/api/v1/services/${serviceId}/create-data`
  });
}
