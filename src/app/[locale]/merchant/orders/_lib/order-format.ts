import type { MerchantOrderItem } from "@/lib/api/merchant-api";

type SummaryEntry = {
  label: string;
  value: string;
};

const PRICING_KEYS = [
  "serviceSubtotal",
  "subtotal",
  "platformFee",
  "tax",
  "totalDue",
  "total",
  "amount",
  "quotedAmount",
  "finalAmount",
  "currency"
];
const SETTLEMENT_KEYS = ["status", "platformFeePercent", "platformFee", "merchantSettlement", "releasedAt"];
const CREDIT_IMPACT_KEYS = ["scoreDelta", "eventType", "title", "note", "description"];

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(value: string | null | undefined, locale: string, unknown: string) {
  if (!value) return unknown;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

export function shortAddress(order: MerchantOrderItem, unknown: string) {
  const address = order.serviceAddress?.address?.trim() || "";
  return address.length > 32 ? `${address.slice(0, 32)}...` : address || unknown;
}

export function pricingEntries(order: MerchantOrderItem): SummaryEntry[] {
  return pickScalarEntries(order.pricing || order.pricingSnapshot, PRICING_KEYS);
}

export function settlementEntries(order: MerchantOrderItem): SummaryEntry[] {
  return pickScalarEntries(order.settlement, SETTLEMENT_KEYS);
}

export function creditImpactEntries(order: MerchantOrderItem): SummaryEntry[] {
  return pickScalarEntries(order.creditImpact, CREDIT_IMPACT_KEYS);
}

function pickScalarEntries(source: unknown, allowedKeys: string[]): SummaryEntry[] {
  if (!source || typeof source !== "object" || Array.isArray(source)) return [];
  const record = source as Record<string, unknown>;
  return allowedKeys.flatMap((key) => {
    const value = record[key];
    if (value == null || value === "") return [];
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return [];
    return [{ label: humanizeKey(key), value: String(value) }];
  });
}

function humanizeKey(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (first) => first.toUpperCase());
}
