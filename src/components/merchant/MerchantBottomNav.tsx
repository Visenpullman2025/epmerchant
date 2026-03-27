"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type MerchantBottomNavProps = {
  locale: string;
};

const navItems = ["dashboard", "orders", "services", "wallet", "profile"] as const;

export default function MerchantBottomNav({ locale }: MerchantBottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("MerchantNav");

  return (
    <nav className="merchant-bottom-nav">
      {navItems.map((item) => {
        const href = `/${locale}/merchant/${item}`;
        const active = pathname === href;
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
  );
}
