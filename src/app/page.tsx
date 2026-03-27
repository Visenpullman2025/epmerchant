import { redirect } from "next/navigation";
import { headers } from "next/headers";

function resolveLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return "en";
  }

  const candidates = acceptLanguage
    .split(",")
    .map((item) => item.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.startsWith("zh")) return "zh";
    if (candidate.startsWith("th")) return "th";
    if (candidate.startsWith("en")) return "en";
  }

  return "en";
}

export default async function HomePage() {
  const headerList = await headers();
  const locale = resolveLocale(headerList.get("accept-language"));
  redirect(`/${locale}`);
}
