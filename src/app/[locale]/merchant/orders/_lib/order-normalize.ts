import type { MerchantOrderItem } from "@/lib/api/merchant-api";
import { toCanonicalWorkflowToken } from "./order-workflow";

export function normalizeMerchantOrderRow(row: MerchantOrderItem): MerchantOrderItem {
  const r = row as unknown as Record<string, unknown>;
  const rawWorkflowStatus =
    (typeof row.workflowStatus === "string" ? row.workflowStatus : undefined) ??
    (typeof r.workflow_status === "string" ? r.workflow_status : undefined);
  const workflowStatus =
    rawWorkflowStatus != null && rawWorkflowStatus !== ""
      ? toCanonicalWorkflowToken(rawWorkflowStatus)
      : undefined;

  const paymentStatus =
    (typeof row.paymentStatus === "string" ? row.paymentStatus : undefined) ??
    (typeof r.payment_status === "string" ? r.payment_status : undefined);

  let customerPaid = row.customerPaid;
  if (customerPaid === undefined && r.customer_paid !== undefined && r.customer_paid !== null) {
    customerPaid = Boolean(r.customer_paid);
  }

  let canMerchantStartService = row.canMerchantStartService;
  if (
    canMerchantStartService === undefined &&
    r.can_merchant_start_service !== undefined &&
    r.can_merchant_start_service !== null
  ) {
    canMerchantStartService = Boolean(r.can_merchant_start_service);
  }

  const merchantNote =
    row.merchantNote ??
    (typeof r.merchant_note === "string" ? r.merchant_note : null) ??
    null;
  const confirmedServiceTime =
    row.confirmedServiceTime ??
    (typeof r.confirmed_service_time === "string" ? r.confirmed_service_time : null) ??
    null;
  const fulfillmentEvents =
    row.fulfillmentEvents ??
    (Array.isArray(r.fulfillment_events) ? (r.fulfillment_events as MerchantOrderItem["fulfillmentEvents"]) : undefined);
  const settlement =
    row.settlement ??
    (r.settlement && typeof r.settlement === "object" ? (r.settlement as MerchantOrderItem["settlement"]) : undefined);
  const creditImpact =
    row.creditImpact ??
    (r.credit_impact && typeof r.credit_impact === "object" ? (r.credit_impact as MerchantOrderItem["creditImpact"]) : undefined);
  const pricing =
    row.pricing ??
    (r.pricing && typeof r.pricing === "object" ? (r.pricing as MerchantOrderItem["pricing"]) : undefined);

  let status = row.status;
  if (typeof r.status === "string" && r.status === "in_service") {
    status = "inService";
  }
  if (workflowStatus && toCanonicalWorkflowToken(workflowStatus) === "inService") {
    status = "inService";
  }

  return {
    ...row,
    status,
    workflowStatus,
    paymentStatus,
    customerPaid,
    canMerchantStartService,
    merchantNote,
    confirmedServiceTime,
    fulfillmentEvents,
    settlement,
    creditImpact,
    pricing
  };
}
