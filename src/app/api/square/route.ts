import type { SquarePost } from "@/data/square";
import { buildBackendUrl } from "@/lib/api/backend";
import { squareFail, squareOk } from "@/lib/api/square-envelope";
import { normalizePublicImageUrl } from "@/lib/image";

function normalizePosts(input: unknown): SquarePost[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const row = item as Record<string, unknown>;
      const id = String(row.id ?? "");
      if (!id) return null;

      const authorRaw = (row.author ?? {}) as Record<string, unknown>;
      return {
        id,
        author: {
          id: String(authorRaw.id ?? `u-${id}`),
          name: String(authorRaw.name ?? row.authorName ?? "ExpatTH User"),
          avatarUrl: typeof authorRaw.avatarUrl === "string" ? authorRaw.avatarUrl : undefined,
          verified: Boolean(authorRaw.verified ?? row.authorVerified ?? false),
          following: Boolean(authorRaw.following ?? authorRaw.isFollowing ?? row.following ?? false)
        },
        createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
        content: String(row.content ?? row.text ?? ""),
        tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
        imageUrl:
          typeof row.imageUrl === "string"
            ? normalizePublicImageUrl(row.imageUrl)
            : typeof row.image_url === "string"
              ? normalizePublicImageUrl(row.image_url)
              : undefined,
        likes: Number(row.likes ?? 0),
        comments: Number(row.comments ?? 0),
        shares: Number(row.shares ?? 0)
      } satisfies SquarePost;
    })
    .filter((item) => item !== null) as SquarePost[];
}

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
    const posts = normalizePosts(json.data);
    if (posts.length > 0) return posts;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "zh";
  const authorId = searchParams.get("authorId");
  const limit = Number(searchParams.get("limit") ?? 20);
  const safeLimit = Number.isFinite(limit) ? limit : 20;

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
