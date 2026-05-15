import { getLocale } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import { SquareFeed } from "@/components/square/SquareFeed";
import { SquareFab } from "@/components/square/SquareFab";

export default async function MerchantSquarePage() {
  const locale = await getLocale();

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
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.015em",
            textAlign: "center",
          }}
        >
          广场
        </h1>
      </div>

      <SquareFeed initialTab="recommended" />

      <SquareFab href={`/${locale}/merchant/square/new`} />
      <MerchantBottomNav locale={locale} />
    </main>
  );
}
