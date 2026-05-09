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
      footer={<MerchantBottomNav locale={locale} />}
      title={t("title")}
    >
      <MerchantCreditProfilePanel />
    </MerchantScaffold>
  );
}
