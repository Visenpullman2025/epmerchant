import type { MerchantOrderItem, MerchantOrderStatus } from "@/lib/api/merchant-api";

export const merchantOrderStatuses: MerchantOrderStatus[] = ["new", "pending", "inService", "done", "cancelled"];

export function toCanonicalWorkflowToken(raw?: string | null): string {
  if (raw == null || raw === "") return "";
  switch (raw) {
    case "merchant_confirmed":
      return "merchantConfirmed";
    case "in_service":
    case "after_sales":
      return "inService";
    case "merchant_done":
      return "merchantDone";
    default:
      return raw;
  }
}

export function rawWorkflowOf(order: MerchantOrderItem): string {
  if (order.workflowStatus) return order.workflowStatus;
  if (order.status === "pending" && order.confirmedServiceTime && paymentAllowsStart(order)) {
    return "merchantConfirmed";
  }
  return order.status;
}

export function workflowAllowsStartService(order: MerchantOrderItem): boolean {
  const w = toCanonicalWorkflowToken(rawWorkflowOf(order));
  if (w === "merchantConfirmed" || w === "confirmed" || w === "accepted") return true;
  if (!order.workflowStatus && order.status === "pending" && order.confirmedServiceTime) return true;
  return false;
}

export function paymentBlocksStart(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService === false) return true;
  if (
    order.paymentStatus != null &&
    String(order.paymentStatus).length > 0 &&
    order.paymentStatus !== "paid"
  ) {
    return true;
  }
  if (order.customerPaid === false) return true;
  return false;
}

export function paymentAllowsStart(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService === true) return true;
  if (order.paymentStatus === "paid") return true;
  if (order.customerPaid === true) return true;
  return false;
}

export function hasExplicitPaymentSignal(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService != null) return true;
  if (order.paymentStatus != null && String(order.paymentStatus).length > 0) return true;
  if (order.customerPaid != null) return true;
  return false;
}

export function isAwaitingMerchantStart(order: MerchantOrderItem): boolean {
  const w = toCanonicalWorkflowToken(rawWorkflowOf(order));
  if (
    w === "inService" ||
    w === "merchantDone" ||
    w === "after_sales" ||
    w === "done" ||
    w === "customer_completed" ||
    w === "customerConfirmed" ||
    w === "cancelled" ||
    w === "new"
  ) {
    return false;
  }
  const merchantTimeOk = w === "merchantConfirmed" || w === "accepted" || w === "confirmed";
  if (!merchantTimeOk) return false;
  if (order.canMerchantStartService === true) return true;
  return paymentAllowsStart(order);
}

export function needsScheduleEditor(order: MerchantOrderItem): boolean {
  if (order.status === "inService" || order.status === "done" || order.status === "cancelled") return false;
  if (isAwaitingMerchantStart(order)) return false;
  return order.status === "new" || order.status === "pending";
}

export function canClickStartService(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService === true) return true;
  if (!workflowAllowsStartService(order)) return false;
  if (paymentBlocksStart(order)) return false;
  return paymentAllowsStart(order) || !hasExplicitPaymentSignal(order);
}

export function normalizeWorkflowStatus(status?: string): MerchantOrderStatus {
  const s = toCanonicalWorkflowToken(status);
  switch (s) {
    case "pending":
    case "pending_merchant_confirm":
    case "merchantConfirmed":
    case "confirmed":
    case "accepted":
      return "pending";
    case "inService":
      return "inService";
    case "merchantDone":
    case "done":
    case "customer_completed":
    case "customerConfirmed":
      return "done";
    case "cancelled":
      return "cancelled";
    case "new":
    default:
      return "new";
  }
}
