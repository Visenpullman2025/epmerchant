import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantOrderRequestDetail from "@/components/merchant/MerchantOrderRequestDetail";

type Props = {
  params: Promise<{ locale: string; candidateId: string }>;
};

export default async function MerchantOrderRequestDetailPage({ params }: Props) {
  const { locale, candidateId } = await params;
  const t = await getTranslations("MerchantOrderRequests");

  return (
    <main className="app-page-bg" style={{ minHeight: "100vh", paddingBottom: 110 }}>
      {/* 顶栏 */}
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
          gap: 12,
        }}
      >
        <Link
          href={`/${locale}/merchant/order-requests`}
          style={{
            fontSize: 17,
            color: "var(--brand-primary)",
            textDecoration: "none",
          }}
          aria-label={t("backToList") || "返回"}
        >
          ←
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 700,
            margin: 0,
            flex: 1,
            textAlign: "center",
            letterSpacing: "-0.015em",
            marginRight: 32,
          }}
        >
          {t("detailTitle")}
        </h1>
      </div>

      {/* 状态条：竞价中 */}
      <div
        style={{
          margin: "14px 16px 0",
          padding: "12px 16px",
          background:
            "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.05))",
          border: "1px solid rgba(201,169,110,0.3)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--brand-accent)",
            color: "var(--brand-primary-deep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          🔔
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-900)" }}>
            竞价中 · 你被平台推送给客户
          </div>
          <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
            报价后等平台 1-2 小时内综合评估
          </div>
        </div>
      </div>

      <section style={{ padding: "12px 16px 0" }} className="app-reveal">
        <MerchantOrderRequestDetail candidateId={candidateId} />
      </section>

      <p
        style={{
          margin: "20px 16px 0",
          padding: "12px 14px",
          background: "rgba(138, 106, 37, 0.04)",
          borderRadius: 10,
          fontSize: 11,
          color: "var(--gray-700)",
          lineHeight: 1.65,
        }}
      >
        <b style={{ color: "var(--brand-primary)" }}>平台 / AI 评估</b>：客户发单后 1-2 小时内，平台会综合价格、距离、评分、信用、历史完成率选出一家商家中标。中标者会收到通知并进入"接单 / 出发 / 抵达 / 服务 / 完成"5 段流程；其他候选商家收到落选通知，候选关闭。
      </p>

      <MerchantBottomNav locale={locale} />
    </main>
  );
}
