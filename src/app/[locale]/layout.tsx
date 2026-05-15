import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { fetchBrandTokens, brandThemeCss } from "@/lib/brand-theme";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = (await import(`@/messages/${locale}.json`)).default;

  // 拉后端 publicSettings 的品牌色，注入 :root；失败 fallback 到 globals.css 默认暗金
  const brand = await fetchBrandTokens();
  const themeCss = brandThemeCss(brand);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {themeCss ? <style dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
      {children}
    </NextIntlClientProvider>
  );
}
