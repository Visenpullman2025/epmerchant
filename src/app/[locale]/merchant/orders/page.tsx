"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { DEFAULT_LIST_LIMIT } from "@/lib/api/limits";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantOrderActionRequest,
  MerchantOrderActionResponse,
  MerchantCustomerReviewResponse,
  MerchantOrderItem,
  MerchantOrderStatus,
  MerchantOrdersResponse
} from "@/lib/api/merchant-api";

const statuses: MerchantOrderStatus[] = ["new", "pending", "inService", "done", "cancelled"];

type ReviewDraft = {
  rating: string;
  content: string;
  publishToSquare: boolean;
  squarePublishAnonymous: boolean;
};

const emptyReviewDraft: ReviewDraft = {
  rating: "5",
  content: "",
  publishToSquare: false,
  squarePublishAnonymous: true
};

function toCanonicalWorkflowToken(raw?: string | null): string {
  if (raw == null || raw === "") return "";
  switch (raw) {
    case "merchant_confirmed":
      return "merchantConfirmed";
    case "in_service":
      return "inService";
    case "merchant_done":
      return "merchantDone";
    default:
      return raw;
  }
}

/** 合并 snake_case 列表字段，便于与 Laravel 联调 */
function normalizeMerchantOrderRow(row: MerchantOrderItem): MerchantOrderItem {
  const r = row as unknown as Record<string, unknown>;
  const rawWs =
    (typeof row.workflowStatus === "string" ? row.workflowStatus : undefined) ??
    (typeof r.workflow_status === "string" ? r.workflow_status : undefined);
  const workflowStatus =
    rawWs != null && rawWs !== "" ? toCanonicalWorkflowToken(rawWs) : undefined;

  const rawPs =
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
  const wsCanon = workflowStatus ? toCanonicalWorkflowToken(workflowStatus) : "";
  if (wsCanon === "inService") {
    status = "inService";
  }

  return {
    ...row,
    status,
    workflowStatus,
    paymentStatus: rawPs,
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

function displayValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function rawWorkflowOf(order: MerchantOrderItem): string {
  if (order.workflowStatus) return order.workflowStatus;
  /** 联调兼容：仅有 tab 用 status、无 workflow 时，已确认时间 + 已付款视为商家已确认 */
  if (
    order.status === "pending" &&
    order.confirmedServiceTime &&
    paymentAllowsStart(order)
  ) {
    return "merchantConfirmed";
  }
  return order.status;
}

/** 仅「已确认上门时间」后可开始服务；含 accepted；无 workflowStatus 时以已保存的确认时间作为窄回退（联调兼容） */
function workflowAllowsStartService(order: MerchantOrderItem): boolean {
  const w = toCanonicalWorkflowToken(rawWorkflowOf(order));
  if (w === "merchantConfirmed" || w === "confirmed" || w === "accepted") return true;
  if (!order.workflowStatus && order.status === "pending" && order.confirmedServiceTime) return true;
  return false;
}

function paymentBlocksStart(order: MerchantOrderItem): boolean {
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

function paymentAllowsStart(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService === true) return true;
  if (order.paymentStatus === "paid") return true;
  if (order.customerPaid === true) return true;
  return false;
}

function hasExplicitPaymentSignal(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService != null) return true;
  if (order.paymentStatus != null && String(order.paymentStatus).length > 0) return true;
  if (order.customerPaid != null) return true;
  return false;
}

/**
 * 商家已确认上门时间且客户已付款（或后端明确允许开始服务），等待商家点「开始服务」。
 * 这类订单后端常仍挂在 status=pending 查询下，商户端应从「待确认」挪到「服务中」展示。
 */
function isAwaitingMerchantStart(order: MerchantOrderItem): boolean {
  const w = toCanonicalWorkflowToken(rawWorkflowOf(order));
  if (
    w === "inService" ||
    w === "merchantDone" ||
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

/** 已付款待上门订单不再展示「改时间/备注」大表单，仅保留「开始服务」 */
function needsScheduleEditor(order: MerchantOrderItem): boolean {
  if (order.status === "inService" || order.status === "done" || order.status === "cancelled") return false;
  if (isAwaitingMerchantStart(order)) return false;
  return order.status === "new" || order.status === "pending";
}

/** 后端显式 true 时可直接开始服务；否则走本地门禁与付款信号 */
function canClickStartService(order: MerchantOrderItem): boolean {
  if (order.canMerchantStartService === true) return true;
  if (!workflowAllowsStartService(order)) return false;
  if (paymentBlocksStart(order)) return false;
  return paymentAllowsStart(order) || !hasExplicitPaymentSignal(order);
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeWorkflowStatus(status?: string): MerchantOrderStatus {
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

function canShowCustomerReview(order: MerchantOrderItem): boolean {
  const w = toCanonicalWorkflowToken(rawWorkflowOf(order));
  const explicitAllowed =
    order.canReviewCustomer === true ||
    order.reviewable === true ||
    order.merchantCanReviewCustomer === true;
  const alreadyReviewed = Boolean(order.merchantReview || order.myReview);
  return !alreadyReviewed && (explicitAllowed || w === "customer_completed");
}

export default function MerchantOrdersPage() {
  const t = useTranslations("MerchantOrders");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const [activeStatus, setActiveStatus] = useState<MerchantOrderStatus>("new");
  const [orders, setOrders] = useState<MerchantOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [merchantNotes, setMerchantNotes] = useState<Record<string, string>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [reviewSubmittingNo, setReviewSubmittingNo] = useState<string | null>(null);

  function formatDateTime(value?: string | null) {
    if (!value) return t("unknown");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function getWorkflowLabel(workflowStatus?: string) {
    const s = toCanonicalWorkflowToken(workflowStatus);
    if (!s) return t("workflowStatus.new");
    switch (s) {
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

  async function loadOrders(status: MerchantOrderStatus, active = true) {
    setLoading(true);

    const finishList = (nextOrders: MerchantOrderItem[]) => {
      if (!active) return;
      setLoading(false);
      setOrders(nextOrders);
      setScheduleDrafts((current) => {
        const next = { ...current };
        nextOrders.forEach((order) => {
          next[order.orderNo] = current[order.orderNo] || toDateTimeLocalValue(order.confirmedServiceTime);
        });
        return next;
      });
      setMerchantNotes((current) => {
        const next = { ...current };
        nextOrders.forEach((order) => {
          next[order.orderNo] = current[order.orderNo] || order.merchantNote || "";
        });
        return next;
      });
      setReviewDrafts((current) => {
        const next = { ...current };
        nextOrders.forEach((order) => {
          if (!next[order.orderNo]) next[order.orderNo] = emptyReviewDraft;
        });
        return next;
      });
    };

    if (status === "inService") {
      const [inRes, pendRes] = await Promise.all([
        getJson<MerchantOrdersResponse>(`/api/merchant/orders?status=inService&page=1&pageSize=${DEFAULT_LIST_LIMIT}`),
        getJson<MerchantOrdersResponse>(`/api/merchant/orders?status=pending&page=1&pageSize=${DEFAULT_LIST_LIMIT}`)
      ]);
      if (!active) return;
      if (!inRes.ok && !pendRes.ok) {
        setLoading(false);
        setMessageTone("error");
        setMessage(inRes.ok ? pendRes.message : inRes.message);
        setOrders([]);
        return;
      }
      setMessage("");
      const listIn = inRes.ok ? inRes.data.list.map(normalizeMerchantOrderRow) : [];
      const listPend = pendRes.ok ? pendRes.data.list.map(normalizeMerchantOrderRow) : [];
      const byNo = new Map<string, MerchantOrderItem>();
      for (const o of listIn) byNo.set(o.orderNo, o);
      for (const o of listPend) {
        if (!byNo.has(o.orderNo)) byNo.set(o.orderNo, o);
      }
      const merged = [...byNo.values()].filter((o) => {
        const w = toCanonicalWorkflowToken(rawWorkflowOf(o));
        return w === "inService" || isAwaitingMerchantStart(o);
      });
      merged.sort((a, b) => {
        const pa = isAwaitingMerchantStart(a) ? 0 : 1;
        const pb = isAwaitingMerchantStart(b) ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return 0;
      });
      finishList(merged);
      return;
    }

    if (status === "pending") {
      const result = await getJson<MerchantOrdersResponse>(
        `/api/merchant/orders?status=pending&page=1&pageSize=${DEFAULT_LIST_LIMIT}`
      );
      if (!active) return;
      if (!result.ok) {
        setLoading(false);
        setMessageTone("error");
        setMessage(result.message);
        setOrders([]);
        return;
      }
      setMessage("");
      const nextOrders = result.data.list.map(normalizeMerchantOrderRow).filter((o) => !isAwaitingMerchantStart(o));
      finishList(nextOrders);
      return;
    }

    const result = await getJson<MerchantOrdersResponse>(
      `/api/merchant/orders?status=${status}&page=1&pageSize=${DEFAULT_LIST_LIMIT}`
    );
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      setOrders([]);
      return;
    }
    setMessage("");
    const nextOrders = result.data.list.map(normalizeMerchantOrderRow);
    finishList(nextOrders);
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadOrders(activeStatus, active);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [activeStatus]);

  async function updateStatus(order: MerchantOrderItem, nextStatus: string) {
    setMessage("");
    setMessageTone("error");
    const confirmedServiceTime = scheduleDrafts[order.orderNo];
    if ((nextStatus === "merchantConfirmed" || nextStatus === "inService") && !confirmedServiceTime) {
      setMessageTone("error");
      setMessage(t("scheduleRequired"));
      return;
    }

    const note = merchantNotes[order.orderNo]?.trim() || undefined;
    let path: string;
    let payload: MerchantOrderActionRequest;

    if (nextStatus === "merchantConfirmed") {
      path = `/api/merchant/orders/${order.orderNo}/confirm`;
      payload = { confirmedServiceTime: confirmedServiceTime || undefined, merchantNote: note };
    } else if (nextStatus === "inService") {
      path = `/api/merchant/orders/${order.orderNo}/start-service`;
      payload = { confirmedServiceTime: confirmedServiceTime || undefined, merchantNote: note };
    } else if (nextStatus === "merchantDone") {
      path = `/api/merchant/orders/${order.orderNo}/finish-service`;
      payload = { merchantNote: note };
    } else if (nextStatus === "cancelled") {
      path = `/api/merchant/orders/${order.orderNo}/cancel`;
      payload = {};
    } else {
      return;
    }

    const result = await postJson<MerchantOrderActionResponse>(path, payload);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }

    let tone: "error" | "info" = "error";
    let successMsg = "";
    if (nextStatus === "cancelled" && order.status === "inService") {
      const d = result.data;
      if (d.penaltyMessage?.trim()) {
        tone = "info";
        successMsg = d.penaltyMessage.trim();
      } else if (d.penaltyAmount != null && String(d.penaltyAmount).trim() !== "") {
        tone = "info";
        successMsg = d.penaltyCapped
          ? t("cancelPenaltyAppliedCapped", { amount: String(d.penaltyAmount) })
          : t("cancelPenaltyApplied", { amount: String(d.penaltyAmount) });
      }
    }
    setMessageTone(tone);
    setMessage(successMsg);
    setScheduleDrafts((current) => ({
      ...current,
      [order.orderNo]:
        toDateTimeLocalValue(result.data.confirmedServiceTime) || current[order.orderNo] || ""
    }));
    setMerchantNotes((current) => ({
      ...current,
      [order.orderNo]: result.data.merchantNote ?? current[order.orderNo] ?? ""
    }));
    setOrders((prev) =>
      prev.map((item) =>
        item.orderNo === order.orderNo
          ? {
              ...item,
              workflowStatus:
                result.data.workflowStatus != null && result.data.workflowStatus !== ""
                  ? toCanonicalWorkflowToken(result.data.workflowStatus)
                  : item.workflowStatus,
              status: normalizeWorkflowStatus(result.data.workflowStatus),
              confirmedServiceTime: result.data.confirmedServiceTime ?? item.confirmedServiceTime,
              merchantNote: result.data.merchantNote ?? item.merchantNote,
              fulfillmentEvents: result.data.fulfillmentEvents ?? item.fulfillmentEvents,
              settlement: result.data.settlement ?? item.settlement,
              creditImpact: result.data.creditImpact ?? item.creditImpact
            }
          : item
      )
    );
    setLoading(true);
    void loadOrders(activeStatus);
  }

  function requestCancel(order: MerchantOrderItem) {
    if (order.status === "inService") {
      const displayAmount = order.quotedAmount || order.amount;
      const parsed = parseFloat(String(displayAmount).replace(/,/g, ""));
      const messageKey = Number.isFinite(parsed) ? "cancelPenaltyConfirm" : "cancelPenaltyConfirmGeneric";
      const penalty = Number.isFinite(parsed) ? (parsed * 0.2).toFixed(2) : "";
      const confirmText =
        messageKey === "cancelPenaltyConfirm"
          ? t("cancelPenaltyConfirm", { penalty, orderAmount: displayAmount })
          : t("cancelPenaltyConfirmGeneric");
      if (!window.confirm(confirmText)) return;
    }
    void updateStatus(order, "cancelled");
  }

  async function submitCustomerReview(order: MerchantOrderItem) {
    const draft = reviewDrafts[order.orderNo] || emptyReviewDraft;
    const rating = Number(draft.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setMessageTone("error");
      setMessage(t("reviewRatingRequired"));
      return;
    }
    if (!draft.content.trim()) {
      setMessageTone("error");
      setMessage(t("reviewContentRequired"));
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
    setOrders((current) =>
      current.map((item) =>
        item.orderNo === order.orderNo
          ? {
              ...item,
              merchantReview: result.data as Record<string, unknown>,
              canReviewCustomer: false,
              reviewable: false,
              merchantCanReviewCustomer: false
            }
          : item
      )
    );
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-dashboard-hero.svg"
      subtitle={activeStatus === "inService" ? t("subtitleInService") : t("subtitle")}
      title={t("title")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("live")}</span>}
    >
      <div className="mt-4 flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            className={`merchant-segment-item ${activeStatus === status ? "active" : ""}`}
            key={status}
            onClick={() => {
              setLoading(true);
              setMessage("");
              setMessageTone("error");
              setActiveStatus(status);
            }}
            type="button"
          >
            {t(`tabs.${status}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        {message ? (
          <div
            className="rounded-xl border p-4 text-sm"
            style={{
              borderColor: messageTone === "info" ? "var(--border)" : "var(--danger)",
              color: messageTone === "info" ? "var(--foreground)" : "var(--danger)"
            }}
          >
            {message}
          </div>
        ) : null}
        {orders.length ? (
          orders.map((order) => {
            const currentWorkflow = rawWorkflowOf(order);
            const awaitingStart = isAwaitingMerchantStart(order);
            const showScheduleEditor = needsScheduleEditor(order);
            const showInServiceReschedule = order.status === "inService";
            const showStartService =
              workflowAllowsStartService(order) || order.canMerchantStartService === true;
            const startEnabled = canClickStartService(order);
            const showAwaitPayment = showStartService && !startEnabled;
            const canMarkDone = order.status === "inService";
            const canCancel = order.status !== "done" && order.status !== "cancelled";
            const displayAmount = order.quotedAmount || order.amount;
            const customerRating =
              typeof order.customerRating === "number"
                ? `${order.customerRating.toFixed(1)} / 5`
                : t("noRating");
            const timeSummary = formatDateTime(order.confirmedServiceTime || order.appointmentTime);
            const addressFull = order.serviceAddress?.address?.trim() || "";
            const addressShort =
              addressFull.length > 32 ? `${addressFull.slice(0, 32)}…` : addressFull || t("unknown");
            const fulfillmentEvents = order.fulfillmentEvents || [];
            const settlement = order.settlement;
            const creditImpact = order.creditImpact;
            const pricing = order.pricing || order.pricingSnapshot;
            const reviewDraft = reviewDrafts[order.orderNo] || emptyReviewDraft;
            const showCustomerReview = canShowCustomerReview(order);

            return (
              <article className="merchant-order-card merchant-order-card--compact" key={order.orderNo}>
                <div className="flex gap-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)"
                    }}
                  >
                    {(order.customerName || "?").slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
                          {order.orderNo}
                        </p>
                        <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">
                          {order.serviceTitle || order.serviceType || t("unknown")}
                        </h3>
                        {order.serviceSubtitle ? (
                          <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                            {order.serviceSubtitle}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className="merchant-status-chip py-0.5 text-[11px]"
                          style={{
                            backgroundColor: awaitingStart ? "#fff7ed" : "#e8f2ff",
                            color: awaitingStart ? "#c2410c" : "#2256c5"
                          }}
                        >
                          {awaitingStart ? t("badgeAwaitingStart") : getWorkflowLabel(currentWorkflow)}
                        </span>
                        <span className="merchant-price-pill py-1 text-[13px]">{displayAmount || t("unknown")}</span>
                      </div>
                    </div>
                    <p className="merchant-order-compact-meta mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {order.customerName || t("unknown")}
                      </span>
                      <span style={{ color: "var(--border)" }}> · </span>
                      <span>{timeSummary}</span>
                      <span style={{ color: "var(--border)" }}> · </span>
                      <span>{addressShort}</span>
                    </p>
                  </div>
                </div>

                <details className="merchant-order-details mt-2.5 rounded-xl border px-2.5 py-1.5" style={{ borderColor: "var(--border)" }}>
                  <summary
                    className="cursor-pointer text-xs font-medium outline-none [&::-webkit-details-marker]:hidden"
                    style={{ color: "var(--primary)", listStyle: "none" }}
                  >
                    {t("orderDetails")}
                  </summary>
                  <div className="merchant-order-detail-rows mt-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <p className="field-label">{t("customerInfo")}</p>
                      <p className="text-sm font-semibold">{order.customerName || t("unknown")}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                        {t("customerRating")}: {customerRating} · {t("customerLevel")}: {order.customerLevel || t("unknown")} ·{" "}
                        {t("completedOrders")}: {order.completedOrderCount ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="field-label">{t("serviceAddress")}</p>
                      <p className="text-sm">{order.serviceAddress?.address || t("unknown")}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                        {t("distanceKm")}: {order.distanceKm != null ? `${order.distanceKm} km` : t("unknown")}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                        {t("appointmentTime")}: {formatDateTime(order.appointmentTime)} · {t("confirmedServiceTime")}:{" "}
                        {formatDateTime(order.confirmedServiceTime)}
                      </p>
                    </div>
                    <div>
                      <p className="field-label">{t("quotedAmount")}</p>
                      <p className="text-sm font-semibold">{displayAmount || t("unknown")}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                        {t("orderCreatedAt")}: {formatDateTime(order.createdAt)} · {t("remark")}: {order.remark || t("unknown")}
                      </p>
                    </div>
                    {pricing ? (
                      <div>
                        <p className="field-label">{t("pricing")}</p>
                        <p className="break-words text-xs" style={{ color: "var(--muted)" }}>
                          {displayValue(pricing)}
                        </p>
                      </div>
                    ) : null}
                    {fulfillmentEvents.length ? (
                      <div>
                        <p className="field-label">{t("fulfillmentEvents")}</p>
                        <div className="space-y-1">
                          {fulfillmentEvents.map((event, index) => (
                            <p className="text-xs" key={`${order.orderNo}-event-${index}`} style={{ color: "var(--muted)" }}>
                              <span className="font-semibold" style={{ color: "var(--text)" }}>
                                {event.eventType || event.type || t("unknown")}
                              </span>{" "}
                              {formatDateTime(event.occurredAt || event.createdAt)} {event.title || event.note || event.description || ""}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {settlement ? (
                      <div>
                        <p className="field-label">{t("settlement")}</p>
                        <p className="break-words text-xs" style={{ color: "var(--muted)" }}>
                          {displayValue(settlement)}
                        </p>
                      </div>
                    ) : null}
                    {creditImpact ? (
                      <div>
                        <p className="field-label">{t("creditImpact")}</p>
                        <p className="break-words text-xs" style={{ color: "var(--muted)" }}>
                          {displayValue(creditImpact)}
                        </p>
                      </div>
                    ) : null}
                    <div className="space-y-0.5 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
                      <p>{t("paymentFrozenHint")}</p>
                      <p>{t("reviewHint")}</p>
                    </div>
                  </div>
                </details>

                {showScheduleEditor ? (
                  <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-2.5">
                    <div>
                      <label className="field-label">{t("confirmedServiceTime")}</label>
                      <input
                        className="field-input"
                        min={toDateTimeLocalValue(order.appointmentTime) || undefined}
                        type="datetime-local"
                        value={scheduleDrafts[order.orderNo] || ""}
                        onChange={(event) =>
                          setScheduleDrafts((current) => ({
                            ...current,
                            [order.orderNo]: event.target.value
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">{t("merchantNote")}</label>
                      <input
                        className="field-input"
                        placeholder={t("merchantNote")}
                        value={merchantNotes[order.orderNo] || ""}
                        onChange={(event) =>
                          setMerchantNotes((current) => ({
                            ...current,
                            [order.orderNo]: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {showInServiceReschedule ? (
                  <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-2.5">
                    <div>
                      <label className="field-label">{t("confirmedServiceTime")}</label>
                      <input
                        className="field-input"
                        min={toDateTimeLocalValue(order.appointmentTime) || undefined}
                        type="datetime-local"
                        value={scheduleDrafts[order.orderNo] || ""}
                        onChange={(event) =>
                          setScheduleDrafts((current) => ({
                            ...current,
                            [order.orderNo]: event.target.value
                          }))
                        }
                      />
                      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                        {t("rescheduleCompensationHint")}
                      </p>
                    </div>
                    <div className="mt-3">
                      <button className="apple-btn-primary" onClick={() => updateStatus(order, "inService")} type="button">
                        {t("updateSchedule")}
                      </button>
                    </div>
                  </div>
                ) : null}

                {showCustomerReview ? (
                  <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-2.5">
                    <div>
                      <label className="field-label">{t("reviewRating")}</label>
                      <select
                        className="field-select"
                        value={reviewDraft.rating}
                        onChange={(event) =>
                          setReviewDrafts((current) => ({
                            ...current,
                            [order.orderNo]: {
                              ...(current[order.orderNo] || emptyReviewDraft),
                              rating: event.target.value
                            }
                          }))
                        }
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={String(rating)}>
                            {rating}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">{t("reviewContent")}</label>
                      <textarea
                        className="field-textarea"
                        value={reviewDraft.content}
                        onChange={(event) =>
                          setReviewDrafts((current) => ({
                            ...current,
                            [order.orderNo]: {
                              ...(current[order.orderNo] || emptyReviewDraft),
                              content: event.target.value
                            }
                          }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        checked={reviewDraft.publishToSquare}
                        onChange={(event) =>
                          setReviewDrafts((current) => ({
                            ...current,
                            [order.orderNo]: {
                              ...(current[order.orderNo] || emptyReviewDraft),
                              publishToSquare: event.target.checked
                            }
                          }))
                        }
                        type="checkbox"
                      />
                      {t("publishToSquare")}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        checked={reviewDraft.squarePublishAnonymous}
                        onChange={(event) =>
                          setReviewDrafts((current) => ({
                            ...current,
                            [order.orderNo]: {
                              ...(current[order.orderNo] || emptyReviewDraft),
                              squarePublishAnonymous: event.target.checked
                            }
                          }))
                        }
                        type="checkbox"
                      />
                      {t("squarePublishAnonymous")}
                    </label>
                    <button
                      className="apple-btn-primary"
                      disabled={reviewSubmittingNo === order.orderNo}
                      onClick={() => submitCustomerReview(order)}
                      type="button"
                    >
                      {reviewSubmittingNo === order.orderNo ? t("reviewSubmitting") : t("reviewCustomer")}
                    </button>
                  </div>
                ) : null}

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {showScheduleEditor ? (
                    <button className="apple-btn-primary" onClick={() => updateStatus(order, "merchantConfirmed")} type="button">
                      {order.confirmedServiceTime ? t("updateSchedule") : t("saveSchedule")}
                    </button>
                  ) : null}
                  {showStartService ? (
                    <button
                      className="apple-btn-secondary"
                      disabled={!startEnabled}
                      onClick={() => updateStatus(order, "inService")}
                      type="button"
                    >
                      {t("actions.inService")}
                    </button>
                  ) : null}
                  {showAwaitPayment ? (
                    <p className="w-full text-sm" style={{ color: "var(--muted)" }}>
                      {t("awaitPayment")}
                    </p>
                  ) : null}
                  {canMarkDone ? (
                    <button className="apple-btn-secondary" onClick={() => updateStatus(order, "merchantDone")} type="button">
                      {t("actions.done")}
                    </button>
                  ) : null}
                  {canCancel ? (
                    <button className="apple-btn-secondary" onClick={() => requestCancel(order)} type="button">
                      {t("actions.cancelled")}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("empty")}
          </div>
        )}
      </div>
    </MerchantScaffold>
  );
}
