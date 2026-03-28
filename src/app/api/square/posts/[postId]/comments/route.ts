import { cookies } from "next/headers";
import { buildBackendUrl } from "@/lib/api/backend";
import { squareFail, squareOk } from "@/lib/api/square-envelope";

async function buildMerchantHeaders(): Promise<HeadersInit | null> {
  const token = (await cookies()).get("merchant_token")?.value;
  if (!token) return null;
  const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
  return {
    "Content-Type": "application/json",
    Authorization: authorization,
    "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "zh";
  const { postId } = await params;

  const url = new URL(buildBackendUrl(`/api/v1/square/posts/${encodeURIComponent(postId)}/comments`));
  url.searchParams.set("locale", locale);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return squareFail(
      String((json as { message?: string }).message ?? "comments_fetch_failed"),
      res.status,
      res.status,
      []
    );
  }

  return squareOk(
    (json as { data?: unknown }).data ?? json,
    res.status,
    String((json as { message?: string }).message ?? "ok")
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const headers = await buildMerchantHeaders();
  if (!headers) return squareFail("unauthorized", 401, 401, null);

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "zh";
  const { postId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return squareFail("invalid_body", 400, 400, null);

  const url = new URL(buildBackendUrl(`/api/v1/square/posts/${encodeURIComponent(postId)}/comments`));
  url.searchParams.set("locale", locale);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return squareFail(
      String((json as { message?: string }).message ?? "comment_submit_failed"),
      res.status,
      res.status,
      null
    );
  }

  return squareOk(
    (json as { data?: unknown }).data ?? json,
    res.status,
    String((json as { message?: string }).message ?? "ok")
  );
}
