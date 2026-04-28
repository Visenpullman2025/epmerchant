import type { MerchantServicePriceItem, MerchantServiceSaveRequest } from "@/lib/api/merchant-api";
import type { MerchantServiceDraft, MerchantServicePriceDraft } from "./draft";

export function computePriceRange(priceItems: MerchantServicePriceDraft[]) {
  const numbers = priceItems
    .map((item) => Number(item.amount))
    .filter((item) => Number.isFinite(item) && item >= 0);
  if (!numbers.length) {
    return { priceMin: 0, priceMax: 0 };
  }
  return {
    priceMin: Math.min(...numbers),
    priceMax: Math.max(...numbers)
  };
}

export function buildSavePayload(service: MerchantServiceDraft): MerchantServiceSaveRequest {
  const normalizedPriceItems = service.priceItems.reduce<MerchantServicePriceItem[]>(
    (acc, item) => {
      const key = item.key?.trim();
      if (!key) return acc;
      if (item.inputType === "select" || item.inputType === "text") {
        if (!item.amount) return acc;
        acc.push({
          key,
          amount: 0,
          value: item.amount
        });
        return acc;
      }
      const amount = Number(item.amount);
      if (!Number.isFinite(amount) || amount < 0) return acc;
      acc.push({
        key,
        amount
      });
      return acc;
    },
    []
  );
  const { priceMin, priceMax } = computePriceRange(service.priceItems);
  return {
    title: service.title.trim(),
    description: service.description.trim() || undefined,
    categoryCode: service.categoryCode,
    processTemplateCode: service.processTemplateCode || undefined,
    priceMin,
    priceMax,
    imageUrl: service.coverImageUrl.trim() || undefined,
    status: service.published ? "published" : "draft",
    isOpen: service.visible,
    pricingConfig: {
      strategy: service.pricingStrategy,
      pricingSchema: service.pricingSchema || undefined,
      priceItems: normalizedPriceItems
    }
  };
}
