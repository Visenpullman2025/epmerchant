"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { clampListLimitParam } from "@/lib/api/limits";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantWalletRecordsResponse,
  MerchantWalletSummaryResponse,
  MerchantWithdrawResponse
} from "@/lib/api/merchant-api";

export default function MerchantWalletPage() {
  const t = useTranslations("MerchantWallet");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const [withdrawAmount, setWithdrawAmount] = useState("2000");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<MerchantWalletSummaryResponse | null>(null);
  const [records, setRecords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadWallet() {
      const [summaryResult, recordsResult] = await Promise.all([
        getJson<MerchantWalletSummaryResponse>("/api/merchant/wallet"),
        getJson<MerchantWalletRecordsResponse>(
          `/api/merchant/wallet/records?page=1&pageSize=${clampListLimitParam("10")}`
        )
      ]);
      if (!active) return;
      if (summaryResult.ok) {
        setSummary(summaryResult.data);
      } else {
        setMessage(summaryResult.message);
      }
      if (recordsResult.ok) {
        setRecords(
          recordsResult.data.list.map(
            (item) => `${item.type === "income" ? "+" : "-"} ${item.amount} · ${item.referenceNo}`
          )
        );
      }
    }
    loadWallet();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmitWithdraw() {
    setSubmitting(true);
    const result = await postJson<MerchantWithdrawResponse>("/api/merchant/wallet/withdraw", {
      amount: withdrawAmount
    });
    setSubmitting(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(`${t("submitted")} #${result.data.referenceNo}`);
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-dashboard-hero.svg"
      subtitle={t("subtitle")}
      title={t("title")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("settlement")}</span>}
    >
      <div className="mt-4 space-y-3">
        {message ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {message}
          </div>
        ) : null}
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {t("balance")}
          </p>
          <p className="mt-1 text-2xl font-semibold">{summary?.balance || "-"}</p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold">{t("withdraw")}</p>
          <label className="field-label mt-2">{t("amount")}</label>
          <input className="field-input" onChange={(e) => setWithdrawAmount(e.target.value)} value={withdrawAmount} />
          <button className="apple-btn-primary mt-3 w-full" onClick={onSubmitWithdraw} type="button">
            {submitting ? t("submitting") : t("submit")}
          </button>
        </div>
        <div className="rounded-xl border p-3" id="wallet-records" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold">{t("recentRecords")}</p>
          <ul className="mt-2 space-y-2 text-sm" style={{ color: "var(--muted)" }}>
            {records.length ? (
              records.map((record) => <li key={record}>{record}</li>)
            ) : (
              <li>{t("noRecords")}</li>
            )}
          </ul>
        </div>
      </div>
    </MerchantScaffold>
  );
}
