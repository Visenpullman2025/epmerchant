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
