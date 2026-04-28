import { NextRequest } from "next/server";
import { proxyMerchantCatchAll } from "@/lib/api/merchant-path-proxy";

type RouteCtx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyMerchantCatchAll(req, "GET", path ?? []);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyMerchantCatchAll(req, "POST", path ?? []);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyMerchantCatchAll(req, "PUT", path ?? []);
}
