"use client";

import type { MerchantCapabilityItem } from "@/lib/api/merchant-api";

type Props = {
  item: MerchantCapabilityItem;
  standardServiceName?: string;
  t: (key: string) => string;
  onEdit: (item: MerchantCapabilityItem) => void;
};

export default function MerchantCapabilityCard({ item, standardServiceName, t, onEdit }: Props) {
  return (
    <article className="merchant-order-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>
            {t("capabilityId")}: {item.capabilityId}
          </p>
          <h3 className="mt-1 text-base font-semibold">{standardServiceName || t("configuredStandardService")}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t("status")}: {item.status || "-"} · {t("reviewState")}: {item.reviewState || "-"}
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
      <div className="merchant-order-detail-rows mt-3">
        <Detail label={t("readyStatus")} value={item.readyStatus || "-"} />
        <Detail label={t("serviceArea")} value={displayConfig(item.serviceArea)} />
        <Detail label={t("extraDistanceRule")} value={displayConfig(item.extraDistanceRule)} />
        <Detail label={t("capacityRule")} value={displayConfig(item.capacityRule)} />
        <Detail label={t("timeSlots")} value={displayConfig(item.timeSlots)} />
        <Detail label={t("openDates")} value={(item.openDates || []).join(", ") || "-"} />
      </div>
      <button className="apple-btn-secondary mt-3" onClick={() => onEdit(item)} type="button">
        {t("edit")}
      </button>
    </article>
  );
}

function displayConfig(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const scalars = value.filter((item) => ["string", "number", "boolean"].includes(typeof item));
    return scalars.length ? scalars.join(", ") : value.length ? `${value.length}` : "-";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
      .slice(0, 4)
      .map(([key, item]) => `${key}: ${String(item)}`);
    return entries.join(" · ") || "-";
  }
  return "-";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="break-words text-sm">{value}</p>
    </div>
  );
}
