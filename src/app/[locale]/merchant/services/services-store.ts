import type {
  MerchantCategoryItem,
  MerchantCategoryTemplate,
  MerchantServiceDetailResponse,
  MerchantServicePriceItem,
  MerchantServiceProjectItem,
  MerchantServiceSaveRequest,
  ServiceCreateDataField
} from "@shared/api/contracts/merchant-api";

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

function makeId() {
  return `price-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
}

function toText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toTemplate(item: unknown): MerchantCategoryTemplate | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const code = toText(record.code || record.templateCode || record.template_code);
  if (!code) return null;
  return {
    code,
    name: toText(record.name || record.templateName || record.template_name) || code,
    templateDetail:
      record.templateDetail && typeof record.templateDetail === "object"
        ? (record.templateDetail as Record<string, unknown>)
        : record.template_detail && typeof record.template_detail === "object"
          ? (record.template_detail as Record<string, unknown>)
          : null
  };
}

export function normalizeCategories(raw: MerchantCategoryItem[] | unknown): MerchantCategoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const code = toText(record.code || record.categoryCode || record.category_code);
      if (!code) return null;
      const templatesRaw =
        Array.isArray(record.templates)
          ? record.templates
          : Array.isArray(record.processTemplates)
            ? record.processTemplates
            : Array.isArray(record.process_templates)
              ? record.process_templates
              : [];
      return {
        code,
        name: toText(record.name || record.categoryName || record.category_name) || code,
        selected: Boolean(record.selected),
        templates: templatesRaw.map(toTemplate).filter(Boolean) as MerchantCategoryTemplate[],
        defaultTemplateCode:
          toText(
            record.defaultTemplateCode ||
              record.default_template_code ||
              record.defaultProcessTemplateCode ||
              record.default_process_template_code
          ) || null,
        defaultTemplateName:
          toText(record.defaultTemplateName || record.default_template_name) || null,
        defaultTemplateDetail:
          record.defaultTemplateDetail && typeof record.defaultTemplateDetail === "object"
            ? (record.defaultTemplateDetail as Record<string, unknown>)
            : record.default_template_detail && typeof record.default_template_detail === "object"
              ? (record.default_template_detail as Record<string, unknown>)
              : null
      };
    })
    .filter(Boolean) as MerchantCategoryItem[];
}

export function formatPriceRange(priceMin: number, priceMax: number, unit = "") {
  const unitText = unit ? ` / ${unit}` : "";
  if (priceMin <= 0 && priceMax <= 0) return `฿ 0${unitText}`;
  if (priceMin === priceMax) return `฿ ${priceMin}${unitText}`;
  return `฿ ${priceMin} - ${priceMax}${unitText}`;
}

export function normalizeServiceCard(item: MerchantServiceProjectItem): MerchantServiceCard {
  const subtitle = item.processTemplateName || item.categoryName || item.categoryCode;
  const visible = item.isOpen !== false;
  const published = item.status !== "draft";
  return {
    id: item.id,
    title: item.title,
    subtitle,
    description: item.description || "",
    coverImageUrl: item.imageUrl || "/images/merchant-onboarding-hero.svg",
    priceText: formatPriceRange(item.priceMin, item.priceMax, item.unit),
    priceMin: item.priceMin,
    priceMax: item.priceMax,
    published,
    visible
  };
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

function normalizePriceItemEntry(item: unknown): MerchantServicePriceDraft | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const key = toText(record.key);
  const label = toText(record.label || record.name || record.title) || key;
  const inputType: MerchantServicePriceDraft["inputType"] =
    toText(record.type) === "select"
      ? "select"
      : toText(record.type) === "text"
        ? "text"
        : "number";
  const options = Array.isArray(record.options)
    ? record.options
        .map((option) => {
          if (!option || typeof option !== "object") return null;
          const optionRecord = option as Record<string, unknown>;
          const value = toText(optionRecord.value || optionRecord.code);
          if (!value) return null;
          return {
            label: toText(optionRecord.label || optionRecord.name) || value,
            value
          };
        })
        .filter(Boolean) as { label: string; value: string }[]
    : [];
  const amountValue =
    inputType === "select" || inputType === "text"
      ? record.value ?? record.defaultValue ?? ""
      : record.amount ?? record.price ?? record.defaultAmount ?? record.defaultValue ?? 0;
  if (!label && !key) return null;
  return {
    id: makeId(),
    key,
    label,
    amount: inputType === "number" ? String(toNumber(amountValue)) : toText(amountValue),
    readonly: true,
    inputType,
    options
  };
}

function normalizePriceItems(item: MerchantServiceDetailResponse) {
  const directPriceItems = Array.isArray(item.priceItems) ? item.priceItems : [];
  const pricingConfig =
    item.pricingConfig && typeof item.pricingConfig === "object" ? item.pricingConfig : null;
  const configPriceItems = Array.isArray(pricingConfig?.priceItems) ? pricingConfig.priceItems : [];
  const priceItemsRaw = configPriceItems.length ? configPriceItems : directPriceItems;
  if (!priceItemsRaw.length) {
    return [];
  }
  return priceItemsRaw.map(normalizePriceItemEntry).filter(Boolean) as MerchantServicePriceDraft[];
}

export function normalizeServiceDetail(item: MerchantServiceDetailResponse): MerchantServiceDraft {
  const normalizedPriceItems = normalizePriceItems(item);
  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    categoryCode: item.categoryCode || "",
    processTemplateCode: item.processTemplateCode || "",
    coverImageUrl: item.imageUrl || "/images/merchant-onboarding-hero.svg",
    visible: item.isOpen !== false,
    published: item.status !== "draft",
    pricingStrategy:
      typeof item.pricingConfig === "object" && item.pricingConfig && "strategy" in item.pricingConfig
        ? toText((item.pricingConfig as Record<string, unknown>).strategy) || undefined
        : undefined,
    pricingSchema:
      typeof item.pricingConfig === "object" &&
      item.pricingConfig &&
      "pricingSchema" in item.pricingConfig &&
      (item.pricingConfig as Record<string, unknown>).pricingSchema &&
      typeof (item.pricingConfig as Record<string, unknown>).pricingSchema === "object"
        ? ((item.pricingConfig as Record<string, unknown>).pricingSchema as Record<string, unknown>)
        : null,
    priceItems:
      normalizedPriceItems.length > 0
        ? normalizedPriceItems
        : [
            {
              id: makeId(),
              label: item.processTemplateName || item.title || "",
              amount: String(item.priceMin || item.priceMax || 0),
              readonly: true,
              inputType: "number" as const
            }
          ]
  };
}

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

export function addPriceItem(priceItems: MerchantServicePriceDraft[]) {
  return [...priceItems, { id: makeId(), label: "", amount: "" }];
}

export function replaceTemplatePriceItems(
  _templateName: string,
  currentPriceItems: MerchantServicePriceDraft[]
) {
  return currentPriceItems;
}

export function extractTemplatePriceItems(raw: unknown): MerchantServicePriceDraft[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  const directItems = Array.isArray(record.priceItems) ? record.priceItems : null;
  const pricingConfig =
    record.pricingConfig && typeof record.pricingConfig === "object"
      ? (record.pricingConfig as Record<string, unknown>)
      : null;
  const pricingRules =
    record.pricingRules && typeof record.pricingRules === "object"
      ? (record.pricingRules as Record<string, unknown>)
      : null;
  const priceItemsRaw =
    directItems ||
    (Array.isArray(pricingConfig?.priceItems) ? pricingConfig.priceItems : null) ||
    (Array.isArray(pricingRules?.priceItems) ? pricingRules.priceItems : null) ||
    [];

  return priceItemsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      const label = toText(entry.label || entry.name || entry.title);
      const key = toText(entry.key);
      if (!label && !key) return null;
      const defaultAmount =
        entry.defaultValue ?? entry.defaultAmount ?? entry.amount ?? entry.price ?? 0;
      const options = Array.isArray(entry.options)
        ? entry.options
            .map((option) => {
              if (!option || typeof option !== "object") return null;
              const record = option as Record<string, unknown>;
              const value = toText(record.value || record.code);
              if (!value) return null;
              return {
                label: toText(record.label || record.name) || value,
                value
              };
            })
            .filter(Boolean) as { label: string; value: string }[]
        : [];
      const inputType: MerchantServicePriceDraft["inputType"] =
        toText(entry.type) === "select"
          ? "select"
          : toText(entry.type) === "text"
            ? "text"
            : "number";
      return {
        id: makeId(),
        key,
        label: label || key,
        amount: String(toNumber(defaultAmount)),
        readonly: true,
        inputType,
        options
      };
    })
    .filter(Boolean) as MerchantServicePriceDraft[];
}

export function extractFormFields(raw: unknown): ServiceCreateDataField[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  const formSchema =
    record.formSchema && typeof record.formSchema === "object"
      ? (record.formSchema as Record<string, unknown>)
      : null;
  const fields = Array.isArray(formSchema?.fields) ? formSchema.fields : [];
  return fields.filter((field): field is ServiceCreateDataField => Boolean(field && typeof field === "object"));
}

export function resolveTemplateDetailSource(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.editorConfig && typeof record.editorConfig === "object") {
    return record.editorConfig as Record<string, unknown>;
  }
  if (record.defaultTemplateDetail && typeof record.defaultTemplateDetail === "object") {
    return record.defaultTemplateDetail as Record<string, unknown>;
  }
  if (record.templateDetail && typeof record.templateDetail === "object") {
    return record.templateDetail as Record<string, unknown>;
  }
  return record;
}

export function applyTemplatePriceItems(
  templateItems: MerchantServicePriceDraft[],
  currentItems: MerchantServicePriceDraft[]
) {
  if (!templateItems.length) return currentItems;
  return templateItems.map((item, index) => {
    const matchedCurrent =
      currentItems.find((current) => current.key && item.key && current.key === item.key) ||
      currentItems.find((current) => current.label === item.label) ||
      currentItems[index];
    return {
      ...item,
      amount:
        matchedCurrent && matchedCurrent.amount.trim()
          ? matchedCurrent.amount
          : item.amount
    };
  });
}

export function extractPricingStrategy(raw: unknown) {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const pricingConfig =
    record.pricingConfig && typeof record.pricingConfig === "object"
      ? (record.pricingConfig as Record<string, unknown>)
      : null;
  const pricingRules =
    record.pricingRules && typeof record.pricingRules === "object"
      ? (record.pricingRules as Record<string, unknown>)
      : null;
  return (
    toText(record.pricingStrategy) ||
    toText(pricingConfig?.strategy) ||
    toText(pricingRules?.strategy) ||
    undefined
  );
}

export function extractPricingSchema(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const direct = record.pricingSchema;
  if (direct && typeof direct === "object") return direct as Record<string, unknown>;
  const pricingConfig =
    record.pricingConfig && typeof record.pricingConfig === "object"
      ? (record.pricingConfig as Record<string, unknown>)
      : null;
  if (pricingConfig?.pricingSchema && typeof pricingConfig.pricingSchema === "object") {
    return pricingConfig.pricingSchema as Record<string, unknown>;
  }
  const pricingRules =
    record.pricingRules && typeof record.pricingRules === "object"
      ? (record.pricingRules as Record<string, unknown>)
      : null;
  if (pricingRules?.pricingSchema && typeof pricingRules.pricingSchema === "object") {
    return pricingRules.pricingSchema as Record<string, unknown>;
  }
  return null;
}
