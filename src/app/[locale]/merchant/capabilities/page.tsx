import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantCapabilityManager from "@/components/merchant/MerchantCapabilityManager";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantCapabilitiesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantCapabilities");

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle={t("subtitle")}
      title={t("title")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("live")}</span>}
    >
      <MerchantCapabilityManager />
    </MerchantScaffold>
  );
}
