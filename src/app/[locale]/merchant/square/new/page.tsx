"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";

const PRESET_TAGS = ["日常", "新品", "招聘", "作品", "攻略", "推荐", "避坑", "公告"];
const MAX_IMAGES = 9;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

interface LocalImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  remoteUrl?: string;
  error?: string;
}

export default function MerchantComposePostPage() {
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : cur.length < 3 ? [...cur, tag] : cur
    );
  };

  const handlePickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setHint(`最多 ${MAX_IMAGES} 张图片`);
      return;
    }
    const fresh: LocalImage[] = [];
    for (let i = 0; i < files.length && i < room; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_IMAGE_BYTES) {
        setHint(`${f.name} 超过 8MB，跳过`);
        continue;
      }
      fresh.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        preview: URL.createObjectURL(f),
        uploading: false,
      });
    }
    if (fresh.length === 0) return;
    setImages((cur) => [...cur, ...fresh]);
  };

  const removeImage = (id: string) => {
    setImages((cur) => {
      const target = cur.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return cur.filter((i) => i.id !== id);
    });
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (text.length < 2 && images.length === 0) {
      setHint("请至少输入 2 个字或选择 1 张图片");
      return;
    }
    setSubmitting(true);
    setHint("");
    try {
      const res = await fetch(`/api/posts?locale=${encodeURIComponent(locale)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          tags: selectedTags,
        }),
      });
      if (res.ok) {
        router.replace(`/${locale}/merchant/square`);
        return;
      }
      setHint("帖子已收到，审核通过后会出现在广场");
      setTimeout(() => router.replace(`/${locale}/merchant/square`), 1200);
    } catch {
      setHint("发布失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

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
          aria-label="返回"
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
          新发帖
        </h1>
      </div>

      <section style={{ padding: "14px 16px 0" }} className="app-reveal">
        <article className="app-glass-card" style={{ borderRadius: 14, padding: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              说点什么 <span style={{ color: "var(--gray-500)" }}>（最多 1000 字）</span>
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 1000))}
              placeholder="分享一段经历、发布新品、招募搭档、推荐一家店铺…"
              className="app-input"
              style={{
                minHeight: 140,
                width: "100%",
                padding: "12px 14px",
                fontSize: 14,
                outline: "none",
              }}
              maxLength={1000}
            />
            <div
              style={{
                marginTop: 4,
                textAlign: "right",
                fontSize: 11,
                color: "var(--gray-500)",
              }}
            >
              {content.length}/1000
            </div>
          </label>

          {/* Images */}
          <div style={{ marginTop: 12 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
              图片 <span style={{ color: "var(--gray-500)" }}>（最多 {MAX_IMAGES} 张）</span>
            </span>
            <div
              style={{
                marginTop: 8,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    overflow: "hidden",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "#f5f5f0",
                  }}
                >
                  <img
                    src={img.preview}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    aria-label="删除图片"
                    style={{
                      position: "absolute",
                      right: 4,
                      top: 4,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(42, 31, 10, 0.7)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    aspectRatio: "1",
                    background: "#fff",
                    border: "1px dashed var(--brand-accent)",
                    borderRadius: 10,
                    fontSize: 28,
                    color: "var(--brand-primary)",
                    cursor: "pointer",
                  }}
                  aria-label="选择图片"
                >
                  +
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handlePickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginTop: 14 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
              标签 <span style={{ color: "var(--gray-500)" }}>（最多 3 个）</span>
            </span>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PRESET_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: active ? "1px solid var(--brand-primary)" : "1px solid var(--border)",
                      background: active ? "var(--brand-primary)" : "#fff",
                      color: active ? "#fff" : "var(--ink-900)",
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        {hint ? (
          <p style={{ textAlign: "center", fontSize: 14, color: "var(--gray-500)", marginTop: 12 }}>
            {hint}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || (content.trim().length < 2 && images.length === 0)}
          className="apple-btn-primary"
          style={{ width: "100%", marginTop: 14, height: 48 }}
        >
          {submitting ? "发布中…" : "发布"}
        </button>
      </section>

      <MerchantBottomNav locale={locale} />
    </main>
  );
}
