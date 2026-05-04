"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getJson } from "@/lib/merchant/auth-client";
import type { MerchantCreditProfileResponse } from "@/lib/api/merchant-api";

export default function MerchantCreditProfilePanel() {
  const t = useTranslations("MerchantCreditProfile");
  const [profile, setProfile] = useState<MerchantCreditProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const result = await getJson<MerchantCreditProfileResponse>("/api/merchant/credit-profile");
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setMessage(t("apiUnavailable"));
        setProfile(null);
        return;
      }
      setMessage("");
      setProfile(result.data);
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, [t]);

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        {t("loading")}
      </div>
    );
  }

  if (message) {
    return (
      <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
        {message}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="merchant-kpi">
        <div className="merchant-kpi-card">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {t("score")}
          </p>
          <p className="mt-1 text-lg font-semibold">{profile?.score ?? "-"}</p>
        </div>
        <div className="merchant-kpi-card">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {t("level")}
          </p>
          <p className="mt-1 text-lg font-semibold">{profile?.level || "-"}</p>
        </div>
        <div className="merchant-kpi-card">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {t("lastUpdatedAt")}
          </p>
          <p className="mt-1 text-sm font-semibold">{profile?.lastUpdatedAt || "-"}</p>
        </div>
      </section>

      <section className="merchant-order-card">
        <h2 className="text-base font-semibold">{t("badges")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile?.badges?.length ? (
            profile.badges.map((badge) => (
              <span className="merchant-status-chip" key={badge} style={{ backgroundColor: "#e8f2ff", color: "#2256c5" }}>
                {badge}
              </span>
            ))
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {t("emptyBadges")}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t("events")}</h2>
        {profile?.events?.length ? (
          profile.events.map((event, index) => (
            <article className="merchant-order-card" key={`${event.eventType || event.title || "event"}-${index}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{event.title || event.eventType || t("event")}</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    {event.description || event.note || "-"}
                  </p>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  {event.scoreDelta ?? ""}
                </span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                {event.occurredAt || event.createdAt || "-"}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("emptyEvents")}
          </div>
        )}
      </section>
    </div>
  );
}
