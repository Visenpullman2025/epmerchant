import type { SquareComment } from "@/data/square";
import { normalizeSquareComments } from "@/lib/square/normalize";

interface Envelope<T> {
  code: number;
  message: string;
  data: T;
}

export async function getPostComments(postId: string, locale: string): Promise<SquareComment[]> {
  const res = await fetch(
    `/api/square/posts/${encodeURIComponent(postId)}/comments?locale=${encodeURIComponent(locale)}`,
    { cache: "no-store" }
  );
  const json = (await res.json().catch(() => null)) as Envelope<unknown> | null;
  if (!res.ok || !json) return [];
  return normalizeSquareComments(json.data, postId);
}

export async function addPostComment(postId: string, content: string, locale: string) {
  const res = await fetch(
    `/api/square/posts/${encodeURIComponent(postId)}/comments?locale=${encodeURIComponent(locale)}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content })
    }
  );
  const json = (await res.json().catch(() => null)) as Envelope<unknown> | null;
  if (!res.ok || !json) throw new Error(json?.message ?? "comment_submit_failed");
  return normalizeSquareComments([json.data], postId)[0];
}

export async function toggleFollowAuthor(authorId: string, isFollowing: boolean) {
  const method = isFollowing ? "DELETE" : "POST";
  const res = await fetch(`/api/square/authors/${encodeURIComponent(authorId)}/follow`, {
    method,
    credentials: "include"
  });
  const json = (await res.json().catch(() => null)) as Envelope<unknown> | null;
  if (!res.ok || !json) throw new Error(json?.message ?? "follow_toggle_failed");
  return !isFollowing;
}

/** 后端 likes/favorites API 未实现时翻译成 "敬请期待" */
export class FeaturePendingError extends Error {
  constructor() {
    super("feature_pending");
    this.name = "FeaturePendingError";
  }
}

async function toggleEngagement(
  postId: string,
  endpoint: "likes" | "favorites",
  active: boolean
): Promise<boolean> {
  const method = active ? "DELETE" : "POST";
  const res = await fetch(
    `/api/square/posts/${encodeURIComponent(postId)}/${endpoint}`,
    { method, credentials: "include" }
  );
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    throw new FeaturePendingError();
  }
  const json = (await res.json().catch(() => null)) as Envelope<unknown> | null;
  if (!res.ok || !json) throw new Error(json?.message ?? `${endpoint}_toggle_failed`);
  return !active;
}

export const togglePostLike = (postId: string, isLiked: boolean) =>
  toggleEngagement(postId, "likes", isLiked);

export const togglePostFavorite = (postId: string, isFavorited: boolean) =>
  toggleEngagement(postId, "favorites", isFavorited);
