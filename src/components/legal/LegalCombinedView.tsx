'use client';

import { useEffect, useRef, useState } from 'react';
import { LegalDocRenderer } from './LegalDocRenderer';
import { LegalScrollProgress } from './LegalScrollProgress';
import { LegalSectionChips, type LegalSection } from './LegalSectionChips';
import { LegalAgreeFooter } from './LegalAgreeFooter';

export interface LegalCombinedViewDoc {
  code: string;
  title: string;
  version: string;
  body: string;
}

export interface LegalCombinedViewProps {
  title: string;
  agreeLabel: string;
  checkboxLabel: string;
  docs: LegalCombinedViewDoc[];
  onAgree: (versions: Array<{ code: string; version: string }>) => Promise<void> | void;
}

export function LegalCombinedView({ title, agreeLabel, checkboxLabel, docs, onAgree }: LegalCombinedViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setReachedBottom(true);
            observer.disconnect();
            break;
          }
        }
      },
      { root, threshold: 0.5 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const sections: LegalSection[] = docs.map((d) => ({
    code: d.code,
    title: d.title,
    anchorId: `legal-section-${d.code}`,
  }));

  async function handleAgree() {
    setSubmitting(true);
    try {
      await onAgree(docs.map((d) => ({ code: d.code, version: d.version })));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex h-[100dvh] flex-col">
      <header className="sticky top-0 z-10 bg-background">
        <h1 className="px-4 py-3 text-base font-semibold text-foreground">{title}</h1>
        <LegalScrollProgress containerRef={scrollRef} />
        <LegalSectionChips sections={sections} containerRef={scrollRef} />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-8">
        {docs.map((d) => (
          <section key={d.code} id={`legal-section-${d.code}`} className="pt-6">
            <LegalDocRenderer body={d.body} />
          </section>
        ))}
        <div ref={sentinelRef} id="legal-end-sentinel" className="pt-6 text-center text-xs text-foreground-muted/60">
          — 已到末尾 —
        </div>
      </div>

      <LegalAgreeFooter
        reachedBottom={reachedBottom}
        submitting={submitting}
        onAgree={handleAgree}
        agreeLabel={agreeLabel}
        checkboxLabel={checkboxLabel}
      />
    </section>
  );
}
