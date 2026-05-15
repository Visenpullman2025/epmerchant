import { getTranslations } from 'next-intl/server';
import { readAllLegalDocs } from '@/lib/legal';
import { LegalCombinedClient } from './LegalCombinedClient';

export const dynamic = 'force-static';

export default async function LegalCombinedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'LegalPage' });
  // 商家端永远展示 5 篇协议（user 4 篇 + merchant-agreement）。
  const docs = readAllLegalDocs(locale, 'merchant');
  const renderableDocs = docs.map((d) => ({
    code: d.code,
    title: d.meta.title,
    version: d.meta.version,
    body: d.body,
  }));

  return (
    <LegalCombinedClient
      title={t('combinedTitle')}
      agreeLabel={t('agreeButton')}
      checkboxLabel={t('agreeCheckbox')}
      docs={renderableDocs}
      role="merchant"
      nextPath={next ?? null}
      locale={locale}
    />
  );
}
