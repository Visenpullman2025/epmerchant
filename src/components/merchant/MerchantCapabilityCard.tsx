"use client";

import Link from "next/link";
import type { MerchantCapabilityItem } from "@/lib/api/merchant-api";

type Props = {
  item: MerchantCapabilityItem;
  editHref: string;
  standardServiceName?: string;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export default function MerchantCapabilityCard({ item, editHref, standardServiceName, t }: Props) {
  const serviceArea = displayServiceArea(item.serviceArea, t);
  const capacity = displayCapacity(item.capacityRule, t);
  const openDates = displayOpenDates(item.openDates, t);

  return (
    <article className="merchant-order-card merchant-order-card--compact">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="mt-1 text-base font-semibold">{standardServiceName || t("configuredStandardService")}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {displayReadyStatus(item.readyStatus, t)} · {displayReviewState(item.reviewState, t)}
          </p>
        </div>
        <span
          className="merchant-status-chip"
          style={{
            backgroundColor: item.enabled === false ? "#eef2ff" : "var(--ok)",
            color: item.enabled === false ? "#5f6e8f" : "#fff"
          }}
        >
          {item.enabled === false ? t("disabled") : t("enabled")}
        </span>
      </div>
      <div className="merchant-summary-grid mt-3">
        <Detail label={t("serviceArea")} value={serviceArea} />
        <Detail label={t("capacityRule")} value={capacity} />
        <Detail label={t("openDatesSummary")} value={openDates} />
      </div>
      <Link className="apple-btn-secondary mt-3 inline-flex items-center justify-center" href={editHref as `/${string}`}>
        {t("edit")}
      </Link>
    </article>
  );
}

function displayReadyStatus(value: string | null | undefined, t: Props["t"]) {
  if (value === "limited") return t("readyStatusLimited");
  if (value === "paused") return t("readyStatusPaused");
  return t("readyStatusReady");
}

function displayReviewState(value: string | null | undefined, t: Props["t"]) {
  if (value === "approved") return t("reviewApproved");
  if (value === "rejected") return t("reviewRejected");
  if (value === "pending") return t("reviewPending");
  return t("reviewPending");
}

function displayServiceArea(value: MerchantCapabilityItem["serviceArea"], t: Props["t"]) {
  const radiusKm = readNumber(value, "radiusKm");
  if (radiusKm != null) return t("radiusKm", { value: radiusKm });
  const radiusMeters = readNumber(value, "radiusMeters");
  if (radiusMeters != null) return t("radiusKm", { value: Math.round(radiusMeters / 100) / 10 });
  return t("notSet");
}

function displayCapacity(value: MerchantCapabilityItem["capacityRule"], t: Props["t"]) {
  const dailyMaxOrders = readNumber(value, "dailyMaxOrders");
  if (dailyMaxOrders != null) return t("dailyMaxOrders", { count: dailyMaxOrders });
  return t("notSet");
}

function displayOpenDates(value: string[] | null | undefined, t: Props["t"]) {
  const dates = (value || []).map((item) => new Date(item)).filter((date) => !Number.isNaN(date.getTime()));
  if (!dates.length) return t("notSet");

  const weekdays = new Set(dates.map((date) => date.getDay()));
  if (weekdays.size === 7) return t("openEveryDay");
  if (weekdays.size === 6 && !weekdays.has(0)) return t("openSundayOff");
  if (weekdays.size === 6 && !weekdays.has(6)) return t("openSaturdayOff");
  if ([1, 2, 3, 4, 5].every((day) => weekdays.has(day)) && !weekdays.has(0) && !weekdays.has(6)) {
    return t("openWeekdays");
  }
  if (weekdays.size === 2 && weekdays.has(0) && weekdays.has(6)) return t("openWeekends");
  if (weekdays.size === 1 && weekdays.has(0)) return t("openSundays");
  return t("openDateCount", { count: dates.length });
}

function readNumber(value: Record<string, unknown> | null | undefined, key: string) {
  if (!value || typeof value !== "object") return null;
  const raw = value[key];
  const number = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(number) ? number : null;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="break-words text-sm">{value}</p>
    </div>
  );
}
