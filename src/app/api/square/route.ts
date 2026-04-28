import { buildBackendUrl } from "@/lib/api/backend";
import { clampListLimitParam, DEFAULT_LIST_LIMIT } from "@/lib/api/limits";
import { squareFail, squareOk } from "@/lib/api/square-envelope";
import { normalizeSquarePosts } from "@/lib/square/normalize";

async function fetchFromBackend(locale: string, limit: number, authorId?: string | null) {
  const candidates = authorId
    ? [
        `/api/v1/square/authors/${encodeURIComponent(authorId)}/posts`,
        "/api/v1/square",
        "/api/v1/feed",
        "/api/v1/posts"
      ]
    : ["/api/v1/square", "/api/v1/feed", "/api/v1/posts"];

  for (const path of candidates) {
    const url = new URL(buildBackendUrl(path));
    url.searchParams.set("locale", locale);
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) continue;
    const json = (await res.json()) as { data?: unknown };
    const posts = normalizeSquarePosts(json.data);
    if (posts.length > 0) return posts;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "zh";
  const authorId = searchParams.get("authorId");
  const safeLimit = clampListLimitParam(searchParams.get("limit"), DEFAULT_LIST_LIMIT);

  const backendPosts = await fetchFromBackend(locale, safeLimit, authorId);
  if (backendPosts && backendPosts.length > 0) {
    const filtered = authorId
      ? backendPosts.filter((post) => post.author.id === authorId)
      : backendPosts;
    return squareOk(filtered);
  }
  if (backendPosts) return squareOk([]);
  return squareFail("square_fetch_failed", 502, 502, []);
}
