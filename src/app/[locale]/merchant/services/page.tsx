"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCategoriesResponse,
  MerchantProfileResponse,
  MerchantProfileUpdateResponse,
  MerchantServicesResponse
} from "@shared/api/contracts/merchant-api";
import { normalizeCategories, normalizeServiceCard, type MerchantServiceCard } from "./services-store";

export default function MerchantServicesPage() {
  const t = useTranslations("MerchantServices");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const [services, setServices] = useState<MerchantServiceCard[]>([]);
  const [categories, setCategories] = useState<MerchantCategoriesResponse["list"]>([]);
  const [boundCodes, setBoundCodes] = useState<string[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTypes, setSavingTypes] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");

  useEffect(() => {
    let active = true;
    async function loadServices() {
      setLoading(true);
      const profileResult = await getJson<MerchantProfileResponse>("/api/merchant/profile");
      if (!active) return;
      if (!profileResult.ok) {
        setMessageTone("error");
        setMessage(profileResult.message);
        setLoading(false);
        return;
      }
      const profileServiceTypes = profileResult.data.serviceTypes || [];
      setBoundCodes(profileServiceTypes);
      setSelectedCodes(profileServiceTypes);

      const categoriesResult = await getJson<MerchantCategoriesResponse>("/api/merchant/categories");
      if (!active) return;
      if (categoriesResult.ok) {
        const normalizedCategories = normalizeCategories(categoriesResult.data.list || []);
        setCategories(
          normalizedCategories.map((item) => ({
            ...item,
            selected: profileServiceTypes.includes(item.code)
          }))
        );
      }

      const servicesResult = await getJson<MerchantServicesResponse>("/api/merchant/services");
      if (!active) return;
      setLoading(false);
      if (!servicesResult.ok) {
        setMessageTone("error");
        setMessage(servicesResult.message);
        setServices([]);
      } else {
        setMessage("");
        setServices((servicesResult.data.list || []).map(normalizeServiceCard));
      }
    }
    void loadServices();
    return () => {
      active = false;
    };
  }, []);

  const publishedServices = services.filter((item) => item.published);
  const hasBoundCategories = boundCodes.length > 0;
  const summary = {
    published: publishedServices.length,
    promoted: 0,
    leads: publishedServices.length
  };

  function toggleCategory(code: string) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  async function saveServiceTypes() {
    setSavingTypes(true);
    setMessage("");
    const result = await postJson<MerchantProfileUpdateResponse>("/api/merchant/profile", {
      serviceTypes: selectedCodes
    });
    setSavingTypes(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }
    const nextBoundCodes = result.data.serviceTypes || selectedCodes;
    setBoundCodes(nextBoundCodes);
    setSelectedCodes(nextBoundCodes);
    setCategories((current) =>
      current.map((item) => ({ ...item, selected: nextBoundCodes.includes(item.code) }))
    );
    setMessageTone("success");
    setMessage(t("serviceTypesSaved"));
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle=""
      title=""
      topRight={
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {t("pricingMode")}
        </span>
      }
    >
      <div className="mt-4 space-y-4">
        {message ? (
          <div
            className="rounded-xl border p-3 text-sm"
            style={{
              borderColor: "var(--border)",
              color: messageTone === "success" ? "var(--ok)" : "var(--danger)"
            }}
          >
            {message}
          </div>
        ) : null}
        <div className="merchant-kpi">
          <div className="merchant-kpi-card">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("publishedCount")}
            </p>
            <p className="mt-1 text-lg font-semibold">{summary.published}</p>
          </div>
          <div className="merchant-kpi-card">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("promotedCount")}
            </p>
            <p className="mt-1 text-lg font-semibold">{summary.promoted}</p>
          </div>
          <div className="merchant-kpi-card">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("todayLeads")}
            </p>
            <p className="mt-1 text-lg font-semibold">{summary.leads}</p>
          </div>
        </div>

        {!hasBoundCategories ? (
          <div className="merchant-editor-section">
            <h2 className="text-base font-semibold">{t("serviceTypesTitle")}</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {t("serviceTypesDesc")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {categories.map((category) => {
                const selected = selectedCodes.includes(category.code);
                return (
                  <button
                    key={category.code}
                    type="button"
                    className={`rounded-xl border px-3 py-3 text-left text-sm ${selected ? "text-white" : ""}`}
                    style={{
                      borderColor: selected ? "var(--accent)" : "var(--border)",
                      backgroundColor: selected ? "var(--accent)" : "transparent"
                    }}
                    onClick={() => toggleCategory(category.code)}
                  >
                    <div className="font-semibold">{category.name}</div>
                    <div className="mt-1 opacity-80">{category.code}</div>
                  </button>
                );
              })}
            </div>
            <button className="apple-btn-primary mt-3 w-full" disabled={!selectedCodes.length || savingTypes} onClick={saveServiceTypes} type="button">
              {savingTypes ? t("savingTypes") : t("saveServiceTypes")}
            </button>
          </div>
        ) : (
          <div className="merchant-service-hero-card flex justify-end">
            <Link className="apple-btn-primary inline-flex items-center justify-center" href={`/${locale}/merchant/services/new`}>
              {t("addService")}
            </Link>
          </div>
        )}

        {!loading && hasBoundCategories && publishedServices.length === 0 ? (
          <div className="rounded-3xl p-5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("emptyPublished")}
          </div>
        ) : null}

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-3xl p-5 text-sm" style={{ color: "var(--muted)" }}>
              {t("loading")}
            </div>
          ) : null}
          {publishedServices.map((service) => (
            <article className="merchant-service-card" key={service.id}>
              <div className="merchant-service-cover">
                <Image
                  alt={service.title}
                  fill
                  sizes="120px"
                  src={service.coverImageUrl}
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="merchant-service-body">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{service.title}</h3>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {service.subtitle}
                    </p>
                  </div>
                  <span className="merchant-price-pill">{service.priceText}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="merchant-status-chip" style={{ backgroundColor: service.published ? "#e9f9f0" : "#fff7e6", color: service.published ? "#0f8f4c" : "#b7791f" }}>
                    {service.published ? t("published") : t("draft")}
                  </span>
                  <Link className="apple-btn-primary ml-auto inline-flex items-center justify-center" href={`/${locale}/merchant/services/${service.id}`}>
                    {t("editShort")}
                  </Link>
                </div>

              </div>
            </article>
          ))}
        </div>
      </div>
      <MerchantBottomNav locale={locale} />
    </MerchantScaffold>
  );
}
