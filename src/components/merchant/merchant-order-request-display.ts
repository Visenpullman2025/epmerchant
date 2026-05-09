import type { LocaleCode, MerchantCandidateItem } from "@/lib/api/merchant-api";

type LocaleText = Record<LocaleCode, string>;

const fieldLabels: Record<string, LocaleText> = {
  areaSqm: { zh: "面积", en: "Area", th: "พื้นที่" },
  cleaningType: { zh: "清洁类型", en: "Cleaning", th: "ประเภททำความสะอาด" },
  propertyType: { zh: "房屋类型", en: "Property", th: "ประเภทบ้าน" },
  unitCount: { zh: "数量", en: "Units", th: "จำนวน" },
  distanceKm: { zh: "距离", en: "Distance", th: "ระยะทาง" }
};

const valueLabels: Record<string, LocaleText> = {
  apartment: { zh: "公寓", en: "Apartment", th: "คอนโด" },
  condo: { zh: "公寓", en: "Condo", th: "คอนโด" },
  villa: { zh: "别墅", en: "Villa", th: "วิลล่า" },
  regular: { zh: "日常清洁", en: "Regular", th: "ปกติ" },
  deep: { zh: "深度清洁", en: "Deep clean", th: "ทำความสะอาดใหญ่" }
};

const submittedStatuses = new Set(["quoted", "submitted", "accepted", "declined", "expired", "cancelled"]);

const localeMap: Record<LocaleCode, string> = {
  zh: "zh-CN",
  en: "en-US",
  th: "th-TH"
};

export function canSubmitQuote(item: MerchantCandidateItem) {
  const status = String(item.status || "").toLowerCase();
  return !submittedStatuses.has(status);
}

export function candidateStatusLabel(status: string | undefined, locale: LocaleCode) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "quoted") {
    return { zh: "已报价", en: "Quoted", th: "เสนอราคาแล้ว" }[locale];
  }
  if (normalized === "invited") {
    return { zh: "待报价", en: "To quote", th: "รอเสนอราคา" }[locale];
  }
  if (normalized === "expired") {
    return { zh: "已过期", en: "Expired", th: "หมดอายุ" }[locale];
  }
  if (normalized === "declined") {
    return { zh: "已拒绝", en: "Declined", th: "ปฏิเสธแล้ว" }[locale];
  }
  if (normalized === "accepted") {
    return { zh: "已接受", en: "Accepted", th: "รับแล้ว" }[locale];
  }
  return status || { zh: "待处理", en: "Pending", th: "รอดำเนินการ" }[locale];
}

export function displayRequirementSummary(
  value: MerchantCandidateItem["requirementSummary"],
  locale: LocaleCode
) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  const entries = Object.entries(value)
    .filter(([, item]) => item != null && item !== "" && ["string", "number", "boolean"].includes(typeof item))
    .slice(0, 3)
    .map(([key, item]) => {
      const label = fieldLabels[key]?.[locale] || key;
      const display = valueLabels[String(item)]?.[locale] || String(item);
      return `${label}: ${display}`;
    });
  return entries.length ? entries.join(" · ") : "-";
}

export function displayValue(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayValue).filter((item) => item !== "-").join(", ") || "-";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const summary = record.summary ?? record.title ?? record.name ?? record.label ?? record.description;
    if (summary != null) return displayValue(summary);
    return Object.entries(record)
      .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
      .slice(0, 4)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join(" · ") || "-";
  }
  return "-";
}

export function displayDateTime(value: unknown, locale: LocaleCode): string {
  const raw = readDateTimeValue(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return displayValue(value);
  return new Intl.DateTimeFormat(localeMap[locale], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok"
  }).format(date);
}

export function candidateThumbnailUrl(item: MerchantCandidateItem): string | null {
  const record = item as unknown as Record<string, unknown>;
  return (
    firstImageUrl(record.imageUrl) ||
    firstImageUrl(record.imageUrls) ||
    firstImageUrl(record.images) ||
    firstImageUrl(record.requirementImages) ||
    firstImageUrl(record.requirementSummary) ||
    null
  );
}

export function serviceAddressText(value: MerchantCandidateItem["serviceAddress"]) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.address || displayValue(value);
}

export function quotePreviewAmount(value: MerchantCandidateItem["quotePreview"]) {
  if (!value) return "-";
  const amount = value.amount ?? value.estimatedAmount ?? value.price ?? value.total;
  const min = value.minAmount ?? value.priceMin;
  const max = value.maxAmount ?? value.priceMax;
  if (amount != null) return String(amount);
  if (min != null || max != null) return `${min ?? "-"} - ${max ?? "-"}`;
  return displayValue(value);
}

export function candidateTitle(item: MerchantCandidateItem, fallback: string) {
  const record = item as unknown as Record<string, unknown>;
  const standardService = record.standardService;
  const standardRecord =
    standardService && typeof standardService === "object"
      ? (standardService as Record<string, unknown>)
      : null;
  const title =
    record.serviceTitle ??
    record.title ??
    standardRecord?.title ??
    standardRecord?.name ??
    standardRecord?.displayName;
  return typeof title === "string" && title.trim() ? title : fallback;
}

function readDateTimeValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const raw = record.datetime ?? record.time ?? record.date ?? record.value;
    return typeof raw === "string" ? raw : "";
  }
  return "";
}

function firstImageUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return looksLikeImageUrl(value) ? value : null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstImageUrl(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      firstImageUrl(record.url) ||
      firstImageUrl(record.src) ||
      firstImageUrl(record.imageUrl) ||
      firstImageUrl(record.image_url) ||
      firstImageUrl(record.imageUrls) ||
      firstImageUrl(record.images) ||
      firstImageUrl(record.photos) ||
      firstImageUrl(record.attachments) ||
      firstImageUrl(record.files) ||
      null
    );
  }
  return null;
}

function looksLikeImageUrl(value: string) {
  return /^(https?:\/\/|\/)/.test(value);
}
