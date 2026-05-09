import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getMerchantBffJson } from "@/lib/api/merchant-server";
import { normalizeMerchantReviewStatus } from "@/lib/merchant/verification-status";

type Props = {
  params: Promise<{ locale: string }>;
};

function statusTone(status: string) {
  if (status === "approved") return "var(--ok)";
  if (status === "rejected") return "var(--danger)";
  return "var(--warn)";
}

async function fetchVerificationStatus() {
  const cookieStatus = (await cookies()).get("merchant_status")?.value;
  const fallback =
    cookieStatus === "unsubmitted" ||
    cookieStatus === "approved" ||
    cookieStatus === "rejected" ||
    cookieStatus === "pending"
      ? cookieStatus
      : "unsubmitted";
  const profile = await getMerchantBffJson<Record<string, unknown>>("/profile");
  if (!profile) return { status: fallback, reviewNote: "" };
  const status = normalizeMerchantReviewStatus(profile, fallback);
  const verification =
    typeof profile.verification === "object" && profile.verification
      ? (profile.verification as Record<string, unknown>)
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
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={t("title")}
    >
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
    </MerchantScaffold>
  );
}
