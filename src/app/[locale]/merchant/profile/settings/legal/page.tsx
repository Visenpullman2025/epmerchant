import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { readAllLegalDocs, readGlobalVersion } from '@/lib/legal';
import MerchantScaffold from '@/components/merchant/MerchantScaffold';
import { localeHref } from '@/lib/typed-routes';

export const dynamic = 'force-static';

export default async function MerchantSettingsLegalListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SettingsLegal' });
  // 商家端默认展示 5 篇（含 merchant-agreement）。
  const docs = readAllLegalDocs(locale, 'merchant');
  const version = readGlobalVersion();

  return (
    <MerchantScaffold
      title={t('title')}
      titleAction={
        <Link
          className="apple-btn-secondary inline-flex items-center justify-center"
          href={`/${locale}/merchant/profile/settings`}
        >
          {t('back')}
        </Link>
      }
    >
      <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
        {t('currentVersion', { version: version.current_version, date: version.released_at })}
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)' }}>
        {docs.map((d, i) => (
          <Link
            key={d.code}
            href={localeHref(`/${locale}/legal/${d.code}`)}
            className={`flex min-h-12 items-center justify-between px-4 py-3 text-base font-medium ${i > 0 ? 'border-t' : ''}`}
            style={i > 0 ? { borderTopColor: 'var(--border)' } : undefined}
          >
            <span>
              {d.meta.title}
              {d.code === 'merchant-agreement' ? (
                <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>
                  （商家适用）
                </span>
              ) : null}
            </span>
            <span style={{ color: 'var(--muted)' }}>›</span>
          </Link>
        ))}
      </div>
    </MerchantScaffold>
  );
}
