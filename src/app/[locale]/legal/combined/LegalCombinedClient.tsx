'use client';

import { useRouter } from 'next/navigation';
import { LegalCombinedView, type LegalCombinedViewDoc } from '@/components/legal/LegalCombinedView';
import { localeHref } from '@/lib/typed-routes';

// 商家端独立 sessionStorage key，避免与 ep（用户端）冲突。
const CONSENT_STORAGE_KEY = 'expath.merchant.pending_consent';

export function LegalCombinedClient({
  title,
  agreeLabel,
  checkboxLabel,
  docs,
  role,
  nextPath,
  locale,
}: {
  title: string;
  agreeLabel: string;
  checkboxLabel: string;
  docs: LegalCombinedViewDoc[];
  role?: 'user' | 'merchant';
  nextPath: string | null;
  locale: string;
}) {
  const router = useRouter();
  const effectiveRole: 'user' | 'merchant' = role ?? 'merchant';

  async function handleAgree(versions: Array<{ code: string; version: string }>) {
    sessionStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ versions, role: effectiveRole, accepted_at: new Date().toISOString() }),
    );
    router.replace(localeHref(nextPath ?? `/${locale}/merchant/register`));
  }

  return (
    <LegalCombinedView
      title={title}
      agreeLabel={agreeLabel}
      checkboxLabel={checkboxLabel}
      docs={docs}
      onAgree={handleAgree}
    />
  );
}
