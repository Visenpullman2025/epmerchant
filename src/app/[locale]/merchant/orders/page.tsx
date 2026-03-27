"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import type {
  MerchantOrderItem,
  MerchantOrderStatus,
  MerchantOrderTransitionResponse,
  MerchantOrdersResponse
} from "@shared/api/contracts/merchant-api";

const statuses: MerchantOrderStatus[] = ["new", "pending", "inService", "done", "cancelled"];

export default function MerchantOrdersPage() {
  const t = useTranslations("MerchantOrders");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const [activeStatus, setActiveStatus] = useState<MerchantOrderStatus>("new");
  const [orders, setOrders] = useState<MerchantOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      setLoading(true);
      const result = await getJson<MerchantOrdersResponse>(
        `/api/merchant/orders?status=${activeStatus}&page=1&pageSize=20`
      );
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setMessage(result.message);
        setOrders([]);
        return;
      }
      setMessage("");
      setOrders(result.data.list);
    }
    loadOrders();
    return () => {
      active = false;
    };
  }, [activeStatus]);

  const filteredOrders = useMemo(() => orders, [orders]);

  async function updateStatus(orderNo: string, nextStatus: MerchantOrderStatus) {
    const result = await postJson<MerchantOrderTransitionResponse>(
      `/api/merchant/orders/${orderNo}/transition`,
      { targetStatus: nextStatus }
    );
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setOrders((prev) =>
      prev.map((order) =>
        order.orderNo === orderNo ? { ...order, status: result.data.workflowStatus as MerchantOrderStatus } : order
      )
    );
    setMessage("");
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
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
            onClick={() => setActiveStatus(status)}
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
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            {message}
          </div>
        ) : null}
        {filteredOrders.length ? (
          filteredOrders.map((order) => (
            <article className="rounded-xl border p-3" key={order.orderNo} style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{order.orderNo}</p>
                <span className="merchant-status-chip" style={{ backgroundColor: "#e8f2ff", color: "#2256c5" }}>
                  {order.amount}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {order.customerName} · {order.serviceType}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="apple-btn-secondary" onClick={() => updateStatus(order.orderNo, "pending")} type="button">
                  {t("actions.pending")}
                </button>
                <button className="apple-btn-secondary" onClick={() => updateStatus(order.orderNo, "inService")} type="button">
                  {t("actions.inService")}
                </button>
                <button className="apple-btn-secondary" onClick={() => updateStatus(order.orderNo, "done")} type="button">
                  {t("actions.done")}
                </button>
                <button className="apple-btn-secondary" onClick={() => updateStatus(order.orderNo, "cancelled")} type="button">
                  {t("actions.cancelled")}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("empty")}
          </div>
        )}
      </div>
      <MerchantBottomNav locale={locale} />
    </MerchantScaffold>
  );
}
