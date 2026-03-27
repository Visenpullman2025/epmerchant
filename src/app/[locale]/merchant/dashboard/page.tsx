import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import { buildBackendUrl } from "@/lib/api/backend";
import type {
  ApiError,
  ApiSuccess,
  MerchantOrderItem,
  MerchantOrdersResponse,
  MerchantProfileResponse,
  MerchantServiceProjectItem,
  MerchantServicesResponse
} from "@shared/api/contracts/merchant-api";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantDashboard");
  const token = (await cookies()).get("merchant_token")?.value;
  let verificationStatus: "unsubmitted" | "pending" | "approved" | "rejected" = "unsubmitted";
  let serviceList: MerchantServiceProjectItem[] = [];
  let orderList: MerchantOrderItem[] = [];
  let boundServiceCategories: MerchantProfileResponse["boundServiceCategories"] = [];

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
    const [profile, services, orders] = await Promise.all([
      fetchMerchant<MerchantProfileResponse>("/api/v1/merchant/profile"),
      fetchMerchant<MerchantServicesResponse>("/api/v1/merchant/services"),
      fetchMerchant<MerchantOrdersResponse>("/api/v1/merchant/orders?page=1&pageSize=100")
    ]);
    verificationStatus = profile?.verification?.status || "unsubmitted";
    boundServiceCategories = profile?.boundServiceCategories || [];
    serviceList = services?.list || [];
    orderList = orders?.list || [];
  }

  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter(
    (item) => item.status === "new" || item.status === "pending"
  ).length;
  const completedRevenue = orderList
    .filter((item) => item.status === "done")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalServices = serviceList.length;
  const publishedServices = serviceList.filter((item) => item.status !== "draft").length;
  const hiddenServices = serviceList.filter((item) => item.isOpen === false).length;

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

        <article className="apple-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t("identityTitle")}</h2>
            <span
              className="merchant-status-chip"
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
              {verificationStatus === "approved"
                ? t("verified")
                : verificationStatus === "rejected"
                  ? t("rejected")
                  : verificationStatus === "pending"
                    ? t("pending")
                    : t("unsubmitted")}
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {verificationStatus === "approved"
              ? t("identityDesc")
              : verificationStatus === "rejected"
                ? t("identityRejectedDesc")
                : verificationStatus === "pending"
                  ? t("identityPendingDesc")
                  : t("identityUnsubmittedDesc")}
          </p>
          <div className="mt-3 flex gap-2">
            <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/profile`}>
              {t("viewIdentity")}
            </Link>
            <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/profile`}>
              {t("updateDocuments")}
            </Link>
          </div>
        </article>

        <article className="apple-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t("serviceTitle")}</h2>
            <span className="merchant-status-chip" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 18%, transparent)", color: "var(--primary)" }}>
              {t("serviceSummary", { count: totalServices })}
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t("serviceDesc")}
          </p>
          <div className="merchant-kpi mt-4">
            <div className="merchant-kpi-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("publishedCount")}
              </p>
              <p className="mt-1 text-lg font-semibold">{publishedServices}</p>
            </div>
            <div className="merchant-kpi-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("hiddenCount")}
              </p>
              <p className="mt-1 text-lg font-semibold">{hiddenServices}</p>
            </div>
            <div className="merchant-kpi-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("boundCategories")}
              </p>
              <p className="mt-1 text-lg font-semibold">{boundServiceCategories.length}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(boundServiceCategories || []).map((service, index) => (
              <span
                className="merchant-status-chip"
                key={service.code}
                style={{
                  backgroundColor: index === 0 ? "#e8f2ff" : index === 1 ? "#e9f9f0" : "#f2ecff",
                  color: index === 0 ? "#2256c5" : index === 1 ? "#0f8f4c" : "#6542cf"
                }}
              >
                {service.name}
              </span>
            ))}
          </div>
          <Link className="apple-btn-primary mt-3 inline-flex items-center justify-center" href={`/${locale}/merchant/services`}>
            {t("manageServices")}
          </Link>
        </article>

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
