"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { postJson } from "@/lib/merchant/auth-client";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { LoginResponse } from "@/lib/api/merchant-api";
import { supabase } from "@/lib/supabase/client";

export default function MerchantLoginPage() {
  const t = useTranslations("MerchantAuth");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "line" | null>(null);

  const initialOauthError = (() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("error") ?? "";
  })();
  useEffect(() => {
    if (initialOauthError) setError(initialOauthError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithProvider(provider: "google" | "line") {
    setError("");
    if (provider === "line") {
      setError("LINE 登录暂未开放，敬请期待");
      return;
    }
    setOauthBusy(provider);
    const next = `/${locale}/merchant/dashboard`;
    const redirectTo = `${window.location.origin}/${locale}/merchant/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthBusy(null);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await postJson<LoginResponse>("/api/merchant/auth/login", {
      email,
      password,
      locale
    }, {
      suppressUnauthorizedRedirect: true
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const nextLocale = result.data.preferredLocale;
    router.push(`/${nextLocale}/merchant/dashboard`);
  }

  return (
    <MerchantScaffold title={t("loginTitle")}>
      <div className="mt-4 flex items-center justify-between">
        <div className="merchant-segment">
          <button className="merchant-segment-item active" type="button">
            {t("login")}
          </button>
          <Link className="merchant-segment-item" href={`/${locale}/merchant/register`}>
            {t("register")}
          </Link>
        </div>
      </div>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="field-label">{t("email")}</label>
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label">{t("password")}</label>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="text-sm" style={{ color: "#ef4444" }}>
            {error}
          </p>
        ) : null}
        <button className="apple-btn-primary w-full" disabled={loading} type="submit">
          {loading ? t("submitting") : t("login")}
        </button>
      </form>

      {/* OAuth 第三方登录 */}
      <div className="my-4 flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
        <div className="flex-1" style={{ borderTop: "1px solid var(--border, #e5e7eb)" }} />
        <span>或</span>
        <div className="flex-1" style={{ borderTop: "1px solid var(--border, #e5e7eb)" }} />
      </div>
      <button
        type="button"
        onClick={() => signInWithProvider("google")}
        disabled={!!oauthBusy}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border bg-white text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        style={{ borderColor: "var(--border, #d1d5db)", color: "var(--foreground, #111827)" }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span>{oauthBusy === "google" ? "跳转 Google …" : "使用 Google 登录"}</span>
      </button>
      <button
        type="button"
        onClick={() => signInWithProvider("line")}
        disabled={!!oauthBusy}
        className="mt-2 flex h-11 w-full items-center justify-center gap-3 rounded-xl text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "#06C755" }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M19.365 9.863c.349 0 .631.286.631.635 0 .348-.282.635-.631.635H17.61v1.125h1.755c.349 0 .631.283.631.634 0 .344-.282.629-.631.629H16.79c-.342 0-.624-.281-.624-.629V8.108c0-.345.282-.63.624-.63h2.575c.346 0 .628.283.628.628 0 .345-.282.638-.628.638h-1.756v1.119h1.756zm-3.875 3.658c0 .27-.174.508-.43.594-.064.021-.132.031-.198.031-.211 0-.391-.082-.515-.241l-2.585-3.51v3.122c0 .345-.272.634-.625.634-.346 0-.621-.289-.621-.634V8.108c0-.27.173-.508.428-.591.063-.022.135-.029.196-.029.198 0 .378.105.503.265l2.601 3.515V8.108c0-.345.273-.63.625-.63.343 0 .621.285.621.63v5.413zm-5.998 0c0 .345-.275.634-.621.634-.348 0-.625-.289-.625-.634V8.108c0-.345.277-.63.625-.63.346 0 .621.285.621.63v5.413zm-2.466.634H4.917c-.345 0-.624-.289-.624-.634V8.108c0-.345.279-.63.624-.63.348 0 .627.285.627.63v4.771h1.482c.346 0 .628.283.628.629 0 .342-.282.625-.628.625M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        <span>{oauthBusy === "line" ? "跳转 LINE …" : "使用 LINE 登录"}</span>
      </button>

      <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
        {t("noAccount")}{" "}
        <Link className="underline" href={`/${locale}/merchant/register`}>
          {t("goRegister")}
        </Link>
      </p>
    </MerchantScaffold>
  );
}
