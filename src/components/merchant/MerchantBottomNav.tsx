"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type MerchantBottomNavProps = {
  locale: string;
};

// 顺序：首页 / 运营 / 广场(中凸) / 服务 / 我
const navItems = ["dashboard", "orders", "square", "services", "profile"] as const;

function navHref(locale: string, item: (typeof navItems)[number]) {
  if (item === "orders") return `/${locale}/merchant/order-requests`;
  if (item === "services") return `/${locale}/merchant/capabilities`;
  return `/${locale}/merchant/${item}`;
}

function isNavActive(pathname: string, locale: string, item: (typeof navItems)[number]) {
  const href = navHref(locale, item);
  if (item === "orders") {
    return (
      pathname.startsWith(`/${locale}/merchant/order-requests`) ||
      pathname.startsWith(`/${locale}/merchant/orders`)
    );
  }
  if (item === "services") {
    return (
      pathname.startsWith(`/${locale}/merchant/capabilities`) ||
      pathname.startsWith(`/${locale}/merchant/services`)
    );
  }
  if (item === "square") return pathname.startsWith(`/${locale}/merchant/square`);
  if (item === "profile") return pathname.startsWith(`/${locale}/merchant/profile`);
  if (item === "dashboard") {
    return (
      pathname === `/${locale}/merchant` ||
      pathname === `/${locale}/merchant/` ||
      pathname.startsWith(`/${locale}/merchant/dashboard`)
    );
  }
  return pathname === href;
}

const TAB_ICONS: Record<(typeof navItems)[number], string> = {
  dashboard: "🏠",
  orders: "📋",
  square: "✨",
  services: "🛠",
  profile: "👤",
};

export default function MerchantBottomNav({ locale }: MerchantBottomNavProps) {
  const pathname = usePathname() ?? "";
  const t = useTranslations("MerchantNav");

  return (
    <div className="merchant-bottom-nav-shell">
      <nav className="mer-tabs">
        {navItems.map((item) => {
          const href = navHref(locale, item);
          const active = isNavActive(pathname, locale, item);
          const isCenter = item === "square";
          return (
            <Link
              className={`mer-tab${active ? " active" : ""}${isCenter ? " center" : ""}`}
              href={href as `/${string}`}
              key={item}
              aria-label={t(item)}
            >
              <span className="mer-tab-icon">{TAB_ICONS[item]}</span>
              <span className="mer-tab-label">{t(item)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
