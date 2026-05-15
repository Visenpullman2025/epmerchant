import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const LEGAL_DOC_CODES_USER = [
  'privacy-policy',
  'terms-of-service',
  'community-guidelines',
  'ugc-reporting',
] as const;

export const LEGAL_DOC_CODES_MERCHANT = [
  ...LEGAL_DOC_CODES_USER,
  'merchant-agreement',
] as const;

export type LegalDocCode = (typeof LEGAL_DOC_CODES_MERCHANT)[number];
export type LegalRole = 'user' | 'merchant';

export interface LegalDocMeta {
  doc_code: string;
  title: string;
  version: string;
  locale: string;
  updated_at: string;
}

export interface LegalDoc {
  code: string;
  meta: LegalDocMeta;
  body: string;
}

const LEGAL_ROOT = path.resolve(process.cwd(), '../ep-shared/legal');
const FALLBACK_LOCALE = 'zh';

export function readLegalDoc(code: string, locale: string): LegalDoc {
  const primary = path.join(LEGAL_ROOT, code, `${locale}.md`);
  const filePath = fs.existsSync(primary)
    ? primary
    : path.join(LEGAL_ROOT, code, `${FALLBACK_LOCALE}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { code, meta: data as LegalDocMeta, body: content };
}

export function readAllLegalDocs(locale: string, role: LegalRole): LegalDoc[] {
  const codes =
    role === 'merchant' ? LEGAL_DOC_CODES_MERCHANT : LEGAL_DOC_CODES_USER;
  return codes.map((code) => readLegalDoc(code, locale));
}

export function readGlobalVersion(): {
  current_version: string;
  released_at: string;
} {
  const filePath = path.join(LEGAL_ROOT, 'VERSION.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  return data as { current_version: string; released_at: string };
}
