"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { SquareComment, SquarePost } from "@/data/square";
import { isRemoteImageUrl } from "@/lib/image";
import { addPostComment, getPostComments, toggleFollowAuthor } from "@/lib/square/client";

function formatTimeLabel(isoString: string) {
  const time = new Date(isoString).getTime();
  if (Number.isNaN(time)) return "";
  const deltaMinutes = Math.max(1, Math.floor((Date.now() - time) / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes}m`;
  if (deltaMinutes < 1440) return `${Math.floor(deltaMinutes / 60)}h`;
  return `${Math.floor(deltaMinutes / 1440)}d`;
}

export default function MerchantSquarePage() {
  const t = useTranslations("SquarePage");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [posts, setPosts] = useState<SquarePost[]>([]);
  const [mode, setMode] = useState<"recommended" | "following">("recommended");
  const [visibleCount, setVisibleCount] = useState(8);
  const [commentsMap, setCommentsMap] = useState<Record<string, SquareComment[]>>({});
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [commentDraftMap, setCommentDraftMap] = useState<Record<string, string>>({});
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadSquare() {
      const res = await fetch(`/api/square?locale=${locale}&limit=30`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: SquarePost[] };
      if (!mounted) return;
      const rows = Array.isArray(json.data) ? json.data : [];
      setPosts(rows);
      setFollowingIds(rows.filter((row) => row.author.following).map((row) => row.author.id));
      const map: Record<string, SquareComment[]> = {};
      const commentsEntries = await Promise.all(
        rows.map(async (row) => [row.id, await getPostComments(row.id, locale)] as const)
      );
      commentsEntries.forEach(([postId, comments]) => {
        map[postId] = comments;
      });
      setCommentsMap(map);
    }

    loadSquare();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const displayPosts = useMemo(() => {
    if (mode === "recommended") return posts.slice(0, visibleCount);
    const filtered = posts.filter((post) => followingIds.includes(post.author.id));
    return filtered.slice(0, visibleCount);
  }, [posts, mode, followingIds, visibleCount]);

  const hasMore = useMemo(() => {
    if (mode === "recommended") return posts.length > visibleCount;
    return posts.filter((post) => followingIds.includes(post.author.id)).length > visibleCount;
  }, [posts, mode, followingIds, visibleCount]);

  async function submitComment(postId: string) {
    const draft = commentDraftMap[postId] ?? "";
    if (!draft.trim()) return;
    const next = await addPostComment(postId, draft.trim(), locale).catch(() => null);
    if (!next) return;
    setCommentsMap((prev) => ({ ...prev, [postId]: [next, ...(prev[postId] ?? [])] }));
    setCommentDraftMap((prev) => ({ ...prev, [postId]: "" }));
  }

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      surface={false}
    >
      <div className="merchant-square-page space-y-3" id="square-feed">
        <header className="merchant-square-header">
          <h1>{t("title")}</h1>
        </header>

        <div className="flex gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--border) 25%, transparent)" }}>
          <button
            type="button"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm"
            style={
              mode === "recommended"
                ? { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }
                : { color: "var(--muted)" }
            }
            onClick={() => {
              setMode("recommended");
              setVisibleCount(8);
            }}
          >
            {t("tabRecommended")}
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm"
            style={
              mode === "following"
                ? { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }
                : { color: "var(--muted)" }
            }
            onClick={() => {
              setMode("following");
              setVisibleCount(8);
            }}
          >
            {t("tabFollowing")}
          </button>
        </div>

        {mode === "following" && displayPosts.length === 0 ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("emptyFollowing")}
          </div>
        ) : null}

        <div className="space-y-3">
          {displayPosts.map((post) => (
            <article className="rounded-xl border p-3" key={post.id} style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
                >
                  {post.author.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      className="truncate text-sm font-semibold hover:opacity-80"
                      href={`/${locale}/merchant/square/author/${post.author.id}`}
                    >
                      {post.author.name}
                    </Link>
                    {post.author.verified ? (
                      <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                        V
                      </span>
                    ) : null}
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                      {formatTimeLabel(post.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Link
                      className="text-[12px] font-medium hover:opacity-80"
                      href={`/${locale}/merchant/square/author/${post.author.id}`}
                      style={{ color: "var(--muted)" }}
                    >
                      {t("viewAuthorPosts")}
                    </Link>
                    <button
                      type="button"
                      className="rounded-md px-1.5 py-0.5 text-[11px]"
                      style={
                        followingIds.includes(post.author.id)
                          ? { backgroundColor: "color-mix(in srgb, var(--border) 40%, transparent)", color: "var(--muted)" }
                          : { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }
                      }
                      onClick={async () => {
                        const isFollowing = followingIds.includes(post.author.id);
                        const nextFollowing = await toggleFollowAuthor(post.author.id, isFollowing).catch(() => isFollowing);
                        setFollowingIds((prev) =>
                          nextFollowing ? Array.from(new Set([...prev, post.author.id])) : prev.filter((id) => id !== post.author.id)
                        );
                      }}
                    >
                      {followingIds.includes(post.author.id) ? t("following") : t("follow")}
                    </button>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-5">{post.content}</p>
                </div>
              </div>

              {post.imageUrl ? (
                <div className="relative mt-2 aspect-video overflow-hidden rounded-[10px] border" style={{ borderColor: "var(--border)" }}>
                  <Image alt="post" className="object-cover" fill sizes="100vw" src={post.imageUrl} unoptimized={isRemoteImageUrl(post.imageUrl)} />
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={`${post.id}-${tag}`} className="rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: "color-mix(in srgb, var(--border) 35%, transparent)", color: "var(--muted)" }}>
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                <span>👍 {post.likes}</span>
                <button
                  className="hover:opacity-80"
                  onClick={() => setOpenCommentPostId(openCommentPostId === post.id ? null : post.id)}
                  type="button"
                >
                  💬 {commentsMap[post.id] ? commentsMap[post.id].length : post.comments}
                </button>
                <span>↗ {post.shares}</span>
              </div>

              {openCommentPostId === post.id ? (
                <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <input
                      value={commentDraftMap[post.id] ?? ""}
                      onChange={(e) => setCommentDraftMap((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={t("commentPlaceholder")}
                      className="field-input h-9 flex-1 py-0 text-sm"
                    />
                    <button className="apple-btn-primary h-9 shrink-0 px-3 text-xs" onClick={() => submitComment(post.id)} type="button">
                      {t("commentSubmit")}
                    </button>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {(commentsMap[post.id] ?? []).map((comment) => (
                      <div key={comment.id} className="rounded-lg px-2 py-1.5" style={{ backgroundColor: "color-mix(in srgb, var(--border) 25%, transparent)" }}>
                        <p className="text-[12px] font-semibold">{comment.authorName}</p>
                        <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {hasMore ? (
          <button
            className="apple-btn-secondary mt-3 h-10 w-full text-sm"
            onClick={() => setVisibleCount((prev) => prev + 8)}
            type="button"
          >
            {t("loadMore")}
          </button>
        ) : null}
      </div>
    </MerchantScaffold>
  );
}
