"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MerchantOrderRequestCard from "@/components/merchant/MerchantOrderRequestCard";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCandidateItem,
  MerchantOrderRequestsResponse,
  MerchantQuoteConfirmationResponse
} from "@/lib/api/merchant-api";

export type QuoteDraft = {
  finalAmount: string;
  confirmedServiceTime: string;
  merchantNote: string;
  validUntil: string;
};

const emptyQuoteDraft: QuoteDraft = {
  finalAmount: "",
  confirmedServiceTime: "",
  merchantNote: "",
  validUntil: ""
};

export default function MerchantOrderRequestsBoard() {
  const t = useTranslations("MerchantOrderRequests");
  const [items, setItems] = useState<MerchantCandidateItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuoteDraft>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");

  async function loadRequests(active = true) {
    setLoading(true);
    const result = await getJson<MerchantOrderRequestsResponse>("/api/merchant/order-requests");
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      setItems([]);
      return;
    }
    setMessage("");
    const nextItems = result.data.list || [];
    setItems(nextItems);
    setDrafts((current) => {
      const next = { ...current };
      nextItems.forEach((item) => {
        const id = String(item.candidateId);
        if (!next[id]) {
          next[id] = emptyQuoteDraft;
        }
      });
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadRequests(active);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  async function submitQuote(item: MerchantCandidateItem) {
    const id = String(item.candidateId);
    const draft = drafts[id];
    const amount = Number(draft?.finalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessageTone("error");
      setMessage(t("amountRequired"));
      return;
    }
    if (!draft?.confirmedServiceTime) {
      setMessageTone("error");
      setMessage(t("timeRequired"));
      return;
    }

    setSubmittingId(id);
    setMessage("");
    const result = await postJson<MerchantQuoteConfirmationResponse>(
      `/api/merchant/order-requests/${encodeURIComponent(id)}/quote-confirmation`,
      {
        finalAmount: amount,
        confirmedServiceTime: draft.confirmedServiceTime,
        merchantNote: draft.merchantNote.trim() || undefined,
        validUntil: draft.validUntil || undefined
      }
    );
    setSubmittingId(null);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }
    setMessageTone("info");
    setMessage(t("submitted"));
    void loadRequests();
  }

  return (
    <div className="mt-4 space-y-3">
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

      {!loading && !items.length ? (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {t("empty")}
        </div>
      ) : null}

      {items.map((item) => {
        const id = String(item.candidateId);
        const draft = drafts[id] || emptyQuoteDraft;

        return (
          <MerchantOrderRequestCard
            draft={draft}
            item={item}
            key={id}
            submitting={submittingId === id}
            t={t}
            onDraftChange={(nextDraft) =>
              setDrafts((current) => ({
                ...current,
                [id]: nextDraft
              }))
            }
            onSubmit={() => submitQuote(item)}
          />
        );
      })}
    </div>
  );
}
