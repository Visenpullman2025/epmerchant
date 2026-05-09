"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import MerchantOrderCard from "./_components/MerchantOrderCard";
import StatusBox from "./_components/StatusBox";
import { merchantOrderStatuses } from "./_lib/order-workflow";
import { useMerchantOrdersController } from "./_lib/use-merchant-orders-controller";
import type { MerchantOrderStatus } from "@/lib/api/merchant-api";

export default function MerchantOrdersPage() {
  const t = useTranslations("MerchantOrders");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const [initialStatus, setInitialStatus] = useState<MerchantOrderStatus>("new");
  const orders = useMerchantOrdersController(t, initialStatus);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInitialStatus(readOrderStatus(new URLSearchParams(window.location.search).get("status")));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={t("title")}
    >
      <div className="mt-4 flex flex-wrap gap-2">
        {merchantOrderStatuses.map((status) => (
          <button
            className={`merchant-segment-item ${orders.activeStatus === status ? "active" : ""}`}
            key={status}
            onClick={() => orders.setActiveStatus(status)}
            type="button"
          >
            {t(`tabs.${status}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {orders.loading ? <StatusBox>{t("loading")}</StatusBox> : null}
        {orders.message ? <StatusBox tone={orders.messageTone}>{orders.message}</StatusBox> : null}
        {orders.orders.length ? (
          orders.orders.map((order) => (
            <MerchantOrderCard
              key={order.orderNo}
              locale={locale}
              merchantNote={orders.merchantNotes[order.orderNo] || ""}
              order={order}
              reviewDraft={orders.reviewDrafts[order.orderNo]}
              reviewSubmitting={orders.reviewSubmittingNo === order.orderNo}
              scheduleDraft={orders.scheduleDrafts[order.orderNo] || ""}
              t={t}
              workflowLabel={orders.getWorkflowLabel}
              onMerchantNoteChange={(value) => orders.setMerchantNote(order.orderNo, value)}
              onRequestCancel={() => orders.requestCancel(order)}
              onReviewDraftChange={(draft) => orders.setReviewDraft(order.orderNo, draft)}
              onScheduleDraftChange={(value) => orders.setScheduleDraft(order.orderNo, value)}
              onSubmitReview={() => orders.submitCustomerReview(order)}
              onUpdateStatus={(nextStatus) => orders.updateStatus(order, nextStatus)}
            />
          ))
        ) : (
          <StatusBox>{t("empty")}</StatusBox>
        )}
      </div>
    </MerchantScaffold>
  );
}

function readOrderStatus(value: string | null): MerchantOrderStatus {
  return merchantOrderStatuses.includes(value as MerchantOrderStatus) ? (value as MerchantOrderStatus) : "new";
}
