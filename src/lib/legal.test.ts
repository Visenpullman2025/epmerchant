import { describe, it, expect } from 'vitest';
import {
  readLegalDoc,
  readAllLegalDocs,
  readGlobalVersion,
  LEGAL_DOC_CODES_USER,
  LEGAL_DOC_CODES_MERCHANT,
} from './legal';

describe('legal lib', () => {
  it('readLegalDoc returns frontmatter and body', () => {
    const doc = readLegalDoc('privacy-policy', 'zh');
    expect(doc.code).toBe('privacy-policy');
    expect(doc.meta.doc_code).toBe('privacy-policy');
    expect(doc.meta.version).toBe('1.0');
    expect(doc.meta.locale).toBe('zh');
    expect(doc.body.length).toBeGreaterThan(100);
  });

  it('readAllLegalDocs(user) returns 4 docs', () => {
    const all = readAllLegalDocs('zh', 'user');
    expect(all.map((d) => d.code)).toEqual([...LEGAL_DOC_CODES_USER]);
    expect(all.length).toBe(4);
  });

  it('readAllLegalDocs(merchant) returns 5 docs', () => {
    const all = readAllLegalDocs('zh', 'merchant');
    expect(all.map((d) => d.code)).toEqual([...LEGAL_DOC_CODES_MERCHANT]);
    expect(all.length).toBe(5);
  });

  // merchant-specific assertion: merchant-agreement is the 5th doc
  it('readAllLegalDocs(merchant) includes merchant-agreement as the last doc', () => {
    const all = readAllLegalDocs('zh', 'merchant');
    expect(all[all.length - 1].code).toBe('merchant-agreement');
    expect(all[all.length - 1].meta.doc_code).toBe('merchant-agreement');
  });

  it('readGlobalVersion returns current_version', () => {
    const v = readGlobalVersion();
    expect(v.current_version).toBe('1.0');
    expect(v.released_at).toBeDefined();
  });
});
