import type { MerchantCapabilityItem } from "@/lib/api/merchant-api";

export type CapabilityDraft = {
  capabilityId?: string | number;
  standardServiceCode: string;
  enabled: boolean;
  readyStatus: string;
  serviceArea: string;
  basePricingRule: string;
  extraDistanceRule: string;
  capacityRule: string;
  timeSlots: string;
  openDates: string;
  blackoutDates: string;
};

export const emptyCapabilityDraft: CapabilityDraft = {
  standardServiceCode: "",
  enabled: true,
  readyStatus: "ready",
  serviceArea: "{}",
  basePricingRule: "{}",
  extraDistanceRule: "{}",
  capacityRule: "{}",
  timeSlots: "[]",
  blackoutDates: "",
  openDates: ""
};

export function stringifyJson(value: unknown) {
  if (value == null) return "{}";
  return JSON.stringify(value, null, 2);
}

export function draftFromCapability(item: MerchantCapabilityItem): CapabilityDraft {
  return {
    capabilityId: item.capabilityId,
    standardServiceCode: item.standardServiceCode || "",
    enabled: item.enabled !== false,
    readyStatus: item.readyStatus || "ready",
    serviceArea: stringifyJson(item.serviceArea),
    basePricingRule: stringifyJson(item.basePricingRule),
    extraDistanceRule: stringifyJson(item.extraDistanceRule),
    capacityRule: stringifyJson(item.capacityRule),
    timeSlots: item.timeSlots == null ? "[]" : JSON.stringify(item.timeSlots, null, 2),
    openDates: (item.openDates || []).join(", "),
    blackoutDates: (item.blackoutDates || []).join(", ")
  };
}

export function parseObject(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed) as unknown;
  if (parsed == null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(label);
  }
  return parsed as Record<string, unknown>;
}

export function parseJsonValue(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error(label);
  }
}

export function parseDateList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
