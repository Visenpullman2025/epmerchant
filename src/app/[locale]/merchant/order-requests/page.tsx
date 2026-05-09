import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantOrderRequestsBoard from "@/components/merchant/MerchantOrderRequestsBoard";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MerchantOrderRequestsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantOrderRequests");

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={t("title")}
    >
      <MerchantOrderRequestsBoard />
    </MerchantScaffold>
  );
}
