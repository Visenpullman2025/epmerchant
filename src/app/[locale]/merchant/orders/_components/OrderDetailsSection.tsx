import type { MerchantOrderItem } from "@/lib/api/merchant-api";
import {
  creditImpactEntries,
  formatDateTime,
  pricingEntries,
  settlementEntries
} from "../_lib/order-format";

type Translate = (key: string, values?: Record<string, string>) => string;

type Props = {
  customerRating: string;
  displayAmount: string;
  locale: string;
  order: MerchantOrderItem;
  t: Translate;
};

export default function OrderDetailsSection({ order, customerRating, displayAmount, locale, t }: Props) {
  const fulfillmentEvents = order.fulfillmentEvents || [];
  const pricing = pricingEntries(order);
  const settlement = settlementEntries(order);
  const creditImpact = creditImpactEntries(order);

  return (
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
            {t("appointmentTime")}: {formatDateTime(order.appointmentTime, locale, t("unknown"))} ·{" "}
            {t("confirmedServiceTime")}: {formatDateTime(order.confirmedServiceTime, locale, t("unknown"))}
          </p>
        </div>
        <div>
          <p className="field-label">{t("quotedAmount")}</p>
          <p className="text-sm font-semibold">{displayAmount}</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
            {t("orderCreatedAt")}: {formatDateTime(order.createdAt, locale, t("unknown"))} · {t("remark")}:{" "}
            {order.remark || t("unknown")}
          </p>
        </div>
        <SummaryEntries label={t("pricing")} entries={pricing} />
        {fulfillmentEvents.length ? (
          <div>
            <p className="field-label">{t("fulfillmentEvents")}</p>
            <div className="space-y-1">
              {fulfillmentEvents.map((event, index) => (
                <p className="text-xs" key={`${order.orderNo}-event-${index}`} style={{ color: "var(--muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    {event.eventType || event.type || t("unknown")}
                  </span>{" "}
                  {formatDateTime(event.occurredAt || event.createdAt, locale, t("unknown"))}{" "}
                  {event.title || event.note || event.description || ""}
                </p>
              ))}
            </div>
          </div>
        ) : null}
        <SummaryEntries label={t("settlement")} entries={settlement} />
        <SummaryEntries label={t("creditImpact")} entries={creditImpact} />
        <div className="space-y-0.5 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
          <p>{t("reviewHint")}</p>
        </div>
      </div>
    </details>
  );
}

function SummaryEntries({ label, entries }: { label: string; entries: { label: string; value: string }[] }) {
  if (!entries.length) return null;
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="space-y-0.5">
        {entries.map((entry) => (
          <p className="text-xs" key={entry.label} style={{ color: "var(--muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {entry.label}:
            </span>{" "}
            {entry.value}
          </p>
        ))}
      </div>
    </div>
  );
}
