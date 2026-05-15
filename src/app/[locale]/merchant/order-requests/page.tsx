import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantOrderRequestsBoard from "@/components/merchant/MerchantOrderRequestsBoard";
import { MAX_LIST_LIMIT } from "@/lib/api/limits";
import type { MerchantOrderItem, MerchantOrdersResponse } from "@/lib/api/merchant-api";
import { getMerchantBffJson } from "@/lib/api/merchant-server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantOrderRequestsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantOrderRequests");

  const orders = await getMerchantBffJson<MerchantOrdersResponse>(
    `/orders?page=1&pageSize=${MAX_LIST_LIMIT}`
  ).catch(() => null);
  const orderList: MerchantOrderItem[] = orders?.list || [];

  const completedTotal = orderList.filter((o) => o.status === "done").length;
  const inService = orderList.filter((o) => o.status === "inService").length;
  const monthRevenue = orderList
    .filter((o) => o.status === "done")
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const winRate = orderList.length > 0
    ? Math.round(((completedTotal + inService) / Math.max(orderList.length, 1)) * 100)
    : 0;

  return (
    <main className="app-page-bg" style={{ minHeight: "100vh", paddingBottom: 110 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.015em",
          }}
        >
          {t("title") || "运营中心"}
        </h1>
        <Link
          href={`/${locale}/merchant/wallet`}
          style={{ fontSize: 14, color: "var(--brand-primary)", fontWeight: 600, textDecoration: "none" }}
        >
          数据 →
        </Link>
      </div>

      <section
        style={{
          margin: "14px 16px 0",
          padding: 16,
          background:
            "linear-gradient(160deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%)",
          color: "#fff",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            background: "radial-gradient(circle, rgba(230,207,149,0.4), transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            fontSize: 11,
            opacity: 0.78,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            position: "relative",
          }}
        >
          本月收益
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 28,
            marginTop: 4,
            letterSpacing: "-0.02em",
            position: "relative",
          }}
        >
          ฿ {monthRevenue.toLocaleString()}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 14,
            position: "relative",
          }}
        >
          <OpsMini n={completedTotal} l="服务完成" />
          <OpsMini n="—" l="平均评分" />
          <OpsMini n={`${winRate}%`} l="中标率" />
        </div>
      </section>

      <section style={{ padding: "14px 16px 0" }}>
        <MerchantOrderRequestsBoard />
      </section>

      <MerchantBottomNav locale={locale} />
    </main>
  );
}

function OpsMini({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 17,
          color: "var(--brand-accent-light)",
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{l}</div>
    </div>
  );
}
