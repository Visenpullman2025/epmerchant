"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { postJson } from "@/lib/merchant/auth-client";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { LoginResponse } from "@/lib/api/merchant-api";

export default function MerchantLoginPage() {
  const t = useTranslations("MerchantAuth");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
        {t("noAccount")}{" "}
        <Link className="underline" href={`/${locale}/merchant/register`}>
          {t("goRegister")}
        </Link>
      </p>
    </MerchantScaffold>
  );
}
