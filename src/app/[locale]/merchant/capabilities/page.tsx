import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantCapabilityManager from "@/components/merchant/MerchantCapabilityManager";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantCapabilitiesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantCapabilities");

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
          {t("title") || "服务能力"}
        </h1>
        <Link
          href={`/${locale}/merchant/capabilities/new`}
          style={{
            fontSize: 14,
            color: "var(--brand-primary)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          + 添加
        </Link>
      </div>

      {/* 现有 CapabilityManager 保留：内部样式靠 globals.css token 自动跟着暗金 */}
      <section style={{ padding: "12px 16px 0" }} className="app-reveal">
        <MerchantCapabilityManager />
      </section>

      {/* 服务模板库入口（指向新建能力页，复用其标准服务选择步骤）*/}
      <Link
        href={`/${locale}/merchant/capabilities/new` as `/${string}`}
        style={{
          margin: "14px 16px 0",
          padding: 14,
          background: "#fff",
          border: "1px dashed var(--brand-accent)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: "var(--ink-900)",
        }}
      >
        <span style={{ fontSize: 22 }}>📚</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>服务模板库</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
            从平台标准服务挑一个复制到我的能力
          </span>
        </span>
        <span style={{ color: "var(--brand-primary)", fontWeight: 700 }}>→</span>
      </Link>

      <MerchantBottomNav locale={locale} />
    </main>
  );
}
