"use client";

import { useCallback, useEffect, useState } from "react";
import { postJson } from "@/lib/merchant/auth-client";
import type { MerchantCustomerReviewResponse, MerchantOrderActionResponse, MerchantOrderItem, MerchantOrderStatus } from "@/lib/api/merchant-api";
import { buildMerchantOrderAction, mergeMerchantOrderActionResult, type MerchantOrderNextStatus } from "./order-actions";
import {
  cancellationPenaltyMessage,
  confirmInServiceCancellation,
  getWorkflowLabel,
  markCustomerReviewed,
  reviewValidationMessage,
  seedMerchantNotes,
  seedReviewDrafts,
  seedScheduleDrafts,
  type Translate
} from "./order-controller-utils";
import { fetchOrdersForStatus } from "./order-fetch";
import { toDateTimeLocalValue } from "./order-format";
import { emptyReviewDraft, type ReviewDraft } from "./review";

export function useMerchantOrdersController(t: Translate, initialStatus: MerchantOrderStatus = "new") {
  const [activeStatus, setActiveStatus] = useState<MerchantOrderStatus>(initialStatus);
  const [orders, setOrders] = useState<MerchantOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [merchantNotes, setMerchantNotes] = useState<Record<string, string>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [reviewSubmittingNo, setReviewSubmittingNo] = useState<string | null>(null);

  const primeDrafts = useCallback((nextOrders: MerchantOrderItem[]) => {
    setScheduleDrafts((current) => seedScheduleDrafts(current, nextOrders));
    setMerchantNotes((current) => seedMerchantNotes(current, nextOrders));
    setReviewDrafts((current) => seedReviewDrafts(current, nextOrders));
  }, []);

  const loadOrders = useCallback(async (status: MerchantOrderStatus, active = true) => {
    setLoading(true);
    const result = await fetchOrdersForStatus(status);
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      setOrders([]);
      return;
    }
    setMessage("");
    setOrders(result.orders);
    primeDrafts(result.orders);
  }, [primeDrafts]);

  useEffect(() => {
    setActiveStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadOrders(activeStatus, active);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeStatus, loadOrders]);

  async function updateStatus(order: MerchantOrderItem, nextStatus: MerchantOrderNextStatus) {
    setMessage("");
    setMessageTone("error");
    const confirmedServiceTime = scheduleDrafts[order.orderNo];
    if ((nextStatus === "merchantConfirmed" || nextStatus === "inService") && !confirmedServiceTime) {
      setMessage(t("scheduleRequired"));
      return;
    }

    const action = buildMerchantOrderAction(
      order.orderNo,
      nextStatus,
      confirmedServiceTime,
      merchantNotes[order.orderNo]
    );
    if (!action) return;

    const result = await postJson<MerchantOrderActionResponse>(action.path, action.payload);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    applyActionSuccess(order, nextStatus, result.data);
    setLoading(true);
    void loadOrders(activeStatus);
  }

  function applyActionSuccess(
    order: MerchantOrderItem,
    nextStatus: MerchantOrderNextStatus,
    result: MerchantOrderActionResponse
  ) {
    const cancellationMessage = cancellationPenaltyMessage(order, nextStatus, result, t);
    setMessageTone(cancellationMessage ? "info" : "error");
    setMessage(cancellationMessage);
    setScheduleDrafts((current) => ({
      ...current,
      [order.orderNo]: toDateTimeLocalValue(result.confirmedServiceTime) || current[order.orderNo] || ""
    }));
    setMerchantNotes((current) => ({
      ...current,
      [order.orderNo]: result.merchantNote ?? current[order.orderNo] ?? ""
    }));
    setOrders((current) =>
      current.map((item) =>
        item.orderNo === order.orderNo ? mergeMerchantOrderActionResult(item, result) : item
      )
    );
  }

  function requestCancel(order: MerchantOrderItem) {
    if (order.status === "inService" && !confirmInServiceCancellation(order, t)) return;
    void updateStatus(order, "cancelled");
  }

  async function submitCustomerReview(order: MerchantOrderItem) {
    const draft = reviewDrafts[order.orderNo] || emptyReviewDraft;
    const validationMessage = reviewValidationMessage(draft, t);
    const rating = Number(draft.rating);
    if (validationMessage) {
      setMessageTone("error");
      setMessage(validationMessage);
      return;
    }

    setReviewSubmittingNo(order.orderNo);
    setMessage("");
    const result = await postJson<MerchantCustomerReviewResponse>("/api/merchant/reviews", {
      orderNo: order.orderNo,
      rating,
      content: draft.content.trim(),
      publishToSquare: draft.publishToSquare,
      squarePublishAnonymous: draft.squarePublishAnonymous
    });
    setReviewSubmittingNo(null);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }
    setMessageTone("info");
    setMessage(t("reviewSubmitted"));
    setOrders((current) => markCustomerReviewed(current, order.orderNo, result.data as Record<string, unknown>));
  }

  return {
    activeStatus,
    orders,
    loading,
    message,
    messageTone,
    scheduleDrafts,
    merchantNotes,
    reviewDrafts,
    reviewSubmittingNo,
    getWorkflowLabel: (workflowStatus?: string) => getWorkflowLabel(workflowStatus, t),
    setActiveStatus: (status: MerchantOrderStatus) => {
      setLoading(true);
      setMessage("");
      setMessageTone("error");
      setActiveStatus(status);
    },
    setMerchantNote: (orderNo: string, value: string) =>
      setMerchantNotes((current) => ({ ...current, [orderNo]: value })),
    setReviewDraft: (orderNo: string, draft: ReviewDraft) =>
      setReviewDrafts((current) => ({ ...current, [orderNo]: draft })),
    setScheduleDraft: (orderNo: string, value: string) =>
      setScheduleDrafts((current) => ({ ...current, [orderNo]: value })),
    requestCancel,
    submitCustomerReview,
    updateStatus
  };
}
