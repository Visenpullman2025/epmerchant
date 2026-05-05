import type { MerchantOrderItem } from "@/lib/api/merchant-api";
import { rawWorkflowOf, toCanonicalWorkflowToken } from "./order-workflow";

export type ReviewDraft = {
  rating: string;
  content: string;
  publishToSquare: boolean;
  squarePublishAnonymous: boolean;
};

export const emptyReviewDraft: ReviewDraft = {
  rating: "5",
  content: "",
  publishToSquare: false,
  squarePublishAnonymous: true
};

export function canShowCustomerReview(order: MerchantOrderItem): boolean {
  const workflowStatus = toCanonicalWorkflowToken(rawWorkflowOf(order));
  const explicitAllowed =
    order.canReviewCustomer === true ||
    order.reviewable === true ||
    order.merchantCanReviewCustomer === true;
  const alreadyReviewed = Boolean(order.merchantReview || order.myReview);
  return !alreadyReviewed && (explicitAllowed || workflowStatus === "customer_completed");
}
