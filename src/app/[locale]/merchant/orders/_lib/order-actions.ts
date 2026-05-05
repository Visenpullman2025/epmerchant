import type {
  MerchantOrderActionRequest,
  MerchantOrderActionResponse,
  MerchantOrderItem
} from "@/lib/api/merchant-api";
import { normalizeWorkflowStatus, toCanonicalWorkflowToken } from "./order-workflow";

export type MerchantOrderNextStatus = "merchantConfirmed" | "inService" | "merchantDone" | "cancelled";

export function buildMerchantOrderAction(
  orderNo: string,
  nextStatus: MerchantOrderNextStatus,
  confirmedServiceTime?: string,
  merchantNote?: string
): { path: string; payload: MerchantOrderActionRequest } | null {
  const note = merchantNote?.trim() || undefined;
  if (nextStatus === "merchantConfirmed") {
    return {
      path: `/api/merchant/orders/${orderNo}/confirm`,
      payload: { confirmedServiceTime: confirmedServiceTime || undefined, merchantNote: note }
    };
  }
  if (nextStatus === "inService") {
    return {
      path: `/api/merchant/orders/${orderNo}/start-service`,
      payload: { confirmedServiceTime: confirmedServiceTime || undefined, merchantNote: note }
    };
  }
  if (nextStatus === "merchantDone") {
    return {
      path: `/api/merchant/orders/${orderNo}/finish-service`,
      payload: { merchantNote: note }
    };
  }
  if (nextStatus === "cancelled") {
    return {
      path: `/api/merchant/orders/${orderNo}/cancel`,
      payload: {}
    };
  }
  return null;
}

export function mergeMerchantOrderActionResult(
  order: MerchantOrderItem,
  result: MerchantOrderActionResponse
): MerchantOrderItem {
  return {
    ...order,
    workflowStatus:
      result.workflowStatus != null && result.workflowStatus !== ""
        ? toCanonicalWorkflowToken(result.workflowStatus)
        : order.workflowStatus,
    status: normalizeWorkflowStatus(result.workflowStatus),
    confirmedServiceTime: result.confirmedServiceTime ?? order.confirmedServiceTime,
    merchantNote: result.merchantNote ?? order.merchantNote,
    fulfillmentEvents: result.fulfillmentEvents ?? order.fulfillmentEvents,
    settlement: result.settlement ?? order.settlement,
    creditImpact: result.creditImpact ?? order.creditImpact
  };
}
