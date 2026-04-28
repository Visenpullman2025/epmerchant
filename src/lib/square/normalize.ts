import type { SquareComment, SquarePost } from "@/data/square";
import { normalizePublicImageUrl } from "@/lib/image";

export function normalizeSquareComments(input: unknown, postId: string): SquareComment[] {
  if (!Array.isArray(input)) return [];
  return input.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? row.commentId ?? `${postId}-${index}`),
      postId,
      authorName: String(row.authorName ?? row.userName ?? row.author ?? "User"),
      content: String(row.content ?? row.text ?? ""),
      createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString())
    };
  });
}

export function normalizeSquarePosts(input: unknown): SquarePost[] {
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
