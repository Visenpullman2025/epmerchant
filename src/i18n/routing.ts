import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh", "en", "th"],
  defaultLocale: "en",
  localePrefix: "always"
});
