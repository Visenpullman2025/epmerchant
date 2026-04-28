export type MerchantServiceCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string;
  priceText: string;
  priceMin: number;
  priceMax: number;
  published: boolean;
  visible: boolean;
  reviewState?: "pending" | "approved" | "rejected";
  reviewNote?: string;
  status?: string;
};

export type MerchantServicePriceDraft = {
  id: string;
  key?: string;
  label: string;
  amount: string;
  readonly?: boolean;
  inputType?: "number" | "select" | "text";
  options?: { label: string; value: string }[];
};

export type MerchantServiceDraft = {
  id: string;
  title: string;
  description: string;
  categoryCode: string;
  processTemplateCode: string;
  coverImageUrl: string;
  visible: boolean;
  published: boolean;
  pricingStrategy?: string;
  pricingSchema?: Record<string, unknown> | null;
  priceItems: MerchantServicePriceDraft[];
};

export function makeId() {
  return `price-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyService(
  categoryCode = "",
  processTemplateCode = ""
): MerchantServiceDraft {
  return {
    id: "",
    title: "",
    description: "",
    categoryCode,
    processTemplateCode,
    coverImageUrl: "/images/merchant-onboarding-hero.svg",
    visible: true,
    published: true,
    pricingStrategy: undefined,
    pricingSchema: null,
    priceItems: []
  };
}
