"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getJson } from "@/lib/merchant/auth-client";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantProfileMenuRow from "@/components/merchant/MerchantProfileMenuRow";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type { MerchantProfileResponse, MerchantWalletSummaryResponse } from "@/lib/api/merchant-api";

const THAI_RED = "var(--thai-red)";
const THAI_BLUE = "var(--thai-blue)";

export default function MerchantProfileHubPage() {
  const t = useTranslations("MerchantProfile");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "unsubmitted" | "pending" | "approved" | "rejected"
  >("unsubmitted");
  const [balanceDisplay, setBalanceDisplay] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const [profileRes, walletRes] = await Promise.all([
        getJson<MerchantProfileResponse>("/api/merchant/profile"),
        getJson<MerchantWalletSummaryResponse>("/api/merchant/wallet")
      ]);
      if (!active) return;
      setLoading(false);
      if (!profileRes.ok) {
        setMessage(profileRes.message);
        return;
      }
      setMessage("");
      setMerchantName(profileRes.data.merchantName);
      setPhone(profileRes.data.contactPhone);
      setVerificationStatus(profileRes.data.verification?.status || "unsubmitted");
      if (walletRes.ok) {
        setBalanceDisplay(walletRes.data.balance);
      } else {
        setBalanceDisplay(null);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const verificationLabel =
    verificationStatus === "approved"
      ? t("verified")
      : verificationStatus === "rejected"
        ? t("rejected")
        : verificationStatus === "pending"
          ? t("pending")
          : t("unsubmitted");

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle=""
      title={t("hubTitle")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("settings")}</span>}
    >
      <div className="mt-4 space-y-5">
        {message ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            {message}
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : (
          <>
            <article className="merchant-profile-hub-surface">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight">{merchantName || "—"}</h2>
                  <p className="mt-0.5 truncate text-sm" style={{ color: "var(--muted)" }}>
                    {phone || "—"}
                  </p>
                </div>
                <span
                  className="merchant-status-chip mt-2 shrink-0 self-start sm:mt-0"
                  style={{
                    backgroundColor:
                      verificationStatus === "approved"
                        ? "var(--ok)"
                        : verificationStatus === "rejected"
                          ? "var(--danger)"
                          : verificationStatus === "pending"
                            ? "var(--warn)"
                            : "#eef2ff",
                    color: verificationStatus === "unsubmitted" ? "#5f6e8f" : "#fff"
                  }}
                >
                  {verificationLabel}
                </span>
              </div>
              <div className="mt-4 border-t pt-4" style={{ borderColor: "color-mix(in srgb, var(--border) 70%, transparent)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>
                  {t("balancePreviewTitle")}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--primary)" }}>
                  ฿ {balanceDisplay ?? t("balanceUnavailable")}
                </p>
              </div>
            </article>

            <div className="space-y-3">
              <div>
                <p className="merchant-profile-menu-section-title">{t("sectionAccount")}</p>
                <div className="merchant-profile-menu-panel">
                  <MerchantProfileMenuRow
                    feature="info"
                    glyphColor={THAI_RED}
                    href={`/${locale}/merchant/profile/info`}
                    title={t("menuInfo")}
                  />
                  <MerchantProfileMenuRow
                    feature="verification"
                    glyphColor={THAI_BLUE}
                    href={`/${locale}/merchant/profile/verification`}
                    title={t("menuVerification")}
                  />
                  <MerchantProfileMenuRow
                    feature="settings"
                    glyphColor={THAI_RED}
                    href={`/${locale}/merchant/profile/settings`}
                    title={t("menuSettings")}
                  />
                </div>
              </div>

              <div>
                <p className="merchant-profile-menu-section-title">{t("sectionFunds")}</p>
                <div className="merchant-profile-menu-panel">
                  <MerchantProfileMenuRow
                    feature="balance"
                    glyphColor={THAI_BLUE}
                    href={`/${locale}/merchant/wallet`}
                    title={t("menuBalance")}
                  />
                  <MerchantProfileMenuRow
                    feature="flow"
                    glyphColor={THAI_RED}
                    href={`/${locale}/merchant/credit-profile`}
                    title={t("menuCredit")}
                  />
                  <MerchantProfileMenuRow
                    feature="flow"
                    glyphColor={THAI_BLUE}
                    href={`/${locale}/merchant/wallet#wallet-records`}
                    title={t("menuFlow")}
                  />
                </div>
              </div>

              <div>
                <p className="merchant-profile-menu-section-title">{t("sectionOrders")}</p>
                <div className="merchant-profile-menu-panel">
                  <MerchantProfileMenuRow
                    feature="orders"
                    glyphColor={THAI_BLUE}
                    href={`/${locale}/merchant/order-requests`}
                    title={t("menuOrders")}
                  />
                  <MerchantProfileMenuRow
                    feature="services"
                    glyphColor={THAI_RED}
                    href={`/${locale}/merchant/capabilities`}
                    title={t("menuServices")}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MerchantScaffold>
  );
}
