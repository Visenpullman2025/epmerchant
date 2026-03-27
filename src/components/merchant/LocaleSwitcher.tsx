"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const locales = ["zh", "en", "th"] as const;

function buildPathWithLocale(pathname: string, locale: string) {
  const parts = pathname.split("/");
  if (parts.length > 1 && locales.includes(parts[1] as (typeof locales)[number])) {
    parts[1] = locale;
    return parts.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const t = useTranslations("Common");

  const localeOptions = useMemo(
    () =>
      locales.map((locale) => ({
        locale,
        href: buildPathWithLocale(pathname, locale)
      })),
    [pathname]
  );

  return (
    <div className="merchant-segment" aria-label={t("language")}>
      {localeOptions.map((item) => (
        <a className="merchant-segment-item" href={item.href} key={item.locale}>
          {item.locale.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
