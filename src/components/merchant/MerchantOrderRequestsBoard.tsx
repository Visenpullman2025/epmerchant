"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MerchantOrderRequestCard from "@/components/merchant/MerchantOrderRequestCard";
import { getJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCandidateItem,
  MerchantOrderRequestsResponse,
  LocaleCode
} from "@/lib/api/merchant-api";

export default function MerchantOrderRequestsBoard() {
  const locale = useLocale() as LocaleCode;
  const t = useTranslations("MerchantOrderRequests");
  const [items, setItems] = useState<MerchantCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    setItems(result.data.list || []);
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

        return (
          <MerchantOrderRequestCard
            detailHref={`/${locale}/merchant/order-requests/${encodeURIComponent(id)}`}
            item={item}
            key={id}
            locale={locale}
            t={t}
          />
        );
      })}
    </div>
  );
}
