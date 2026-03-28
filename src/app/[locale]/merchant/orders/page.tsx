"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantOrderItem,
  MerchantOrderStatus,
  MerchantOrderTransitionRequest,
  MerchantOrderTransitionResponse,
  MerchantOrdersResponse
} from "@shared/api/contracts/merchant-api";

const statuses: MerchantOrderStatus[] = ["new", "pending", "inService", "done", "cancelled"];

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

  let status = row.status;
  if (typeof r.status === "string" && r.status === "in_service") {
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
    confirmedServiceTime
  };
}

function rawWorkflowOf(order: MerchantOrderItem): string {
  return order.workflowStatus || order.status;
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
    const result = await getJson<MerchantOrdersResponse>(
      `/api/merchant/orders?status=${status}&page=1&pageSize=20`
    );
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      setOrders([]);
      return;
    }
    const nextOrders = result.data.list.map(normalizeMerchantOrderRow);
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

    const payload: MerchantOrderTransitionRequest = {
      targetStatus: nextStatus,
      confirmedServiceTime: confirmedServiceTime || undefined,
      merchantNote: merchantNotes[order.orderNo]?.trim() || undefined
    };

    const result = await postJson<MerchantOrderTransitionResponse>(
      `/api/merchant/orders/${order.orderNo}/transition`,
      payload
    );
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
              merchantNote: result.data.merchantNote ?? item.merchantNote
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

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-dashboard-hero.svg"
      subtitle={t("subtitle")}
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

      <div className="mt-4 space-y-3">
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
            const showScheduleEditor = order.status === "new" || order.status === "pending";
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

            return (
              <article className="merchant-order-card" key={order.orderNo}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {order.orderNo}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {order.serviceTitle || order.serviceType || t("unknown")}
                    </h3>
                    {order.serviceSubtitle ? (
                      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                        {order.serviceSubtitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="merchant-status-chip" style={{ backgroundColor: "#e8f2ff", color: "#2256c5" }}>
                      {getWorkflowLabel(currentWorkflow)}
                    </span>
                    <span className="merchant-price-pill">{displayAmount || t("unknown")}</span>
                  </div>
                </div>

                <div className="merchant-order-info-grid mt-4">
                  <div className="merchant-order-info-card">
                    <p className="field-label">{t("customerInfo")}</p>
                    <p className="font-semibold">{order.customerName || t("unknown")}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("customerRating")}: {customerRating}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("customerLevel")}: {order.customerLevel || t("unknown")}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("completedOrders")}: {order.completedOrderCount ?? 0}
                    </p>
                  </div>

                  <div className="merchant-order-info-card">
                    <p className="field-label">{t("serviceAddress")}</p>
                    <p className="text-sm">{order.serviceAddress?.address || t("unknown")}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("distanceKm")}: {order.distanceKm != null ? `${order.distanceKm} km` : t("unknown")}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("appointmentTime")}: {formatDateTime(order.appointmentTime)}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("confirmedServiceTime")}: {formatDateTime(order.confirmedServiceTime)}
                    </p>
                  </div>

                  <div className="merchant-order-info-card">
                    <p className="field-label">{t("quotedAmount")}</p>
                    <p className="font-semibold">{displayAmount || t("unknown")}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("orderCreatedAt")}: {formatDateTime(order.createdAt)}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t("remark")}: {order.remark || t("unknown")}
                    </p>
                  </div>
                </div>

                {showScheduleEditor ? (
                  <div className="merchant-order-action-panel mt-4">
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
                  <div className="merchant-order-action-panel mt-4">
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

                <div className="mt-4 flex flex-wrap gap-2">
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

                <div className="mt-3 space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                  <p>{t("paymentFrozenHint")}</p>
                  <p>{t("reviewHint")}</p>
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
