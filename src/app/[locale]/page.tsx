import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/components/merchant/LocaleSwitcher";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("MerchantHome");

  return (
    <main className="app-shell">
      <header className="merchant-topbar">
        <span className="merchant-brand">Expatth Merchant</span>
        <LocaleSwitcher />
      </header>
      <section className="merchant-hero">
        <Image
          alt={t("heroAlt")}
          height={432}
          priority
          src="/images/merchant-auth-hero.svg"
          width={720}
        />
      </section>
      <section className="apple-card">
        <h1 className="merchant-page-title">{t("title")}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {t("subtitle")}
        </p>
        <div className="mt-4 flex gap-2">
          <Link className="apple-btn-primary inline-flex items-center" href={`/${locale}/merchant/login`}>
            {t("login")}
          </Link>
          <Link className="apple-btn-secondary inline-flex items-center" href={`/${locale}/merchant/register`}>
            {t("register")}
          </Link>
        </div>
      </section>
    </main>
  );
}
