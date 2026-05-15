import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { PostDetailClient } from "@/components/square/PostDetailClient";
import { fetchApi } from "@/lib/api/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";

const I18N: Record<string, { title: string; back: string }> = {
  zh: { title: "帖子详情", back: "返回" },
  en: { title: "Post", back: "Back" },
  th: { title: "โพสต์", back: "กลับ" },
};

interface PostListEnvelope {
  code: number;
  message?: string;
  data?: { list?: Array<Record<string, unknown>> };
}

export default async function MerchantPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId: raw } = await params;
  const postId = decodeURIComponent(raw);
  const locale = await getLocale();
  const t = I18N[locale] ?? I18N.zh;

  let post: Record<string, unknown> | null = null;
  try {
    const res = await fetchApi<PostListEnvelope>(
      `/api/posts?limit=100&locale=${encodeURIComponent(locale)}`
    );
    if (res.code === 0) {
      const list = res.data?.list ?? [];
      post =
        list.find((p) => String(p.postId ?? p.postCode ?? p.id ?? "") === postId) ?? null;
    }
  } catch {
    // fall through
  }

  if (!post) notFound();

  return (
    <main className="app-page-bg" style={{ minHeight: "100vh", paddingBottom: 110 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <a
          href={`/${locale}/merchant/square`}
          style={{ fontSize: 17, color: "var(--brand-primary)", textDecoration: "none" }}
          aria-label={t.back}
        >
          ←
        </a>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 700,
            margin: 0,
            flex: 1,
            textAlign: "center",
            letterSpacing: "-0.015em",
            marginRight: 32,
          }}
        >
          {t.title}
        </h1>
      </div>

      <PostDetailClient post={post} postId={postId} />
      <MerchantBottomNav locale={locale} />
    </main>
  );
}
