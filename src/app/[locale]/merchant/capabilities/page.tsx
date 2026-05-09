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
      footer={<MerchantBottomNav locale={locale} />}
      title={t("title")}
    >
      <MerchantCapabilityManager />
    </MerchantScaffold>
  );
}
