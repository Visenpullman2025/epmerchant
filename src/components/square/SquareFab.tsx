'use client';

import Link from 'next/link';
import { localeHref } from '@/lib/typed-routes';

interface Props {
  onClick?: () => void;
  href?: string;
}

const fabStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 96,
  right: 16,
  width: 56,
  height: 56,
  borderRadius: 18,
  background: 'linear-gradient(135deg, #c9a96e, #a07a32)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 24px rgba(201,169,110,0.5), 0 2px 6px rgba(15,52,40,0.15)',
  zIndex: 31,
  cursor: 'pointer',
  border: 'none',
  fontFamily: 'Sora, sans-serif',
  fontWeight: 800,
  color: '#0a3a2a',
  fontSize: 28,
  lineHeight: 1,
  textDecoration: 'none',
};

export function SquareFab({ onClick, href }: Props) {
  if (href && !onClick) {
    return (
      <Link href={localeHref(href)} aria-label="发帖" style={fabStyle}>
        +
      </Link>
    );
  }
  return (
    <button type="button" aria-label="发帖" onClick={onClick} style={fabStyle}>
      +
    </button>
  );
}
