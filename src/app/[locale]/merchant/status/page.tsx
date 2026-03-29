import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import { buildBackendUrl } from "@/lib/api/backend";
import { normalizeMerchantReviewStatus } from "@/lib/merchant/verification-status";
import type { ApiSuccess } from "@/lib/api/merchant-api";

type Props = {
  params: Promise<{ locale: string }>;
};

function statusTone(status: string) {
  if (status === "approved") return "var(--ok)";
  if (status === "rejected") return "var(--danger)";
  return "var(--warn)";
}

async function fetchVerificationStatus() {
  const token = (await cookies()).get("merchant_token")?.value;
  const cookieStatus = (await cookies()).get("merchant_status")?.value;
  const fallback =
    cookieStatus === "unsubmitted" ||
    cookieStatus === "approved" ||
    cookieStatus === "rejected" ||
    cookieStatus === "pending"
      ? cookieStatus
      : "unsubmitted";
  if (!token) return { status: fallback, reviewNote: "" };
  const authorization = token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
  const upstream = await fetch(buildBackendUrl("/api/v1/merchant/profile"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "X-Merchant-Token": token.replace(/^Bearer\s+/i, "")
    },
    cache: "no-store"
  });
  if (upstream.status === 404) return { status: fallback, reviewNote: "" };
  if (!upstream.ok) return { status: fallback, reviewNote: "" };
  const payload = (await upstream.json()) as ApiSuccess<Record<string, unknown>>;
  const status = normalizeMerchantReviewStatus(payload.data, fallback);
  const verification =
    typeof payload.data?.verification === "object" && payload.data?.verification
      ? (payload.data.verification as Record<string, unknown>)
      : null;
  const reviewNote =
    (verification &&
      ((typeof verification.reviewNote === "string" && verification.reviewNote) ||
        (typeof verification.review_note === "string" && verification.review_note))) ||
    "";
  return { status, reviewNote };
}

export default async function MerchantStatusPage({ params }: Props) {
  const { locale } = await params;
  const review = await fetchVerificationStatus();
  const status = review.status;
  const t = await getTranslations("MerchantStatus");

  return (
    <main className="app-shell">
      <header className="merchant-topbar">
        <span className="merchant-brand">{t("brand")}</span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {t("reviewing")}
        </span>
      </header>
      <section className="merchant-hero">
        <Image
          alt={t("heroAlt")}
          height={432}
          priority
          src="/images/merchant-dashboard-hero.svg"
          width={720}
        />
      </section>
      <section className="apple-card">
        <h1 className="merchant-page-title">{t("title")}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {t("desc")}
        </p>
        <div className="mt-4 rounded-xl p-3" style={{ border: `1px solid ${statusTone(status)}` }}>
          <span className="merchant-status-chip" style={{ backgroundColor: `${statusTone(status)}22`, color: statusTone(status) }}>
            {status === "approved"
              ? t("approved")
              : status === "rejected"
                ? t("rejected")
                : status === "unsubmitted"
                  ? t("unsubmitted")
                  : t("pending")}
          </span>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {status === "approved"
              ? t("approvedDesc")
              : status === "rejected"
                ? t("rejectedDesc")
                : status === "unsubmitted"
                  ? t("unsubmittedDesc")
                  : t("pendingDesc")}
          </p>
          {status === "rejected" && review.reviewNote ? (
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
              {t("rejectReason")}: {review.reviewNote}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <Link className="apple-btn-secondary inline-flex items-center" href={`/${locale}`}>
            {t("backHome")}
          </Link>
          <Link className="apple-btn-primary inline-flex items-center" href={`/${locale}/merchant/profile`}>
            {status === "approved" || status === "pending" ? t("viewProfile") : t("editProfile")}
          </Link>
        </div>
        <Link className="apple-btn-secondary mt-3 inline-flex w-full items-center justify-center" href={`/${locale}/merchant/dashboard`}>
          {t("goDashboard")}
        </Link>
      </section>
      <MerchantBottomNav locale={locale} />
    </main>
  );
}
