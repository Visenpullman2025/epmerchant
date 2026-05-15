import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import { MAX_LIST_LIMIT } from "@/lib/api/limits";
import type { MerchantOrderItem, MerchantOrdersResponse } from "@/lib/api/merchant-api";
import { getMerchantBffJson } from "@/lib/api/merchant-server";

type Props = {
  params: Promise<{ locale: string }>;
};

interface MerchantDisplayShape {
  name?: string;
  displayName?: string;
  storeName?: string;
  city?: string;
  ratingAverage?: number;
  rating?: number;
  capabilityCount?: number;
  servicesActive?: number;
  isVerified?: boolean;
}

interface MerchantMeResponse {
  merchant?: MerchantDisplayShape | null;
}

export default async function MerchantDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantDashboard");

  const [orders, me] = await Promise.all([
    getMerchantBffJson<MerchantOrdersResponse>(`/orders?page=1&pageSize=${MAX_LIST_LIMIT}`),
    getMerchantBffJson<MerchantMeResponse>(`/profile/me`).catch(() => null),
  ]);
  const orderList: MerchantOrderItem[] = orders?.list || [];

  const merchant = me?.merchant ?? null;
  const storeName =
    merchant?.storeName ?? merchant?.displayName ?? merchant?.name ?? "我的店铺";
  const cityLabel = merchant?.city ?? "芭提雅";
  const rating = merchant?.ratingAverage ?? merchant?.rating ?? 0;
  const capabilityCount = merchant?.capabilityCount ?? merchant?.servicesActive ?? 0;
  const isVerified = merchant?.isVerified ?? false;

  const todayNew = orderList.filter(
    (item) => item.status === "new" || item.status === "pending"
  ).length;
  const inProgress = orderList.filter((item) => item.status === "inService").length;
  const completedToday = orderList.filter((item) => item.status === "done").length;
  const monthRevenue = orderList
    .filter((item) => item.status === "done")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <main className="app-page-bg" style={{ minHeight: "100vh", paddingBottom: 110 }}>
      {/* HERO 暗金渐变 */}
      <section
        style={{
          position: "relative",
          padding: "14px 20px 28px",
          background:
            "linear-gradient(160deg, var(--brand-primary) 0%, var(--brand-primary-deep) 60%, var(--brand-primary) 100%)",
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
            width: 240,
            height: 240,
            background:
              "radial-gradient(circle, rgba(230, 207, 149, 0.4), transparent 65%)",
            borderRadius: "50%",
            filter: "blur(2px)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 220,
            height: 220,
            background:
              "radial-gradient(circle, rgba(94, 71, 21, 0.55), transparent 70%)",
            borderRadius: "50%",
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: "-0.025em",
              lineHeight: 1,
            }}
          >
            Merchant <span style={{ color: "var(--brand-accent-light)" }}>&amp;</span> Now
            <span style={{ color: "var(--brand-accent-light)" }}>.</span>
          </div>
          <Link
            href={`/${locale}/merchant/profile`}
            style={{ textDecoration: "none", color: "inherit", fontSize: 17, opacity: 0.85 }}
          >
            💬
          </Link>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "-0.02em",
            margin: "22px 0 4px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ color: "var(--brand-accent-light)" }}>{storeName}</span>
        </h1>
        <div
          style={{
            fontSize: 14,
            opacity: 0.85,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          {isVerified ? (
            <span
              style={{
                background: "rgba(201,169,110,0.22)",
                border: "1px solid rgba(201,169,110,0.4)",
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-accent-light)",
              }}
            >
              ✓ {t("verified") ?? "已认证商家"}
            </span>
          ) : null}
          <span
            style={{
              background: "rgba(201,169,110,0.22)",
              border: "1px solid rgba(201,169,110,0.4)",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--brand-accent-light)",
            }}
          >
            服务 {capabilityCount} 项
          </span>
          {rating > 0 ? (
            <>
              <span style={{ opacity: 0.6 }}>·</span>
              <span>{rating.toFixed(1)} ★</span>
            </>
          ) : null}
          <span style={{ opacity: 0.6 }}>·</span>
          <span>{cityLabel}</span>
        </div>
      </section>

      {/* 三宫格数字（运营指标，不 push 收益） */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          padding: "16px 8px",
          background: "#fff",
          margin: "-14px 16px 0",
          borderRadius: 14,
          boxShadow: "0 12px 32px rgba(94, 71, 21, 0.08)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <StatCell n={todayNew} label="今日新单" />
        <StatCell n={inProgress} label="进行中" />
        <StatCell n={completedToday} label="已完成" />
      </div>

      {/* 快捷管理 */}
      <section style={{ padding: "18px 20px 0" }}>
        <h2 style={sectionH2}>快捷管理</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 4,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "14px 6px",
            boxShadow: "var(--sh-sm)",
          }}
        >
          <QuickCell emoji="📅" label="开放时间" href={`/${locale}/merchant/dashboard#availability`} />
          <QuickCell emoji="🛠" label="服务能力" href={`/${locale}/merchant/capabilities`} />
          <QuickCell emoji="📄" label="资质年审" href={`/${locale}/merchant/profile/verification`} />
          <QuickCell emoji="⭐" label="信用档案" href={`/${locale}/merchant/credit-profile`} />
          <QuickCell emoji="💰" label="收款管理" href={`/${locale}/merchant/wallet`} />
        </div>
      </section>

      {/* 待办 */}
      <section style={{ padding: "18px 20px 0" }}>
        <div style={sectionTitleRow}>
          <h2 style={sectionH2}>📌 待办</h2>
          <Link href={`/${locale}/merchant/order-requests`} style={moreLink}>
            全部 →
          </Link>
        </div>
        <article
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "4px 0",
            boxShadow: "var(--sh-sm)",
          }}
        >
          {todayNew > 0 ? (
            <TodoRow
              icon="📝"
              text={`${todayNew} 张待报价订单`}
              meta="请尽快报价，提高中标率"
              href={`/${locale}/merchant/order-requests`}
            />
          ) : (
            <TodoRow
              icon="✨"
              text="暂无新派单"
              meta="保持在线，新单会推送过来"
              href={`/${locale}/merchant/order-requests`}
            />
          )}
          <TodoRow
            icon="⚠"
            text="资质年审 还有 12 天"
            meta="建议尽早上传新证书"
            href={`/${locale}/merchant/profile/verification`}
            warn
          />
          <TodoRow
            icon="💬"
            text="新消息"
            meta="客户 / 平台运营 / 报价反馈"
            href={`/${locale}/merchant/profile`}
          />
        </article>
      </section>

      {/* 本月对账（隐入式） */}
      <Link
        href={`/${locale}/merchant/wallet`}
        style={{
          margin: "20px 20px 0",
          padding: "12px 16px",
          background: "rgba(138, 106, 37, 0.04)",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textDecoration: "none",
          color: "var(--gray-700)",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <span>📊 本月对账 · 收入流水</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            color: "var(--brand-primary)",
            fontSize: 14,
            letterSpacing: "-0.01em",
          }}
        >
          ฿ {monthRevenue.toLocaleString()} →
        </span>
      </Link>

      <MerchantBottomNav locale={locale} />
    </main>
  );
}

const sectionH2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 17,
  fontWeight: 700,
  color: "var(--ink-900)",
  letterSpacing: "-0.015em",
  margin: "0 0 12px",
};

const sectionTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 12,
};

const moreLink: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--brand-primary)",
  textDecoration: "none",
};

function StatCell({ n, label }: { n: number; label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "0 4px",
        borderRight: "1px solid rgba(138, 106, 37, 0.08)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--brand-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "var(--gray-500)",
          marginTop: 4,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function QuickCell({ emoji, label, href }: { emoji: string; label: string; href: string }) {
  return (
    <Link
      href={href as `/${string}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "4px 0",
        textDecoration: "none",
        color: "var(--ink-900)",
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(138,106,37,0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
        }}
      >
        {emoji}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--gray-700)",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

function TodoRow({
  icon,
  text,
  meta,
  href,
  warn,
}: {
  icon: string;
  text: string;
  meta: string;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href as `/${string}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          background: warn
            ? "linear-gradient(135deg, rgba(214,139,31,0.18), rgba(214,139,31,0.08))"
            : "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(138,106,37,0.08))",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--ink-900)" }}>
        {text}
        <span
          style={{
            display: "block",
            marginTop: 2,
            fontSize: 11,
            color: "var(--gray-500)",
            fontWeight: 400,
          }}
        >
          {meta}
        </span>
      </span>
      <span style={{ color: "var(--brand-primary)", fontWeight: 700, fontSize: 14 }}>→</span>
    </Link>
  );
}
