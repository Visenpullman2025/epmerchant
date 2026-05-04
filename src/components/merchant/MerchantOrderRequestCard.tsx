"use client";

import type { QuoteDraft } from "@/components/merchant/MerchantOrderRequestsBoard";
import type { MerchantCandidateItem } from "@/lib/api/merchant-api";

type Props = {
  item: MerchantCandidateItem;
  draft: QuoteDraft;
  submitting: boolean;
  t: (key: string) => string;
  onDraftChange: (draft: QuoteDraft) => void;
  onSubmit: () => void;
};

function displayValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function serviceAddressText(value: MerchantCandidateItem["serviceAddress"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.address || JSON.stringify(value);
}

function quotePreviewAmount(value: MerchantCandidateItem["quotePreview"]) {
  if (!value) return "-";
  const amount = value.amount ?? value.estimatedAmount ?? value.price ?? value.total;
  const min = value.minAmount ?? value.priceMin;
  const max = value.maxAmount ?? value.priceMax;
  if (amount != null) return String(amount);
  if (min != null || max != null) return `${min ?? "-"} - ${max ?? "-"}`;
  return JSON.stringify(value);
}

export default function MerchantOrderRequestCard({
  item,
  draft,
  submitting,
  t,
  onDraftChange,
  onSubmit
}: Props) {
  const id = String(item.candidateId);

  return (
    <article className="merchant-order-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
            {item.orderNo} · {t("candidateId")} {id}
          </p>
          <h3 className="mt-1 text-base font-semibold">{item.standardServiceCode || t("unknown")}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {displayValue(item.requirementSummary)}
          </p>
        </div>
        <span className="merchant-status-chip" style={{ backgroundColor: "#e8f2ff", color: "#2256c5" }}>
          {item.status || t("unknown")}
        </span>
      </div>

      <div className="merchant-order-detail-rows mt-3">
        <Detail label={t("quotePreview")} value={quotePreviewAmount(item.quotePreview)} strong />
        <Detail label={t("serviceAddress")} value={serviceAddressText(item.serviceAddress)} />
        <Detail label={t("requestedAppointment")} value={displayValue(item.requestedAppointment)} />
        <Detail label={t("expiresAt")} value={item.expiresAt || "-"} />
      </div>

      <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-3">
        <DraftInput
          label={t("finalAmount")}
          type="number"
          value={draft.finalAmount}
          onChange={(finalAmount) => onDraftChange({ ...draft, finalAmount })}
        />
        <DraftInput
          label={t("confirmedServiceTime")}
          type="datetime-local"
          value={draft.confirmedServiceTime}
          onChange={(confirmedServiceTime) => onDraftChange({ ...draft, confirmedServiceTime })}
        />
        <DraftInput
          label={t("validUntil")}
          type="datetime-local"
          value={draft.validUntil}
          onChange={(validUntil) => onDraftChange({ ...draft, validUntil })}
        />
        <div>
          <label className="field-label">{t("merchantNote")}</label>
          <textarea
            className="field-textarea"
            value={draft.merchantNote}
            onChange={(event) => onDraftChange({ ...draft, merchantNote: event.target.value })}
          />
        </div>
      </div>

      <button className="apple-btn-primary mt-3" disabled={submitting} onClick={onSubmit} type="button">
        {submitting ? t("submitting") : t("submit")}
      </button>
    </article>
  );
}

function Detail({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className={strong ? "text-sm font-semibold" : "text-sm"}>{value}</p>
    </div>
  );
}

function DraftInput({
  label,
  type,
  value,
  onChange
}: {
  label: string;
  type: "number" | "datetime-local";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        className="field-input"
        inputMode={type === "number" ? "decimal" : undefined}
        min={type === "number" ? "0" : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
