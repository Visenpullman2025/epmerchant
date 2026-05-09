"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getJson } from "@/lib/merchant/auth-client";
import type { MerchantProfileResponse, MerchantServicesResponse } from "@/lib/api/merchant-api";
import { normalizeServiceCard, type MerchantServiceCard } from "./services-store";

export default function MerchantServicesPage() {
  const t = useTranslations("MerchantServices");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const [services, setServices] = useState<MerchantServiceCard[]>([]);
  const [boundCodes, setBoundCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadServices() {
      setLoading(true);
      const profileResult = await getJson<MerchantProfileResponse>("/api/merchant/profile");
      if (!active) return;
      if (!profileResult.ok) {
        setMessage(profileResult.message);
        setLoading(false);
        return;
      }
      const profileServiceTypes = profileResult.data.serviceTypes || [];
      setBoundCodes(profileServiceTypes);

      const servicesResult = await getJson<MerchantServicesResponse>("/api/merchant/services");
      if (!active) return;
      setLoading(false);
      if (!servicesResult.ok) {
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

  const listedServices = services.filter((item) => item.status !== "draft");
  const hasBoundCategories = boundCodes.length > 0;
  const summary = {
    published: services.filter((item) => item.published).length,
    promoted: 0,
    leads: listedServices.length
  };

  function getReviewBadge(service: MerchantServiceCard) {
    if (service.reviewState === "pending") {
      return {
        label: t("reviewPending"),
        backgroundColor: "#fff7e6",
        color: "#b7791f"
      };
    }
    if (service.reviewState === "rejected") {
      return {
        label: t("reviewRejected"),
        backgroundColor: "#fdecec",
        color: "#c24141"
      };
    }
    if (service.reviewState === "approved") {
      return {
        label: t("published"),
        backgroundColor: "#e9f9f0",
        color: "#0f8f4c"
      };
    }
    return {
      label: service.published ? t("published") : t("draft"),
      backgroundColor: service.published ? "#e9f9f0" : "#fff7e6",
      color: service.published ? "#0f8f4c" : "#b7791f"
    };
  }

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={t("title")}
    >
      <div className="mt-4 space-y-4">
        {message ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
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
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            <p>{t("bindTypesHint")}</p>
            <Link className="apple-btn-primary mt-3 inline-flex items-center justify-center" href={`/${locale}/merchant/profile/info`}>
              {t("bindTypesLink")}
            </Link>
          </div>
        ) : (
          <div className="merchant-service-hero-card flex justify-end">
            <Link className="apple-btn-primary inline-flex items-center justify-center" href={`/${locale}/merchant/services/new`}>
              {t("addService")}
            </Link>
          </div>
        )}

        {!loading && hasBoundCategories && listedServices.length === 0 ? (
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
          {listedServices.map((service) => {
            const badge = getReviewBadge(service);
            return (
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
                    <span className="merchant-status-chip" style={{ backgroundColor: badge.backgroundColor, color: badge.color }}>
                      {badge.label}
                    </span>
                    <Link className="apple-btn-primary ml-auto inline-flex items-center justify-center" href={`/${locale}/merchant/services/${service.id}`}>
                      {t("editShort")}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </MerchantScaffold>
  );
}
