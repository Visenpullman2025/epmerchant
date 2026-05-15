'use client';

import { useEffect, useState } from 'react';

export interface LegalScrollProgressProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function LegalScrollProgress({ containerRef }: LegalScrollProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const total = el.scrollHeight - el.clientHeight;
      const ratio = total <= 0 ? 1 : Math.min(1, Math.max(0, el.scrollTop / total));
      setProgress(ratio);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef]);

  return (
    <div
      className="h-1 w-full bg-black/[0.06]"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-foreground transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
