"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { postJson } from "@/lib/merchant/auth-client";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { RegisterResponse } from "@shared/api/contracts/merchant-api";

export default function MerchantRegisterPage() {
  const t = useTranslations("MerchantAuth");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [email, setEmail] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    const result = await postJson<RegisterResponse>("/api/merchant/auth/register", {
      merchantName,
      email,
      password,
      locale
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/${result.data.preferredLocale}/merchant/dashboard`);
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      heroAlt={t("registerHeroAlt")}
      heroSrc="/images/merchant-auth-hero.svg"
      subtitle={t("registerDesc")}
      title={t("registerTitle")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("secure")}</span>}
    >
      <div className="mt-4 flex items-center justify-between">
        <div className="merchant-segment">
          <Link className="merchant-segment-item" href={`/${locale}/merchant/login`}>
            {t("login")}
          </Link>
          <button className="merchant-segment-item active" type="button">
            {t("register")}
          </button>
        </div>
      </div>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="field-label">{t("merchantName")}</label>
            <input
              className="field-input"
              type="text"
              value={merchantName}
              onChange={(event) => setMerchantName(event.target.value)}
              required
            />
          </div>
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
          <div>
            <label className="field-label">{t("confirmPassword")}</label>
            <input
              className="field-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm" style={{ color: "#ef4444" }}>
              {error}
            </p>
          ) : null}
          <button className="apple-btn-primary w-full" disabled={loading} type="submit">
            {loading ? t("submitting") : t("register")}
          </button>
        </form>
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          {t("hasAccount")}{" "}
          <Link className="underline" href={`/${locale}/merchant/login`}>
            {t("goLogin")}
          </Link>
        </p>
    </MerchantScaffold>
  );
}
