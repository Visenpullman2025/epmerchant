'use client';

import { useEffect, useState } from 'react';

export interface LegalSection {
  code: string;
  title: string;
  anchorId: string;
}

export interface LegalSectionChipsProps {
  sections: LegalSection[];
  containerRef: React.RefObject<HTMLElement | null>;
}

export function LegalSectionChips({ sections, containerRef }: LegalSectionChipsProps) {
  const [activeId, setActiveId] = useState(sections[0]?.anchorId ?? '');

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { root, threshold: 0.3 },
    );
    sections.forEach((s) => {
      const el = root.querySelector(`#${s.anchorId}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, containerRef]);

  return (
    <nav className="flex flex-nowrap gap-2 overflow-x-auto px-4 py-2 bg-background border-b border-black/[0.06]">
      {sections.map((s) => (
        <a
          key={s.code}
          href={`#${s.anchorId}`}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
            activeId === s.anchorId
              ? 'bg-foreground text-background'
              : 'bg-black/[0.05] text-foreground-muted'
          }`}
        >
          {s.title}
        </a>
      ))}
    </nav>
  );
}
