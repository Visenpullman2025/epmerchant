/**
 * 服务编辑/列表：类型与逻辑分文件，此处统一再导出以保持原 import 路径不变。
 */
export type { MerchantServiceCard, MerchantServiceDraft, MerchantServicePriceDraft } from "./draft";
export { createEmptyService } from "./draft";
export {
  applyTemplatePriceItems,
  extractPricingSchema,
  extractPricingStrategy,
  extractTemplatePriceItems,
  formatPriceRange,
  normalizeCategories,
  normalizeServiceCard,
  normalizeServiceDetail,
  resolveTemplateDetailSource
} from "./normalize";
export { buildSavePayload, computePriceRange } from "./payload";
