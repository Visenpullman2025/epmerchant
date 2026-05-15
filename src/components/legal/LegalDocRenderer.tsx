'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface LegalDocRendererProps {
  body: string;
  className?: string;
}

export function LegalDocRenderer({ body, className }: LegalDocRendererProps) {
  return (
    <article className={`legal-prose ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </article>
  );
}
