"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  canSubmitQuote,
  candidateStatusLabel,
  candidateTitle,
  displayDateTime,
  displayRequirementSummary,
  quotePreviewAmount,
  serviceAddressText
} from "@/components/merchant/merchant-order-request-display";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  LocaleCode,
  MerchantCandidateItem,
  MerchantOrderRequestsResponse,
  MerchantQuoteConfirmationResponse
} from "@/lib/api/merchant-api";

type Props = {
  candidateId: string;
};

type QuoteDraft = {
  finalAmount: string;
  confirmedServiceTime: string;
  merchantNote: string;
  validUntil: string;
};

const emptyDraft: QuoteDraft = {
  finalAmount: "",
  confirmedServiceTime: "",
  merchantNote: "",
  validUntil: ""
};

export default function MerchantOrderRequestDetail({ candidateId }: Props) {
  const locale = useLocale() as LocaleCode;
  const t = useTranslations("MerchantOrderRequests");
  const [item, setItem] = useState<MerchantCandidateItem | null>(null);
  const [draft, setDraft] = useState<QuoteDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");

  const submittable = item ? canSubmitQuote(item) : false;

  const loadCandidate = useCallback(async (active = true) => {
    setLoading(true);
    const result = await getJson<MerchantOrderRequestsResponse>("/api/merchant/order-requests");
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }
    const found = (result.data.list || []).find((candidate) => String(candidate.candidateId) === candidateId);
    if (!found) {
      setMessageTone("error");
      setMessage(t("notFound"));
      setItem(null);
      return;
    }
    setItem(found);
    setMessage("");
    setDraft((current) => ({
      ...current,
      finalAmount: current.finalAmount || numberOnly(quotePreviewAmount(found.quotePreview))
    }));
  }, [candidateId, t]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadCandidate(active);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadCandidate]);

  async function submitQuote() {
    if (!item || !submittable) return;
    const amount = Number(draft.finalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessageTone("error");
      setMessage(t("amountRequired"));
      return;
    }
    if (!draft.confirmedServiceTime) {
      setMessageTone("error");
      setMessage(t("timeRequired"));
      return;
    }

    setSubmitting(true);
    setMessage("");
    const result = await postJson<MerchantQuoteConfirmationResponse>(
      `/api/merchant/order-requests/${encodeURIComponent(candidateId)}/quote-confirmation`,
      {
        finalAmount: amount,
        confirmedServiceTime: draft.confirmedServiceTime,
        merchantNote: draft.merchantNote.trim() || undefined,
        validUntil: draft.validUntil || undefined
      }
    );
    setSubmitting(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }
    setMessageTone("info");
    setMessage(t("submitted"));
    setItem((current) => (current ? { ...current, status: "quoted" } : current));
  }

  const detailRows = useMemo(() => {
    if (!item) return [];
    return [
      [t("quotePreview"), quotePreviewAmount(item.quotePreview), true],
      [t("serviceAddress"), serviceAddressText(item.serviceAddress), false],
      [t("requestedAppointment"), displayDateTime(item.requestedAppointment, locale), false],
      [t("distanceKm"), item.distanceKm != null ? `${item.distanceKm} km` : "-", false],
      [t("availabilityStatus"), displayNullableStatus(item.availabilityStatus), false],
      [t("expiresAt"), displayDateTime(item.expiresAt, locale), false]
    ] as Array<[string, string, boolean]>;
  }, [item, locale, t]);

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

      {loading ? (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {t("loading")}
        </div>
      ) : null}

      {item ? (
        <>
          <article className="merchant-order-card merchant-order-card--compact">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
                  {item.orderNo}
                </p>
                <h2 className="mt-1 text-base font-semibold">{candidateTitle(item, t("requestTitle"))}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {displayRequirementSummary(item.requirementSummary, locale)}
                </p>
              </div>
              <span className="merchant-status-chip" style={{ backgroundColor: "#e8f2ff", color: "#2256c5" }}>
                {candidateStatusLabel(item.status, locale)}
              </span>
            </div>
            <div className="merchant-summary-grid mt-3">
              {detailRows.map(([label, value, strong]) => (
                <Detail key={label} label={label} strong={strong} value={value} />
              ))}
            </div>
          </article>

          {submittable ? (
            <article className="merchant-order-card">
              <h2 className="text-base font-semibold">{t("quoteFormTitle")}</h2>
              <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-3">
                <DraftInput
                  label={t("finalAmount")}
                  type="number"
                  value={draft.finalAmount}
                  onChange={(finalAmount) => setDraft((current) => ({ ...current, finalAmount }))}
                />
                <DraftInput
                  label={t("confirmedServiceTime")}
                  type="datetime-local"
                  value={draft.confirmedServiceTime}
                  onChange={(confirmedServiceTime) => setDraft((current) => ({ ...current, confirmedServiceTime }))}
                />
                <DraftInput
                  label={t("validUntil")}
                  type="datetime-local"
                  value={draft.validUntil}
                  onChange={(validUntil) => setDraft((current) => ({ ...current, validUntil }))}
                />
                <div>
                  <label className="field-label">{t("merchantNote")}</label>
                  <textarea
                    className="field-textarea"
                    value={draft.merchantNote}
                    onChange={(event) => setDraft((current) => ({ ...current, merchantNote: event.target.value }))}
                  />
                </div>
              </div>
              <button className="apple-btn-primary mt-3 w-full" disabled={submitting} onClick={submitQuote} type="button">
                {submitting ? t("submitting") : t("submit")}
              </button>
            </article>
          ) : (
            <article className="merchant-order-card merchant-order-card--compact">
              <h2 className="text-base font-semibold">{t("quoteSubmittedTitle")}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {t("quoteSubmittedDesc")}
              </p>
            </article>
          )}
        </>
      ) : null}
    </div>
  );
}

function numberOnly(value: string) {
  const matched = value.match(/\d+(?:\.\d+)?/);
  return matched?.[0] || "";
}

function displayNullableStatus(value: string | null | undefined) {
  if (!value || value === "unknown") return "-";
  return value;
}

function Detail({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className={strong ? "break-words text-sm font-semibold" : "break-words text-sm"}>{value}</p>
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
