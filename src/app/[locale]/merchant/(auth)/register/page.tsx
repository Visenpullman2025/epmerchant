"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { postJson } from "@/lib/merchant/auth-client";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { RegisterResponse } from "@/lib/api/merchant-api";
import { localeHref } from "@/lib/typed-routes";

// 商家端独立 sessionStorage key，避免与 ep（用户端）冲突。
const PENDING_FORM_KEY = "expath.merchant.pending_register_form";
const PENDING_CONSENT_KEY = "expath.merchant.pending_consent";

interface PendingForm {
  merchantName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PendingConsent {
  versions: Array<{ code: string; version: string }>;
  role: string;
  accepted_at: string;
}

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
  const consumedConsentRef = useRef(false);

  // On mount: if we have both pending form and pending consent (i.e. merchant
  // just returned from the combined legal page), auto-submit registration.
  useEffect(() => {
    if (consumedConsentRef.current) return;
    if (typeof window === "undefined") return;
    const consentRaw = window.sessionStorage.getItem(PENDING_CONSENT_KEY);
    const formRaw = window.sessionStorage.getItem(PENDING_FORM_KEY);
    if (!consentRaw || !formRaw) return;
    let consent: PendingConsent;
    let form: PendingForm;
    try {
      consent = JSON.parse(consentRaw) as PendingConsent;
      form = JSON.parse(formRaw) as PendingForm;
    } catch {
      window.sessionStorage.removeItem(PENDING_CONSENT_KEY);
      window.sessionStorage.removeItem(PENDING_FORM_KEY);
      return;
    }
    consumedConsentRef.current = true;
    setMerchantName(form.merchantName);
    setEmail(form.email);
    setPassword(form.password);
    setConfirmPassword(form.confirmPassword);
    void submitWithConsent(form, consent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

  async function submitWithConsent(form: PendingForm, consent: PendingConsent) {
    setLoading(true);
    setError("");
    const result = await postJson<RegisterResponse>("/api/merchant/auth/register", {
      merchantName: form.merchantName,
      email: form.email,
      password: form.password,
      locale,
      consent_versions: consent.versions
    });
    setLoading(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PENDING_CONSENT_KEY);
    }
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PENDING_FORM_KEY);
    }
    router.push(`/${result.data.preferredLocale}/merchant/dashboard`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (typeof window !== "undefined") {
      const pending: PendingForm = {
        merchantName: merchantName.trim(),
        email: email.trim(),
        password,
        confirmPassword
      };
      window.sessionStorage.setItem(PENDING_FORM_KEY, JSON.stringify(pending));
    }
    router.push(
      localeHref(
        `/${locale}/legal/combined?role=merchant&next=/${locale}/merchant/register`
      )
    );
  }

  return (
    <MerchantScaffold title={t("registerTitle")}>
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
