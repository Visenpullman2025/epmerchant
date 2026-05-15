import { notFound } from 'next/navigation';
import { readLegalDoc, LEGAL_DOC_CODES_MERCHANT } from '@/lib/legal';
import { LegalDocRenderer } from '@/components/legal/LegalDocRenderer';

export const dynamic = 'force-static';

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  if (!(LEGAL_DOC_CODES_MERCHANT as readonly string[]).includes(doc)) {
    notFound();
  }
  const { meta, body } = readLegalDoc(doc, locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">{meta.title}</h1>
      <p className="mb-4 text-xs text-foreground-muted">
        版本 v{meta.version} · {meta.updated_at}
      </p>
      <LegalDocRenderer body={body} />
    </main>
  );
}
