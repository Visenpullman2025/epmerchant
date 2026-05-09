"use client";

import Image from "next/image";
import Link from "next/link";
import type { LocaleCode, MerchantCandidateItem } from "@/lib/api/merchant-api";
import {
  candidateThumbnailUrl,
  candidateStatusLabel,
  candidateTitle,
  displayDateTime,
  displayRequirementSummary,
  quotePreviewAmount,
  serviceAddressText
} from "@/components/merchant/merchant-order-request-display";
import { isRemoteImageUrl } from "@/lib/image";

type Props = {
  item: MerchantCandidateItem;
  detailHref: string;
  locale: LocaleCode;
  t: (key: string) => string;
};

export default function MerchantOrderRequestCard({ item, detailHref, locale, t }: Props) {
  const thumbnailUrl = candidateThumbnailUrl(item);

  return (
    <article className="merchant-order-card merchant-order-card--compact">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          {thumbnailUrl ? (
            <div className="merchant-order-thumb">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="72px"
                src={thumbnailUrl}
                unoptimized={isRemoteImageUrl(thumbnailUrl)}
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
              {item.orderNo}
            </p>
            <h3 className="mt-1 text-base font-semibold">{candidateTitle(item, t("requestTitle"))}</h3>
            <p className="merchant-order-compact-meta mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {displayRequirementSummary(item.requirementSummary, locale)}
            </p>
          </div>
        </div>
        <span className="merchant-status-chip" style={{ backgroundColor: "#e8f2ff", color: "#2256c5" }}>
          {candidateStatusLabel(item.status, locale)}
        </span>
      </div>

      <div className="merchant-summary-grid mt-3">
        <Detail label={t("quotePreview")} value={quotePreviewAmount(item.quotePreview)} />
        <Detail label={t("requestedAppointment")} value={displayDateTime(item.requestedAppointment, locale)} />
        <Detail label={t("serviceAddress")} value={serviceAddressText(item.serviceAddress)} />
      </div>

      <Link className="apple-btn-secondary mt-3 inline-flex items-center justify-center" href={detailHref}>
        {t("viewDetail")}
      </Link>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="break-words text-sm">{value}</p>
    </div>
  );
}
