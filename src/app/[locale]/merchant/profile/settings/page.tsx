"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { postJson } from "@/lib/merchant/auth-client";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { SaveLocaleResponse } from "@/lib/api/merchant-api";

export default function MerchantProfileSettingsPage() {
  const t = useTranslations("MerchantProfile");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [preferredLocale, setPreferredLocale] = useState(locale);
  const [langSaving, setLangSaving] = useState(false);
  const [langMessage, setLangMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setPreferredLocale(locale);
  }, [locale]);

  async function onSaveLanguage() {
    setLangSaving(true);
    setLangMessage("");
    const result = await postJson<SaveLocaleResponse>("/api/merchant/preferences/locale", {
      locale: preferredLocale
    });
    setLangSaving(false);
    if (!result.ok) {
      setLangMessage(result.message);
      return;
    }
    setLangMessage(t("languageSaved"));
    router.push(`/${result.data.preferredLocale}/merchant/profile/settings`);
  }

  async function onLogout() {
    setLoggingOut(true);
    await postJson<{ loggedOut: true }>("/api/merchant/auth/logout", {});
    setLoggingOut(false);
    router.push(`/${locale}/merchant/login`);
  }

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={t("settingsPageTitle")}
      titleAction={
        <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/profile`}>
          {t("backToHub")}
        </Link>
      }
    >
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="field-label mb-2">{t("languageLabel")}</p>
          <select
            className="field-select"
            onChange={(event) => setPreferredLocale(event.target.value)}
            value={preferredLocale}
          >
            <option value="zh">{t("langZh")}</option>
            <option value="en">{t("langEn")}</option>
            <option value="th">{t("langTh")}</option>
          </select>
          {langMessage ? (
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              {langMessage}
            </p>
          ) : null}
          <button className="apple-btn-secondary mt-3 w-full" disabled={langSaving} onClick={onSaveLanguage} type="button">
            {langSaving ? t("savingLanguage") : t("saveLanguage")}
          </button>
        </div>
        <Link
          className="apple-btn-primary inline-flex w-full items-center justify-center"
          href={`/${locale}/merchant/services`}
        >
          {t("goServices")}
        </Link>
        <button className="apple-btn-secondary w-full" disabled={loggingOut} onClick={onLogout} type="button">
          {loggingOut ? t("loggingOut") : t("logout")}
        </button>
      </div>
    </MerchantScaffold>
  );
}
