import { cookies } from "next/headers";

/** 广场 BFF 调上游时需带商户 JWT（与 profile 等路由一致） */
export async function squareMerchantHeaders(): Promise<HeadersInit | null> {
  const token = (await cookies()).get("merchant_token")?.value;
  if (!token) return null;
  const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
  return {
    "Content-Type": "application/json",
    Authorization: authorization,
    "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
  };
}
