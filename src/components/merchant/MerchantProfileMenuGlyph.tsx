import type { CSSProperties } from "react";

export type MerchantProfileMenuFeature =
  | "info"
  | "verification"
  | "settings"
  | "balance"
  | "flow"
  | "orders"
  | "services";

const iconClass = "h-[22px] w-[22px] shrink-0";

export default function MerchantProfileMenuGlyph({
  color,
  feature
}: {
  color: string;
  feature: MerchantProfileMenuFeature;
}) {
  const c = iconClass;
  const style: CSSProperties = { color };

  switch (feature) {
    case "info":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <path d="M12 12.5a4 4 0 100-8 4 4 0 000 8z" strokeLinejoin="round" />
          <path d="M5 20.5v-1c0-2.5 2-4.5 7-4.5s7 2 7 4.5v1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "verification":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <path d="M12 3.5l7 3.5v5c0 4.5-3 8.5-7 9.5-4-1-7-5-7-9.5V7l7-3.5z" strokeLinejoin="round" />
          <path d="M9.5 12.5l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            strokeLinecap="round"
          />
        </svg>
      );
    case "balance":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8.5v7M9 12h6" strokeLinecap="round" />
        </svg>
      );
    case "flow":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <path d="M8 6h13v12H8z" strokeLinejoin="round" />
          <path d="M4 9h4v9H4z" strokeLinejoin="round" />
          <path d="M11 10h6M11 14h4" strokeLinecap="round" />
        </svg>
      );
    case "orders":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <path d="M4 8.5h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1v-11z" strokeLinejoin="round" />
          <path d="M8 8.5V6.5a1 1 0 011-1h6a1 1 0 011 1v2" strokeLinejoin="round" />
          <path d="M8 12.5h8" strokeLinecap="round" />
        </svg>
      );
    case "services":
      return (
        <svg aria-hidden className={c} fill="none" stroke="currentColor" strokeWidth="1.5" style={style} viewBox="0 0 24 24">
          <path d="M4 7.5h7v10H4z" strokeLinejoin="round" />
          <path d="M13 4.5h7v6h-7z" strokeLinejoin="round" />
          <path d="M13 13.5h7v6h-7z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
