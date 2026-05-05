import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantAvailabilityCalendar from "@/components/merchant/MerchantAvailabilityCalendar";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import { MAX_LIST_LIMIT } from "@/lib/api/limits";
import type { MerchantOrderItem, MerchantOrdersResponse } from "@/lib/api/merchant-api";
import { getMerchantBffJson } from "@/lib/api/merchant-server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantDashboard");
  const orders = await getMerchantBffJson<MerchantOrdersResponse>(
    `/orders?page=1&pageSize=${MAX_LIST_LIMIT}`
  );
  const orderList: MerchantOrderItem[] = orders?.list || [];

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
            <Link className="apple-btn-primary inline-flex items-center justify-center" href={`/${locale}/merchant/order-requests`}>
              {t("goOrderCenter")}
            </Link>
            <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/capabilities`}>
              {t("manageCapabilities")}
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
