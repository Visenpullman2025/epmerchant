"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { SquarePost } from "@/data/square";
import { toggleFollowAuthor } from "@/lib/square/client";

export default function MerchantSquareAuthorPage() {
  const t = useTranslations("SquareAuthorPage");
  const tAuth = useTranslations("MerchantAuth");
  const params = useParams<{ locale: string; authorId: string }>();
  const locale = params.locale || "zh";
  const authorId = params.authorId;

  const [posts, setPosts] = useState<SquarePost[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadAuthorPosts() {
      const res = await fetch(`/api/square?locale=${locale}&authorId=${encodeURIComponent(authorId)}&limit=50`, {
        cache: "no-store"
      });
      if (!res.ok || !mounted) return;
      const json = (await res.json()) as { data?: SquarePost[] };
      setPosts(Array.isArray(json.data) ? json.data : []);
      const initialFollowing = (json.data ?? [])
        .filter((post) => post.author.id === authorId && post.author.following)
        .map((post) => post.author.id);
      setFollowingIds(initialFollowing);
    }
    void loadAuthorPosts();
    return () => {
      mounted = false;
    };
  }, [locale, authorId]);

  const author = useMemo(() => posts[0]?.author, [posts]);
  const isFollowing = followingIds.includes(authorId);

  return (
    <MerchantScaffold
      brand={tAuth("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={tAuth("brand")}
      heroSrc="/images/merchant-dashboard-hero.svg"
      subtitle=""
      title={t("title")}
      topRight={
        <Link className="text-xs" href={`/${locale}/merchant/square`} style={{ color: "var(--muted)" }}>
          {t("back")}
        </Link>
      }
    >
      <div className="mt-4 space-y-3">
        <article className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
            >
              {author?.name?.slice(0, 1) ?? "U"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{author?.name ?? t("unknownAuthor")}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("postCount", { count: posts.length })}
              </p>
            </div>
            <button
              type="button"
              className={`h-9 shrink-0 rounded-lg px-3 text-xs font-semibold ${
                isFollowing ? "apple-btn-secondary border" : "apple-btn-primary"
              }`}
              style={isFollowing ? { borderColor: "var(--border)" } : undefined}
              onClick={async () => {
                const nextFollowing = await toggleFollowAuthor(authorId, isFollowing).catch(() => isFollowing);
                setFollowingIds(nextFollowing ? [authorId] : []);
              }}
            >
              {isFollowing ? t("following") : t("follow")}
            </button>
          </div>
        </article>

        {posts.length === 0 ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("emptyPosts")}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <article className="rounded-xl border p-3" key={post.id} style={{ borderColor: "var(--border)" }}>
                <p className="whitespace-pre-line text-sm leading-5">{post.content}</p>
                <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                  <span>👍 {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>↗ {post.shares}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MerchantScaffold>
  );
}
