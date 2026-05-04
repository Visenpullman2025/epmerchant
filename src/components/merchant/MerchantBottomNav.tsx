"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type MerchantBottomNavProps = {
  locale: string;
};

const navItems = ["dashboard", "orders", "services", "square", "profile"] as const;

function navHref(locale: string, item: (typeof navItems)[number]) {
  if (item === "orders") return `/${locale}/merchant/order-requests`;
  if (item === "services") return `/${locale}/merchant/capabilities`;
  return `/${locale}/merchant/${item}`;
}

function isNavActive(pathname: string, locale: string, item: (typeof navItems)[number]) {
  const href = navHref(locale, item);
  if (item === "orders") {
    return pathname.startsWith(`/${locale}/merchant/order-requests`) || pathname.startsWith(`/${locale}/merchant/orders`);
  }
  if (item === "services") {
    return pathname.startsWith(`/${locale}/merchant/capabilities`) || pathname.startsWith(`/${locale}/merchant/services`);
  }
  if (item === "square") return pathname.startsWith(`/${locale}/merchant/square`);
  if (item === "profile") return pathname.startsWith(`/${locale}/merchant/profile`);
  return pathname === href;
}

export default function MerchantBottomNav({ locale }: MerchantBottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("MerchantNav");

  return (
    <div className="merchant-bottom-nav-shell">
      <nav className="merchant-bottom-nav">
        {navItems.map((item) => {
          const href = navHref(locale, item);
          const active = isNavActive(pathname, locale, item);
          return (
            <Link
              className={`merchant-bottom-nav-item ${active ? "active" : ""}`}
              href={href}
              key={item}
            >
              {t(item)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
