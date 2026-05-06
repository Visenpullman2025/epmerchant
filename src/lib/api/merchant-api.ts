/**
 * 商户端 API 请求/响应类型（与 shared/docs/api-merchant-list 等对齐）。
 * 放在 `src` 下以便构建机仅同步 `src` 时仍能 typecheck；勿再从 `@shared/...` 引用本文件。
 */
export type LocaleCode = "zh" | "en" | "th";

export type ApiErrorItem = {
  field: string;
  message: string;
};

export type ApiError = {
  code: number;
  message: string;
  errors?: ApiErrorItem[];
  requestId: string | null;
  timestamp: string;
};

export type ApiSuccess<T> = {
  code: 0;
  message: "ok";
  data: T;
  requestId: string | null;
  timestamp: string;
};

export type RegisterRequest = {
  merchantName: string;
  email: string;
  password: string;
  contactPhone?: string;
  locale?: LocaleCode;
};

export type RegisterResponse = {
  success: true;
  preferredLocale: LocaleCode;
};

export type LoginRequest = {
  email: string;
  password: string;
  locale?: LocaleCode;
};

export type LoginResponse = {
  success: true;
  preferredLocale: LocaleCode;
  merchantStatus: "unsubmitted" | "pending" | "approved" | "rejected";
};

export type SaveLocaleRequest = {
  locale: LocaleCode;
};

export type SaveLocaleResponse = {
  success: true;
  preferredLocale: LocaleCode;
};

export type MerchantProfileResponse = {
  id: string;
  merchantName: string;
  contactPhone: string;
  status: "unsubmitted" | "pending" | "approved" | "rejected";
  merchantStatus?: "unsubmitted" | "pending" | "approved" | "rejected";
  serviceIntro?: string;
  online?: boolean;
  serviceTypes?: string[];
  boundServiceCategories?: {
    code: string;
    name: string;
  }[];
  location?: {
    baseAddress: string;
    placeId?: string;
    lat: number | null;
    lng: number | null;
    serviceRadiusMeters: number | null;
    areas: string[];
    locationVerified: boolean;
    updatedAt?: string | null;
  };
  verification?: {
    applicationNo?: string;
    ownerName?: string;
    idNumber?: string;
    businessLicenseUrl?: string;
    documentFrontUrl?: string;
    documentBackUrl?: string;
    selfieUrl?: string;
    status?: "pending" | "approved" | "rejected";
    reviewNote?: string;
    reviewedAt?: string;
  } | null;
};

export type MerchantProfileUpdateRequest = {
  merchantName?: string;
  contactPhone?: string;
  serviceIntro?: string;
  online?: boolean;
  serviceTypes?: string[];
  location?: {
    baseAddress?: string;
    placeId?: string;
    lat?: number | null;
    lng?: number | null;
    serviceRadiusMeters?: number | null;
    areas?: string[];
  };
};

export type MerchantProfileUpdateResponse = {
  updated: true;
  serviceTypes?: string[];
  location?: MerchantProfileResponse["location"];
};

export type MerchantVerificationRequest = {
  ownerName: string;
  idNumber: string;
  businessLicenseUrl: string;
  documentFrontUrl: string;
  documentBackUrl: string;
  selfieUrl: string;
};

export type MerchantVerificationResponse = {
  status: "pending" | "approved" | "rejected";
  applicationNo: string;
  submittedAt?: string;
  editable?: boolean;
};

export type MerchantOrderStatus = "new" | "pending" | "inService" | "done" | "cancelled";

/** 与 GET /api/v1/merchant/orders 列表对齐；联调常见 pending|paid|refunded，另可能含 unpaid */
export type MerchantOrderPaymentStatus = "pending" | "paid" | "refunded" | "unpaid" | string;

export type MerchantOrderItem = {
  orderNo: string;
  customerName: string;
  customerAvatar?: string | null;
  customerRating?: number | null;
  customerLevel?: string | null;
  completedOrderCount?: number | null;
  serviceType: string;
  serviceTitle?: string;
  serviceSubtitle?: string;
  amount: string;
  quotedAmount?: string;
  workflowStatus?: string;
  /** 客户是否已付款；与 paymentStatus / canMerchantStartService 择一或并存，以后端为准 */
  customerPaid?: boolean | null;
  /** 付款状态；与 customerPaid / canMerchantStartService 择一或并存，以后端为准 */
  paymentStatus?: MerchantOrderPaymentStatus | null;
  /** 后端综合门禁：是否允许商家将订单转入服务中 */
  canMerchantStartService?: boolean | null;
  appointmentTime?: string | null;
  confirmedServiceTime?: string | null;
  serviceAddress?: {
    address: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
  distanceKm?: number | null;
  remark?: string | null;
  merchantNote?: string | null;
  pricingSnapshot?: Record<string, unknown> | null;
  pricing?: Record<string, unknown> | null;
  fulfillmentEvents?: MerchantFulfillmentEvent[];
  settlement?: MerchantOrderSettlement | Record<string, unknown> | null;
  creditImpact?: MerchantCreditImpact | Record<string, unknown> | null;
  canReviewCustomer?: boolean | null;
  reviewable?: boolean | null;
  merchantCanReviewCustomer?: boolean | null;
  merchantReview?: Record<string, unknown> | null;
  myReview?: Record<string, unknown> | null;
  createdAt?: string;
  status: MerchantOrderStatus;
};

export type MerchantFulfillmentEvent = {
  eventType?: string;
  type?: string;
  title?: string;
  note?: string;
  description?: string;
  occurredAt?: string;
  createdAt?: string;
};

export type MerchantOrderSettlement = {
  status?: string;
  holdStatus?: string;
  platformFeePercent?: string | number | null;
  platformFee?: string | number | null;
  merchantSettlement?: string | number | null;
  releasedAt?: string | null;
};

export type MerchantCreditImpact = {
  scoreDelta?: string | number | null;
  eventType?: string;
  title?: string;
  note?: string;
  description?: string;
};

export type MerchantOrdersResponse = {
  list: MerchantOrderItem[];
  total: number;
  page: number;
  pageSize: number;
};

/** 语义路径 `confirm` | `start-service` | `finish-service` | `cancel` 的请求体（勿再传 targetStatus） */
export type MerchantOrderActionRequest = {
  confirmedServiceTime?: string;
  merchantNote?: string;
  reason?: string;
};

/** @deprecated 请改用 MerchantOrderActionRequest + 四字路径；仅 transition 兼容层需要 targetStatus */
export type MerchantOrderTransitionRequest = MerchantOrderActionRequest & {
  targetStatus: string;
};

export type MerchantOrderActionResponse = {
  updated: true;
  orderNo: string;
  workflowStatus: string;
  confirmedServiceTime?: string | null;
  merchantNote?: string | null;
  fulfillmentEvents?: MerchantFulfillmentEvent[];
  failureEvent?: MerchantFulfillmentEvent | Record<string, unknown> | null;
  settlement?: MerchantOrderSettlement | Record<string, unknown> | null;
  creditImpact?: MerchantCreditImpact | Record<string, unknown> | null;
  allowedNextActions?: string[];
  nextAction?: string | null;
  customerVisibleMessage?: string | null;
  /** 服务中取消等场景下可选，以后端为准 */
  penaltyAmount?: string | null;
  penaltyRate?: string | number | null;
  penaltyBase?: string | null;
  penaltyDesired?: string | null;
  penaltyCapped?: boolean | null;
  penaltyMessage?: string | null;
};

/** @deprecated 与 MerchantOrderActionResponse 相同，保留别名以免历史引用报错 */
export type MerchantOrderTransitionResponse = MerchantOrderActionResponse;

export type MerchantWalletSummaryResponse = {
  balance: string;
  frozenAmount: string;
  withdrawableAmount: string;
};

export type WalletRecordItem = {
  referenceNo: string;
  type: "income" | "withdraw";
  amount: string;
  createdAt: string;
};

export type MerchantWalletRecordsResponse = {
  list: WalletRecordItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type MerchantWithdrawResponse = {
  submitted: true;
  amount: string;
  referenceNo: string;
};

export type MerchantCategoryTemplate = {
  code: string;
  name: string;
  templateDetail?: Record<string, unknown> | null;
};

export type MerchantCategoryItem = {
  code: string;
  name: string;
  templates?: MerchantCategoryTemplate[];
  defaultTemplateCode?: string | null;
  defaultTemplateName?: string | null;
  defaultTemplateDetail?: Record<string, unknown> | null;
  selected?: boolean;
};

export type MerchantCategoriesResponse = {
  list: MerchantCategoryItem[];
};

export type MerchantServicePriceItem = {
  key?: string;
  label?: string;
  amount: number;
  value?: string;
  defaultValue?: string | number | boolean | null;
  type?: string;
  options?: ServiceCreateDataFieldOption[];
};

export type MerchantServiceProjectItem = {
  id: string;
  serviceCode?: string;
  title: string;
  description?: string;
  categoryCode: string;
  categoryName?: string;
  processTemplateCode?: string;
  processTemplateName?: string;
  templateOptions?: MerchantCategoryTemplate[];
  templateDetail?: Record<string, unknown> | null;
  editorConfig?: Record<string, unknown> | null;
  priceItems?: Array<Record<string, unknown>>;
  pricingStrategy?: string;
  pricingSchema?: Record<string, unknown> | null;
  priceMin: number;
  priceMax: number;
  unit: string;
  imageUrl?: string;
  createDataUrl?: string;
  summaryUrl?: string;
  pricePreviewUrl?: string;
  status?: string;
  reviewState?: "pending" | "approved" | "rejected" | string;
  reviewNote?: string;
  reviewedAt?: string;
  isOpen?: boolean;
  pricingConfig?: {
    priceItems?: MerchantServicePriceItem[];
  } | Record<string, unknown> | null;
};

export type MerchantServicesResponse = {
  list: MerchantServiceProjectItem[];
};

export type MerchantServiceDetailResponse = MerchantServiceProjectItem;

export type MerchantServiceSaveRequest = {
  title: string;
  description?: string;
  categoryCode: string;
  processTemplateCode?: string;
  priceMin: number;
  priceMax: number;
  unit?: string;
  imageUrl?: string;
  status?: string;
  isOpen?: boolean;
  pricingConfig?: {
    strategy?: string;
    pricingSchema?: Record<string, unknown>;
    priceItems?: MerchantServicePriceItem[];
  };
};

export type MerchantServiceSaveResponse = {
  saved: true;
  service: MerchantServiceProjectItem;
};

export type ServiceCreateDataFieldOption = {
  label: string;
  value: string;
};

export type ServiceCreateDataField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "address" | "datetime" | "boolean" | "textarea";
  required: boolean;
  placeholder?: string;
  unit?: string;
  options?: ServiceCreateDataFieldOption[];
  defaultValue?: string | number | boolean | null;
};

export type ServiceCreateDataResponse = {
  formSchema?: {
    fields?: ServiceCreateDataField[];
  } | null;
};

export type MerchantProcessTemplateResponse = {
  templateCode?: string;
  templateName?: string;
  categoryCode?: string;
  pricingStrategy?: string;
  pricingSchema?: Record<string, unknown> | null;
  priceItems?: Array<Record<string, unknown>>;
  pricingConfig?: {
    strategy?: string;
    pricingSchema?: Record<string, unknown>;
    priceItems?: Array<Record<string, unknown>>;
  } | Record<string, unknown> | null;
  pricingRules?: {
    strategy?: string;
    pricingSchema?: Record<string, unknown>;
    priceItems?: Array<Record<string, unknown>>;
  } | Record<string, unknown> | null;
  formSchema?: {
    fields?: ServiceCreateDataField[];
  } | null;
};

export type MerchantCapabilityItem = {
  capabilityId: string | number;
  standardServiceCode: string;
  enabled: boolean;
  serviceArea?: Record<string, unknown> | null;
  basePricingRule?: Record<string, unknown> | null;
  extraDistanceRule?: Record<string, unknown> | null;
  capacityRule?: Record<string, unknown> | null;
  timeSlots?: Record<string, unknown>[] | Record<string, unknown> | null;
  readyStatus?: string | null;
  blackoutDates?: string[];
  openDates?: string[];
  status?: string;
  reviewState?: string;
  matchingPolicyCode?: string | null;
  workflowPolicyCode?: string | null;
};

export type MerchantStandardServiceItem = {
  standardServiceCode: string;
  name: string;
  description?: string;
  categoryCode?: string;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type MerchantStandardServicesResponse = MerchantStandardServiceItem[];

export type MerchantCapabilitiesResponse = {
  list: MerchantCapabilityItem[];
  total?: number;
};

export type MerchantCapabilitySaveRequest = {
  standardServiceCode: string;
  enabled: boolean;
  serviceArea?: Record<string, unknown> | null;
  basePricingRule?: Record<string, unknown> | null;
  extraDistanceRule?: Record<string, unknown> | null;
  capacityRule?: Record<string, unknown> | null;
  timeSlots?: Record<string, unknown>[] | Record<string, unknown> | null;
  readyStatus?: string;
  blackoutDates?: string[];
  openDates?: string[];
};

export type MerchantCapabilitySaveResponse = {
  capability: MerchantCapabilityItem;
};

export type MerchantCandidateItem = {
  candidateId: string | number;
  orderNo: string;
  standardServiceCode: string;
  requirementSummary?: string | Record<string, unknown> | null;
  quotePreview?: Record<string, unknown> | null;
  serviceAddress?: string | { address?: string; [key: string]: unknown } | null;
  requestedAppointment?: string | Record<string, unknown> | null;
  expiresAt?: string | null;
  status?: string;
  matchScore?: number | string | null;
  matchFactors?: Array<string | Record<string, unknown>> | Record<string, unknown> | null;
  distanceKm?: number | string | null;
  availabilityStatus?: string | null;
  pricing?: Record<string, unknown> | null;
  responseScore?: number | string | null;
};

export type MerchantOrderRequestsResponse = {
  list: MerchantCandidateItem[];
  total?: number;
  page?: number;
  pageSize?: number;
};

export type MerchantQuoteConfirmationRequest = {
  finalAmount: number;
  confirmedServiceTime: string;
  merchantNote?: string;
  validUntil?: string;
};

export type MerchantQuoteConfirmationResponse = {
  merchantQuoteConfirmationId: string | number;
  candidateId: string | number;
  orderNo: string;
  status: string;
  finalAmount: string | number;
  confirmedServiceTime: string;
};

export type MerchantCustomerReviewRequest = {
  orderNo: string;
  rating: number;
  content: string;
  imageUrls?: string[];
  publishToSquare?: boolean;
  squarePublishAnonymous?: boolean;
};

export type MerchantCustomerReviewResponse = {
  reviewId?: string | number;
  squarePostId?: string | number | null;
  squarePublishStatus?: string | null;
};

export type MerchantCreditProfileResponse = {
  score?: number | string | null;
  level?: string | null;
  badges?: string[];
  lastUpdatedAt?: string | null;
  events?: Array<{
    eventType?: string;
    title?: string;
    note?: string;
    description?: string;
    createdAt?: string;
    occurredAt?: string;
    scoreDelta?: number | string;
  }>;
};
