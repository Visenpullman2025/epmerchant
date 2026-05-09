import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantOrderRequestDetail from "@/components/merchant/MerchantOrderRequestDetail";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";

type Props = {
  params: Promise<{ locale: string; candidateId: string }>;
};

export default async function MerchantOrderRequestDetailPage({ params }: Props) {
  const { locale, candidateId } = await params;
  const t = await getTranslations("MerchantOrderRequests");

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={t("detailTitle")}
      titleAction={
        <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/order-requests`}>
          {t("backToList")}
        </Link>
      }
    >
      <MerchantOrderRequestDetail candidateId={candidateId} />
    </MerchantScaffold>
  );
}
