"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getJson } from "@/lib/merchant/auth-client";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantProfileMenuRow from "@/components/merchant/MerchantProfileMenuRow";
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
    <main className="app-page-bg" style={{ minHeight: "100vh", paddingBottom: 110 }}>
      {/* 暗金 hero + 店徽 + 店名 + 4 数字 */}
      <section
        style={{
          position: "relative",
          padding: "20px 20px 28px",
          background:
            "linear-gradient(160deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%)",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            background: "radial-gradient(circle, rgba(230,207,149,0.4), transparent 65%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, var(--brand-accent), var(--brand-accent-deep))",
              color: "var(--brand-primary-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {(merchantName || "·").slice(0, 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.015em",
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {merchantName || "—"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.85 }}>
              {phone || "—"} · <span style={{ color: "var(--brand-accent-light)" }}>{verificationLabel}</span>
            </p>
          </div>
        </div>

        {/* 4 数字（评分/接单/范围/粉丝 — 没数据先占位）*/}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginTop: 16,
            position: "relative",
          }}
        >
          <Stat n={balanceDisplay ?? "—"} l="余额" />
          <Stat n="—" l="评分" />
          <Stat n="—" l="接单" />
          <Stat n="—" l="粉丝" />
        </div>
      </section>

      <div className="merchant-profile-page space-y-4" style={{ padding: "14px 16px 0" }}>
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
            <section className="merchant-profile-summary">
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
            </section>

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
                    title={t("menuWallet")}
                  />
                  <MerchantProfileMenuRow
                    feature="flow"
                    glyphColor={THAI_RED}
                    href={`/${locale}/merchant/credit-profile`}
                    title={t("menuCredit")}
                  />
                </div>
              </div>

              <div>
                <p className="merchant-profile-menu-section-title">{t("sectionOrders")}</p>
                <div className="merchant-profile-menu-panel">
                  <MerchantProfileMenuRow
                    feature="orders"
                    glyphColor={THAI_BLUE}
                    href={`/${locale}/merchant/orders?status=done`}
                    title={t("menuOrderHistory")}
                  />
                  <MerchantProfileMenuRow
                    feature="services"
                    glyphColor={THAI_RED}
                    href={`/${locale}/merchant/capabilities`}
                    title={t("menuServices")}
                  />
                  <MerchantProfileMenuRow
                    feature="flow"
                    glyphColor={THAI_BLUE}
                    href={`/${locale}/merchant/square`}
                    title={t("menuMessages")}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <MerchantBottomNav locale={locale} />
    </main>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 17,
          color: "var(--brand-accent-light)",
          letterSpacing: "-0.01em",
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{l}</div>
    </div>
  );
}
