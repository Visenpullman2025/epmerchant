"use client";

import type { MerchantOrderItem } from "@/lib/api/merchant-api";
import {
  canClickStartService,
  isAwaitingMerchantStart,
  needsScheduleEditor,
  rawWorkflowOf,
  workflowAllowsStartService
} from "../_lib/order-workflow";
import {
  formatDateTime,
  shortAddress,
  toDateTimeLocalValue
} from "../_lib/order-format";
import { canShowCustomerReview, emptyReviewDraft, type ReviewDraft } from "../_lib/review";
import type { MerchantOrderNextStatus } from "../_lib/order-actions";
import {
  CustomerReviewPanel,
  InServiceReschedule,
  OrderActions,
  ScheduleEditor
} from "./OrderActionPanels";
import OrderDetailsSection from "./OrderDetailsSection";

type Translate = (key: string, values?: Record<string, string>) => string;

type Props = {
  locale: string;
  order: MerchantOrderItem;
  t: Translate;
  scheduleDraft: string;
  merchantNote: string;
  reviewDraft?: ReviewDraft;
  reviewSubmitting: boolean;
  workflowLabel: (workflowStatus?: string) => string;
  onScheduleDraftChange: (value: string) => void;
  onMerchantNoteChange: (value: string) => void;
  onReviewDraftChange: (draft: ReviewDraft) => void;
  onRequestCancel: () => void;
  onSubmitReview: () => void;
  onUpdateStatus: (nextStatus: MerchantOrderNextStatus) => void;
};

export default function MerchantOrderCard({
  locale,
  order,
  t,
  scheduleDraft,
  merchantNote,
  reviewDraft = emptyReviewDraft,
  reviewSubmitting,
  workflowLabel,
  onScheduleDraftChange,
  onMerchantNoteChange,
  onReviewDraftChange,
  onRequestCancel,
  onSubmitReview,
  onUpdateStatus
}: Props) {
  const currentWorkflow = rawWorkflowOf(order);
  const awaitingStart = isAwaitingMerchantStart(order);
  const showScheduleEditor = needsScheduleEditor(order);
  const showInServiceReschedule = order.status === "inService";
  const showStartService = workflowAllowsStartService(order) || order.canMerchantStartService === true;
  const startEnabled = canClickStartService(order);
  const showAwaitPayment = showStartService && !startEnabled;
  const canMarkDone = order.status === "inService";
  const canCancel = order.status !== "done" && order.status !== "cancelled";
  const displayAmount = order.quotedAmount || order.amount;
  const customerRating =
    typeof order.customerRating === "number" ? `${order.customerRating.toFixed(1)} / 5` : t("noRating");
  const timeSummary = formatDateTime(order.confirmedServiceTime || order.appointmentTime, locale, t("unknown"));
  const showCustomerReview = canShowCustomerReview(order);

  return (
    <article className="merchant-order-card merchant-order-card--compact">
      <OrderHeader
        awaitingStart={awaitingStart}
        displayAmount={displayAmount || t("unknown")}
        order={order}
        statusLabel={awaitingStart ? t("badgeAwaitingStart") : workflowLabel(currentWorkflow)}
        t={t}
        timeSummary={timeSummary}
        addressShort={shortAddress(order, t("unknown"))}
      />

      <OrderDetailsSection
        customerRating={customerRating}
        displayAmount={displayAmount || t("unknown")}
        locale={locale}
        order={order}
        t={t}
      />

      {showScheduleEditor ? (
        <ScheduleEditor
          merchantNote={merchantNote}
          minTime={toDateTimeLocalValue(order.appointmentTime) || undefined}
          scheduleDraft={scheduleDraft}
          t={t}
          onMerchantNoteChange={onMerchantNoteChange}
          onScheduleDraftChange={onScheduleDraftChange}
        />
      ) : null}

      {showInServiceReschedule ? (
        <InServiceReschedule
          minTime={toDateTimeLocalValue(order.appointmentTime) || undefined}
          scheduleDraft={scheduleDraft}
          t={t}
          onScheduleDraftChange={onScheduleDraftChange}
          onUpdateSchedule={() => onUpdateStatus("inService")}
        />
      ) : null}

      {showCustomerReview ? (
        <CustomerReviewPanel
          draft={reviewDraft}
          submitting={reviewSubmitting}
          t={t}
          onDraftChange={onReviewDraftChange}
          onSubmit={onSubmitReview}
        />
      ) : null}

      <OrderActions
        canCancel={canCancel}
        canMarkDone={canMarkDone}
        showAwaitPayment={showAwaitPayment}
        showScheduleEditor={showScheduleEditor}
        showStartService={showStartService}
        startEnabled={startEnabled}
        scheduleSaved={Boolean(order.confirmedServiceTime)}
        t={t}
        onCancel={onRequestCancel}
        onSaveSchedule={() => onUpdateStatus("merchantConfirmed")}
        onStartService={() => onUpdateStatus("inService")}
        onMarkDone={() => onUpdateStatus("merchantDone")}
      />
    </article>
  );
}

function OrderHeader({
  order,
  awaitingStart,
  statusLabel,
  displayAmount,
  timeSummary,
  addressShort,
  t
}: {
  order: MerchantOrderItem;
  awaitingStart: boolean;
  statusLabel: string;
  displayAmount: string;
  timeSummary: string;
  addressShort: string;
  t: Translate;
}) {
  return (
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
              {statusLabel}
            </span>
            <span className="merchant-price-pill py-1 text-[13px]">{displayAmount}</span>
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
  );
}
