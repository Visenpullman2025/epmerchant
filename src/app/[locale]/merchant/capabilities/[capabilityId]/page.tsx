import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantCapabilityEditor from "@/components/merchant/MerchantCapabilityEditor";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";

type Props = {
  params: Promise<{ locale: string; capabilityId: string }>;
};

export default async function MerchantCapabilityDetailPage({ params }: Props) {
  const { locale, capabilityId } = await params;
  const t = await getTranslations("MerchantCapabilities");

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={capabilityId === "new" ? t("createTitle") : t("editTitle")}
      titleAction={
        <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/capabilities`}>
          {t("backToList")}
        </Link>
      }
    >
      <MerchantCapabilityEditor capabilityId={capabilityId} />
    </MerchantScaffold>
  );
}
