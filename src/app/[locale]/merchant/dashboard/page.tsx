import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import MerchantAvailabilityCalendar from "@/components/merchant/MerchantAvailabilityCalendar";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import { buildBackendUrl } from "@/lib/api/backend";
import type { ApiError, ApiSuccess, MerchantOrderItem, MerchantOrdersResponse } from "@shared/api/contracts/merchant-api";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantDashboard");
  const token = (await cookies()).get("merchant_token")?.value;
  let orderList: MerchantOrderItem[] = [];

  async function fetchMerchant<T>(path: string): Promise<T | null> {
    if (!token) return null;
    const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
    const upstream = await fetch(buildBackendUrl(path), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
      },
      cache: "no-store"
    });
    if (!upstream.ok) {
      return null;
    }
    const payload = (await upstream.json()) as ApiSuccess<T> | ApiError;
    if (!("data" in payload)) {
      return null;
    }
    return payload.data;
  }

  if (token) {
    const orders = await fetchMerchant<MerchantOrdersResponse>("/api/v1/merchant/orders?page=1&pageSize=100");
    orderList = orders?.list || [];
  }

  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter(
    (item) => item.status === "new" || item.status === "pending"
  ).length;
  const completedRevenue = orderList
    .filter((item) => item.status === "done")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <main className="app-shell">
      <header className="merchant-topbar">
        <span className="merchant-brand">{t("brand")}</span>
        <span className="merchant-status-chip" style={{ backgroundColor: "var(--ok)", color: "#fff" }}>
          {t("online")}
        </span>
      </header>

      <section className="merchant-hero">
        <Image
          alt={t("heroAlt")}
          height={432}
          priority
          src="/images/merchant-dashboard-hero.svg"
          width={720}
        />
      </section>

      <section className="merchant-grid">
        <article className="apple-card">
          <h1 className="merchant-page-title">{t("title")}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t("subtitle")}
          </p>
          <div className="merchant-kpi mt-4">
            <div className="merchant-kpi-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("totalOrders")}
              </p>
              <p className="mt-1 text-lg font-semibold">{totalOrders}</p>
            </div>
            <div className="merchant-kpi-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("pendingConfirm")}
              </p>
              <p className="mt-1 text-lg font-semibold">{pendingOrders}</p>
            </div>
            <div className="merchant-kpi-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("completedRevenue")}
              </p>
              <p className="mt-1 text-lg font-semibold">฿ {completedRevenue.toLocaleString()}</p>
            </div>
          </div>
        </article>

        <MerchantAvailabilityCalendar locale={locale} />

        <article className="apple-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t("onlineOrderTitle")}</h2>
            <span
              className="merchant-status-chip"
              style={{
                backgroundColor: pendingOrders > 0 ? "var(--warn)" : "#eef2ff",
                color: pendingOrders > 0 ? "#fff" : "#5f6e8f"
              }}
            >
              {pendingOrders > 0 ? t("pendingConfirm") : t("noPendingOrders")}
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {totalOrders > 0 ? t("onlineOrderDesc") : t("onlineOrderEmptyDesc")}
          </p>
          <div className="mt-3 flex gap-2">
            <Link className="apple-btn-primary inline-flex items-center justify-center" href={`/${locale}/merchant/orders`}>
              {t("goOrderCenter")}
            </Link>
            <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/orders`}>
              {t("pauseOrders")}
            </Link>
          </div>
        </article>
      </section>

      <div className="mt-4 flex gap-2">
        <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/status`}>
          {t("reviewStatus")}
        </Link>
        <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/profile`}>
          {t("editIdentity")}
        </Link>
      </div>
      <MerchantBottomNav locale={locale} />
    </main>
  );
}
