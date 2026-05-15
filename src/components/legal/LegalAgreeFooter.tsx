'use client';

import { useState } from 'react';

export interface LegalAgreeFooterProps {
  reachedBottom: boolean;
  submitting?: boolean;
  onAgree: () => void;
  agreeLabel: string;
  checkboxLabel: string;
}

export function LegalAgreeFooter({
  reachedBottom,
  submitting,
  onAgree,
  agreeLabel,
  checkboxLabel,
}: LegalAgreeFooterProps) {
  const [checked, setChecked] = useState(false);

  const checkboxDisabled = !reachedBottom;
  const buttonDisabled = !reachedBottom || !checked || !!submitting;

  return (
    <footer className="sticky bottom-0 left-0 right-0 border-t border-black/[0.06] bg-background p-3">
      <label
        className={`mb-2 flex items-center gap-2 text-sm ${
          checkboxDisabled ? 'text-foreground-muted/60' : 'text-foreground'
        }`}
      >
        <input
          type="checkbox"
          disabled={checkboxDisabled}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4"
        />
        {checkboxLabel}
      </label>
      <button
        type="button"
        disabled={buttonDisabled}
        onClick={onAgree}
        className={`h-11 w-full rounded-md font-semibold ${
          buttonDisabled
            ? 'bg-black/[0.08] text-foreground-muted/60'
            : 'bg-foreground text-background'
        }`}
      >
        {submitting ? '…' : agreeLabel}
      </button>
    </footer>
  );
}
