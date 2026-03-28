"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import { uploadToOss } from "@/lib/merchant/oss-upload";
import MerchantAssetPreviewDialog from "@/components/merchant/MerchantAssetPreviewDialog";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import MerchantVerificationUploadField, {
  getPreviewAssetType,
  type PreviewAssetType
} from "@/components/merchant/MerchantVerificationUploadField";
import type {
  MerchantProfileResponse,
  MerchantVerificationResponse
} from "@shared/api/contracts/merchant-api";

type VerificationUploadScene =
  | "businessLicense"
  | "documentFrontUrl"
  | "documentBackUrl"
  | "selfieUrl";

export default function MerchantProfileVerificationPage() {
  const t = useTranslations("MerchantProfile");
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";
  const previewDialogRef = useRef<HTMLDialogElement>(null);

  const uploadLabels = useMemo(
    () => ({
      openOriginal: t("openOriginal"),
      previewFileHint: t("previewFileHint"),
      previewImageHint: t("previewImageHint"),
      replaceUpload: t("replaceUpload")
    }),
    [t]
  );

  const dialogLabels = useMemo(
    () => ({
      closePreview: t("closePreview"),
      openOriginal: t("openOriginal"),
      previewFileHint: t("previewFileHint")
    }),
    [t]
  );

  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<
    "unsubmitted" | "pending" | "approved" | "rejected"
  >("unsubmitted");
  const [ownerName, setOwnerName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState("");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<{
    label: string;
    type: PreviewAssetType;
    url: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const result = await getJson<MerchantProfileResponse>("/api/merchant/profile");
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setVerificationMessage(result.message);
        return;
      }
      setVerificationStatus(result.data.verification?.status || "unsubmitted");
      setOwnerName(result.data.verification?.ownerName || "");
      setIdNumber(result.data.verification?.idNumber || "");
      setBusinessLicenseUrl(result.data.verification?.businessLicenseUrl || "");
      setDocumentFrontUrl(result.data.verification?.documentFrontUrl || "");
      setDocumentBackUrl(result.data.verification?.documentBackUrl || "");
      setSelfieUrl(result.data.verification?.selfieUrl || "");
      setReviewNote(result.data.verification?.reviewNote || "");
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function handleVerificationUpload(
    fieldKey: string,
    scene: VerificationUploadScene,
    file: File | undefined,
    setValue: (value: string) => void
  ) {
    if (!file) return;
    setVerificationMessage("");
    setUploadingField(fieldKey);
    try {
      const url = await uploadToOss(scene, file);
      setValue(url);
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : t("uploadFailed"));
    } finally {
      setUploadingField(null);
    }
  }

  async function onSubmitVerification() {
    setVerificationMessage("");
    setVerificationSaving(true);
    const result = await postJson<MerchantVerificationResponse>("/api/merchant/verification", {
      ownerName,
      idNumber,
      business_license_url: businessLicenseUrl || undefined,
      documentFrontUrl: documentFrontUrl || undefined,
      documentBackUrl: documentBackUrl || undefined,
      selfieUrl: selfieUrl || undefined
    });
    setVerificationSaving(false);
    if (!result.ok) {
      setVerificationMessage(result.message);
      return;
    }
    setVerificationStatus(result.data.status);
    setReviewNote("");
    setVerificationMessage(t("verificationSubmitted"));
  }

  const verificationEditable =
    verificationStatus === "unsubmitted" || verificationStatus === "rejected";

  function openPreview(label: string, url: string) {
    const type = getPreviewAssetType(url);
    setPreviewAsset({ label, type, url });
    previewDialogRef.current?.showModal();
  }

  function closePreview() {
    previewDialogRef.current?.close();
    setPreviewAsset(null);
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle=""
      title={t("verificationPageTitle")}
      topRight={
        <Link className="text-xs" href={`/${locale}/merchant/profile`} style={{ color: "var(--muted)" }}>
          {t("backToHub")}
        </Link>
      }
    >
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="field-label">{t("verificationTitle")}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {t("verificationDesc")}
              </p>
            </div>
            <span
              className="merchant-status-chip"
              style={{
                backgroundColor:
                  verificationStatus === "approved"
                    ? "var(--ok)"
                    : verificationStatus === "rejected"
                      ? "var(--danger)"
                      : verificationStatus === "pending"
                        ? "var(--warn)"
                        : "#eef2ff",
                color: verificationStatus === "unsubmitted" ? "#5f6e8f" : "#fff"
              }}
            >
              {verificationStatus === "approved"
                ? t("verified")
                : verificationStatus === "rejected"
                  ? t("rejected")
                  : verificationStatus === "pending"
                    ? t("pending")
                    : t("unsubmitted")}
            </span>
          </div>
          {verificationStatus === "pending" ? (
            <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
              {t("verificationPendingHint")}
            </p>
          ) : null}
          {verificationStatus === "approved" ? (
            <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
              {t("verificationApprovedHint")}
            </p>
          ) : null}
          {verificationStatus === "rejected" && reviewNote ? (
            <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
              {t("verificationRejectReason")}: {reviewNote}
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label">{t("ownerName")}</label>
              <input
                className="field-input"
                disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                onChange={(e) => setOwnerName(e.target.value)}
                value={ownerName}
              />
            </div>
            <div>
              <label className="field-label">{t("idNumber")}</label>
              <input
                className="field-input"
                disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                onChange={(e) => setIdNumber(e.target.value)}
                value={idNumber}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <MerchantVerificationUploadField
                accept="image/*,.pdf"
                disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                fieldKey="businessLicenseUrl"
                label={t("businessLicenseUrl")}
                labels={uploadLabels}
                onFileChange={(file) =>
                  handleVerificationUpload("businessLicenseUrl", "businessLicense", file, setBusinessLicenseUrl)
                }
                onPreview={openPreview}
                url={businessLicenseUrl}
              />
              <MerchantVerificationUploadField
                accept="image/*"
                disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                fieldKey="documentFrontUrl"
                label={t("documentFrontUrl")}
                labels={uploadLabels}
                onFileChange={(file) =>
                  handleVerificationUpload("documentFrontUrl", "documentFrontUrl", file, setDocumentFrontUrl)
                }
                onPreview={openPreview}
                url={documentFrontUrl}
              />
              <MerchantVerificationUploadField
                accept="image/*"
                disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                fieldKey="documentBackUrl"
                label={t("documentBackUrl")}
                labels={uploadLabels}
                onFileChange={(file) =>
                  handleVerificationUpload("documentBackUrl", "documentBackUrl", file, setDocumentBackUrl)
                }
                onPreview={openPreview}
                url={documentBackUrl}
              />
              <MerchantVerificationUploadField
                accept="image/*"
                disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                fieldKey="selfieUrl"
                label={t("selfieUrl")}
                labels={uploadLabels}
                onFileChange={(file) =>
                  handleVerificationUpload("selfieUrl", "selfieUrl", file, setSelfieUrl)
                }
                onPreview={openPreview}
                url={selfieUrl}
              />
            </div>
            {uploadingField ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("uploading")}
              </p>
            ) : null}
            {verificationMessage ? (
              <p
                className="text-sm"
                style={{ color: verificationStatus === "rejected" ? "var(--danger)" : "var(--muted)" }}
              >
                {verificationMessage}
              </p>
            ) : null}
            <button
              className="apple-btn-secondary w-full"
              disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
              onClick={onSubmitVerification}
              type="button"
            >
              {verificationSaving ? t("verificationSubmitting") : t("submitVerification")}
            </button>
          </div>
        </div>
      </div>
      <MerchantAssetPreviewDialog
        dialogRef={previewDialogRef}
        labels={dialogLabels}
        onClose={closePreview}
        previewAsset={previewAsset}
      />
    </MerchantScaffold>
  );
}
