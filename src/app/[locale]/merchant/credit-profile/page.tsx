import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantCreditProfilePanel from "@/components/merchant/MerchantCreditProfilePanel";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantCreditProfilePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantCreditProfile");

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle={t("subtitle")}
      title={t("title")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("readonly")}</span>}
    >
      <MerchantCreditProfilePanel />
    </MerchantScaffold>
  );
}
