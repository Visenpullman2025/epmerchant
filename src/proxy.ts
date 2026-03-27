import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);
const locales = ["zh", "en", "th"];

export default function proxy(request: NextRequest) {
  const response = intlProxy(request);
  const pathname = request.nextUrl.pathname;
  const merchantAuthPath = /^\/(zh|en|th)\/merchant\/(login|register)$/;
  const merchantPath = /^\/(zh|en|th)\/merchant(\/.*)?$/;
  const pathLocale = pathname.split("/")[1];
  const preferredLocale = request.cookies.get("merchant_locale")?.value;
  const token = request.cookies.get("merchant_token")?.value;

  if (
    merchantPath.test(pathname) &&
    token &&
    preferredLocale &&
    locales.includes(preferredLocale) &&
    preferredLocale !== pathLocale
  ) {
    const targetPath = pathname.replace(`/${pathLocale}/`, `/${preferredLocale}/`);
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  if (merchantPath.test(pathname) && !merchantAuthPath.test(pathname)) {
    if (!token) {
      const locale =
        preferredLocale && locales.includes(preferredLocale)
          ? preferredLocale
          : pathname.split("/")[1] || routing.defaultLocale;
      return NextResponse.redirect(
        new URL(`/${locale}/merchant/login`, request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(zh|en|th)/:path*"]
};
