import { buildBackendUrl } from "@/lib/api/backend";
import { squareFail, squareOk } from "@/lib/api/square-envelope";
import { squareMerchantHeaders } from "@/lib/square/merchant-headers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ authorId: string }> }
) {
  const headers = await squareMerchantHeaders();
  if (!headers) return squareFail("unauthorized", 401, 401, null);
  const { authorId } = await params;
  const res = await fetch(
    buildBackendUrl(`/api/v1/square/authors/${encodeURIComponent(authorId)}/follow`),
    {
      method: "POST",
      headers,
      cache: "no-store"
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return squareFail(
      String((json as { message?: string }).message ?? "follow_failed"),
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ authorId: string }> }
) {
  const headers = await squareMerchantHeaders();
  if (!headers) return squareFail("unauthorized", 401, 401, null);
  const { authorId } = await params;
  const res = await fetch(
    buildBackendUrl(`/api/v1/square/authors/${encodeURIComponent(authorId)}/follow`),
    {
      method: "DELETE",
      headers,
      cache: "no-store"
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return squareFail(
      String((json as { message?: string }).message ?? "unfollow_failed"),
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
