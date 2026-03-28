"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantServiceTypesPicker from "@/components/merchant/MerchantServiceTypesPicker";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCategoriesResponse,
  MerchantProfileResponse,
  MerchantProfileUpdateResponse
} from "@shared/api/contracts/merchant-api";
import { normalizeCategories } from "../../services/services-store";

export default function MerchantProfileInfoPage() {
  const t = useTranslations("MerchantProfile");
  const tSvc = useTranslations("MerchantServices");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [merchantName, setMerchantName] = useState("");
  const [phone, setPhone] = useState("");
  const [intro, setIntro] = useState("");
  const [online, setOnline] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<{ code: string; name: string }[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [savingTypes, setSavingTypes] = useState(false);
  const [typeMessage, setTypeMessage] = useState("");
  const [typeTone, setTypeTone] = useState<"success" | "error">("error");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const result = await getJson<MerchantProfileResponse>("/api/merchant/profile");
      if (!active) return;
      if (!result.ok) {
        setLoading(false);
        setMessage(result.message);
        return;
      }
      setMerchantName(result.data.merchantName);
      setPhone(result.data.contactPhone);
      setIntro(result.data.serviceIntro || "");
      setOnline(result.data.online ?? true);
      const profileServiceTypes = result.data.serviceTypes || [];
      setSelectedCodes(profileServiceTypes);

      const categoriesResult = await getJson<MerchantCategoriesResponse>("/api/merchant/categories");
      if (!active) return;
      if (categoriesResult.ok) {
        const normalized = normalizeCategories(categoriesResult.data.list || []);
        setCategories(normalized.map((item) => ({ code: item.code, name: item.name })));
      }
      setLoading(false);
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function onSave() {
    setMessage("");
    const result = await postJson<MerchantProfileUpdateResponse>("/api/merchant/profile", {
      merchantName,
      contactPhone: phone,
      serviceIntro: intro,
      online
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function toggleCategory(code: string) {
    setSelectedCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  }

  async function saveServiceTypes() {
    setSavingTypes(true);
    setTypeMessage("");
    const result = await postJson<MerchantProfileUpdateResponse>("/api/merchant/profile", {
      serviceTypes: selectedCodes
    });
    setSavingTypes(false);
    if (!result.ok) {
      setTypeTone("error");
      setTypeMessage(result.message);
      return;
    }
    const next = result.data.serviceTypes || selectedCodes;
    setSelectedCodes(next);
    setTypeTone("success");
    setTypeMessage(tSvc("serviceTypesSaved"));
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle=""
      title={t("infoPageTitle")}
      topRight={
        <Link className="text-xs" href={`/${locale}/merchant/profile`} style={{ color: "var(--muted)" }}>
          {t("backToHub")}
        </Link>
      }
    >
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            {message}
          </div>
        ) : null}
        <div>
          <label className="field-label">{t("merchantName")}</label>
          <input className="field-input" onChange={(e) => setMerchantName(e.target.value)} value={merchantName} />
        </div>
        <div>
          <label className="field-label">{t("phone")}</label>
          <input className="field-input" onChange={(e) => setPhone(e.target.value)} value={phone} />
        </div>
        <div>
          <label className="field-label">{t("intro")}</label>
          <textarea className="field-textarea" onChange={(e) => setIntro(e.target.value)} value={intro} />
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="field-label mb-2">{t("onlineStatus")}</p>
          <div className="flex gap-2">
            <button
              className={`apple-btn-secondary ${online ? "" : "opacity-70"}`}
              onClick={() => setOnline(true)}
              type="button"
            >
              {t("online")}
            </button>
            <button
              className={`apple-btn-secondary ${online ? "opacity-70" : ""}`}
              onClick={() => setOnline(false)}
              type="button"
            >
              {t("offline")}
            </button>
          </div>
        </div>
        <button className="apple-btn-primary w-full" onClick={onSave} type="button">
          {saved ? t("saved") : t("save")}
        </button>

        {!loading && categories.length > 0 ? (
          <div className="mt-6 space-y-2 border-t pt-6" style={{ borderColor: "var(--border)" }}>
            {typeMessage ? (
              <div
                className="rounded-xl border p-3 text-sm"
                style={{
                  borderColor: "var(--border)",
                  color: typeTone === "success" ? "var(--ok)" : "var(--danger)"
                }}
              >
                {typeMessage}
              </div>
            ) : null}
            <MerchantServiceTypesPicker
              categories={categories}
              onSave={saveServiceTypes}
              onToggle={toggleCategory}
              saveLabel={tSvc("saveServiceTypes")}
              saving={savingTypes}
              savingLabel={tSvc("savingTypes")}
              selectedCodes={selectedCodes}
              title={t("serviceTypesSectionTitle")}
            />
          </div>
        ) : null}
      </div>
    </MerchantScaffold>
  );
}
