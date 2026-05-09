"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MerchantCapabilityCard from "@/components/merchant/MerchantCapabilityCard";
import { getJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCapabilitiesResponse,
  MerchantCapabilityItem,
  MerchantStandardServiceItem,
  MerchantStandardServicesResponse
} from "@/lib/api/merchant-api";

export default function MerchantCapabilityManager() {
  const locale = useLocale();
  const t = useTranslations("MerchantCapabilities");
  const [items, setItems] = useState<MerchantCapabilityItem[]>([]);
  const [standardServices, setStandardServices] = useState<MerchantStandardServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");

  async function loadCapabilities(active = true) {
    setLoading(true);
    const result = await getJson<MerchantCapabilitiesResponse>("/api/merchant/capabilities");
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      setItems([]);
      return;
    }
    setMessage("");
    setItems(result.data.list || []);
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadCapabilities(active);
    }, 0);
    async function loadStandardServices() {
      setServicesLoading(true);
      const result = await getJson<MerchantStandardServicesResponse>(
        `/api/merchant/standard-services?locale=${encodeURIComponent(locale)}`
      );
      if (!active) return;
      setServicesLoading(false);
      if (!result.ok) {
        setMessageTone("error");
        setMessage(t("standardServicesLoadFailed"));
        return;
      }
      setStandardServices(result.data || []);
    }
    void loadStandardServices();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locale, t]);

  const standardServiceNameByCode = useMemo(() => {
    return new Map(
      standardServices.map((service) => [service.standardServiceCode, service.name] as const)
    );
  }, [standardServices]);

  return (
    <div className="mt-4 space-y-4">
      {message ? (
        <div
          className="rounded-xl border p-3 text-sm"
          style={{
            borderColor: messageTone === "info" ? "var(--border)" : "var(--danger)",
            color: messageTone === "info" ? "var(--text)" : "var(--danger)"
          }}
        >
          {message}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {servicesLoading ? t("standardServicesLoading") : t("listSummary", { count: items.length })}
        </p>
        <Link className="apple-btn-primary inline-flex items-center justify-center" href={`/${locale}/merchant/capabilities/new`}>
          {t("create")}
        </Link>
      </div>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        {!loading && !items.length ? (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("empty")}
          </div>
        ) : null}
        {items.map((item) => (
          <MerchantCapabilityCard
            item={item}
            key={String(item.capabilityId)}
            editHref={`/${locale}/merchant/capabilities/${encodeURIComponent(String(item.capabilityId))}`}
            standardServiceName={standardServiceNameByCode.get(item.standardServiceCode)}
            t={t}
          />
        ))}
      </section>
    </div>
  );
}
