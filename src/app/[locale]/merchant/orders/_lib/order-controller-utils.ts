import type { MerchantOrderActionResponse, MerchantOrderItem } from "@/lib/api/merchant-api";
import type { MerchantOrderNextStatus } from "./order-actions";
import { toDateTimeLocalValue } from "./order-format";
import { toCanonicalWorkflowToken } from "./order-workflow";
import { emptyReviewDraft, type ReviewDraft } from "./review";

export type Translate = (key: string, values?: Record<string, string>) => string;

export function seedScheduleDrafts(current: Record<string, string>, orders: MerchantOrderItem[]) {
  const next = { ...current };
  orders.forEach((order) => {
    next[order.orderNo] = current[order.orderNo] || toDateTimeLocalValue(order.confirmedServiceTime);
  });
  return next;
}

export function seedMerchantNotes(current: Record<string, string>, orders: MerchantOrderItem[]) {
  const next = { ...current };
  orders.forEach((order) => {
    next[order.orderNo] = current[order.orderNo] || order.merchantNote || "";
  });
  return next;
}

export function seedReviewDrafts(current: Record<string, ReviewDraft>, orders: MerchantOrderItem[]) {
  const next = { ...current };
  orders.forEach((order) => {
    if (!next[order.orderNo]) next[order.orderNo] = emptyReviewDraft;
  });
  return next;
}

export function getWorkflowLabel(workflowStatus: string | undefined, t: Translate) {
  const status = toCanonicalWorkflowToken(workflowStatus);
  if (!status) return t("workflowStatus.new");
  switch (status) {
    case "pending":
    case "pending_merchant_confirm":
      return t("workflowStatus.pending_merchant_confirm");
    case "accepted":
    case "merchantConfirmed":
      return t("workflowStatus.merchantConfirmed");
    case "inService":
      return t("workflowStatus.inService");
    case "merchantDone":
      return t("workflowStatus.merchantDone");
    case "done":
      return t("workflowStatus.done");
    case "customer_completed":
      return t("workflowStatus.customer_completed");
    case "cancelled":
      return t("workflowStatus.cancelled");
    case "new":
    default:
      return t("workflowStatus.new");
  }
}

export function confirmInServiceCancellation(order: MerchantOrderItem, t: Translate) {
  const displayAmount = order.quotedAmount || order.amount;
  const parsed = parseFloat(String(displayAmount).replace(/,/g, ""));
  const penalty = Number.isFinite(parsed) ? (parsed * 0.2).toFixed(2) : "";
  const confirmText = Number.isFinite(parsed)
    ? t("cancelPenaltyConfirm", { penalty, orderAmount: displayAmount })
    : t("cancelPenaltyConfirmGeneric");
  return window.confirm(confirmText);
}

export function cancellationPenaltyMessage(
  order: MerchantOrderItem,
  nextStatus: MerchantOrderNextStatus,
  result: MerchantOrderActionResponse,
  t: Translate
) {
  if (nextStatus !== "cancelled" || order.status !== "inService") return "";
  if (result.penaltyMessage?.trim()) return result.penaltyMessage.trim();
  if (result.penaltyAmount == null || String(result.penaltyAmount).trim() === "") return "";
  return result.penaltyCapped
    ? t("cancelPenaltyAppliedCapped", { amount: String(result.penaltyAmount) })
    : t("cancelPenaltyApplied", { amount: String(result.penaltyAmount) });
}

export function reviewValidationMessage(draft: ReviewDraft, t: Translate) {
  const rating = Number(draft.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return t("reviewRatingRequired");
  if (!draft.content.trim()) return t("reviewContentRequired");
  return "";
}

export function markCustomerReviewed(
  orders: MerchantOrderItem[],
  orderNo: string,
  review: Record<string, unknown>
) {
  return orders.map((order) =>
    order.orderNo === orderNo
      ? {
          ...order,
          merchantReview: review,
          canReviewCustomer: false,
          reviewable: false,
          merchantCanReviewCustomer: false
        }
      : order
  );
}
