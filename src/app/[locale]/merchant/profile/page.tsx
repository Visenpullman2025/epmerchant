"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getJson, postJson } from "@/lib/merchant/auth-client";
import { uploadToOss } from "@/lib/merchant/oss-upload";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import type {
  MerchantProfileResponse,
  MerchantProfileUpdateResponse,
  MerchantVerificationResponse,
  SaveLocaleResponse
} from "@shared/api/contracts/merchant-api";

export default function MerchantProfilePage() {
  const t = useTranslations("MerchantProfile");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "zh";

  const [merchantName, setMerchantName] = useState("");
  const [phone, setPhone] = useState("");
  const [intro, setIntro] = useState("");
  const [online, setOnline] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferredLocale, setPreferredLocale] = useState(locale);
  const [langSaving, setLangSaving] = useState(false);
  const [langMessage, setLangMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "unsubmitted" | "pending" | "approved" | "rejected"
  >("unsubmitted");
  const [ownerName, setOwnerName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const result = await getJson<MerchantProfileResponse>("/api/merchant/profile");
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setLangMessage(result.message);
        return;
      }
      setMerchantName(result.data.merchantName);
      setPhone(result.data.contactPhone);
      setIntro(result.data.serviceIntro || "");
      setOnline(result.data.online ?? true);
      setVerificationStatus(result.data.verification?.status || "unsubmitted");
      setOwnerName(result.data.verification?.ownerName || "");
      setIdNumber(result.data.verification?.idNumber || "");
      setReviewNote(result.data.verification?.reviewNote || "");
      setDocumentFrontUrl("");
      setDocumentBackUrl("");
      setSelfieUrl("");
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function onSave() {
    setLangMessage("");
    const result = await postJson<MerchantProfileUpdateResponse>("/api/merchant/profile", {
      merchantName,
      contactPhone: phone,
      serviceIntro: intro,
      online
    });
    if (!result.ok) {
      setLangMessage(result.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function handleVerificationUpload(
    fieldKey: string,
    scene: "documentFrontUrl" | "documentBackUrl" | "selfieUrl",
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

  async function onSaveLanguage() {
    setLangSaving(true);
    setLangMessage("");
    const result = await postJson<SaveLocaleResponse>("/api/merchant/preferences/locale", {
      locale: preferredLocale
    });
    setLangSaving(false);
    if (!result.ok) {
      setLangMessage(result.message);
      return;
    }
    setLangMessage(t("languageSaved"));
    router.push(`/${result.data.preferredLocale}/merchant/profile`);
  }

  async function onLogout() {
    setLoggingOut(true);
    await postJson<{ loggedOut: true }>("/api/merchant/auth/logout", {});
    setLoggingOut(false);
    router.push(`/${locale}/merchant/login`);
  }

  const verificationEditable =
    verificationStatus === "unsubmitted" || verificationStatus === "rejected";

  return (
    <MerchantScaffold
      brand={t("brand")}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-onboarding-hero.svg"
      subtitle={t("subtitle")}
      title={t("title")}
      topRight={<span className="text-xs" style={{ color: "var(--muted)" }}>{t("settings")}</span>}
    >
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        <div>
          <label className="field-label">{t("merchantName")}</label>
          <input className="field-input" onChange={(e) => setMerchantName(e.target.value)} value={merchantName} />
        </div>
        <div>
          <label className="field-label">{t("phone")}</label>
          <input className="field-input" onChange={(e) => setPhone(e.target.value)} value={phone} />
        </div>
        <div>
          <label className="field-label">{t("intro")}</label>
          <textarea className="field-textarea" onChange={(e) => setIntro(e.target.value)} value={intro} />
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="field-label mb-2">{t("onlineStatus")}</p>
          <div className="flex gap-2">
            <button
              className={`apple-btn-secondary ${online ? "" : "opacity-70"}`}
              onClick={() => setOnline(true)}
              type="button"
            >
              {t("online")}
            </button>
            <button
              className={`apple-btn-secondary ${online ? "opacity-70" : ""}`}
              onClick={() => setOnline(false)}
              type="button"
            >
              {t("offline")}
            </button>
          </div>
        </div>
        <button className="apple-btn-primary w-full" onClick={onSave} type="button">
          {saved ? t("saved") : t("save")}
        </button>
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
              <div>
                <label className="field-label">{t("documentFrontUrl")}</label>
                <input
                  className="field-input"
                  disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleVerificationUpload("documentFrontUrl", "documentFrontUrl", event.target.files?.[0], setDocumentFrontUrl)
                  }
                />
                {documentFrontUrl ? <p className="mt-1 text-xs break-all">{documentFrontUrl}</p> : null}
              </div>
              <div>
                <label className="field-label">{t("documentBackUrl")}</label>
                <input
                  className="field-input"
                  disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleVerificationUpload("documentBackUrl", "documentBackUrl", event.target.files?.[0], setDocumentBackUrl)
                  }
                />
                {documentBackUrl ? <p className="mt-1 text-xs break-all">{documentBackUrl}</p> : null}
              </div>
              <div>
                <label className="field-label">{t("selfieUrl")}</label>
                <input
                  className="field-input"
                  disabled={!verificationEditable || verificationSaving || Boolean(uploadingField)}
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleVerificationUpload("selfieUrl", "selfieUrl", event.target.files?.[0], setSelfieUrl)
                  }
                />
                {selfieUrl ? <p className="mt-1 text-xs break-all">{selfieUrl}</p> : null}
              </div>
            </div>
            {uploadingField ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {t("uploading")}
              </p>
            ) : null}
            {verificationMessage ? (
              <p className="text-sm" style={{ color: verificationStatus === "rejected" ? "var(--danger)" : "var(--muted)" }}>
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
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="field-label">{t("serviceCenterTitle")}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t("serviceCenterDesc")}
          </p>
          <Link className="apple-btn-primary mt-3 inline-flex w-full items-center justify-center" href={`/${locale}/merchant/services`}>
            {t("goServices")}
          </Link>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="field-label mb-2">{t("languageLabel")}</p>
          <select
            className="field-select"
            onChange={(event) => setPreferredLocale(event.target.value)}
            value={preferredLocale}
          >
            <option value="zh">{t("langZh")}</option>
            <option value="en">{t("langEn")}</option>
            <option value="th">{t("langTh")}</option>
          </select>
          {langMessage ? (
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              {langMessage}
            </p>
          ) : null}
          <button className="apple-btn-secondary mt-3 w-full" disabled={langSaving} onClick={onSaveLanguage} type="button">
            {langSaving ? t("savingLanguage") : t("saveLanguage")}
          </button>
        </div>
        <button className="apple-btn-secondary w-full" disabled={loggingOut} onClick={onLogout} type="button">
          {loggingOut ? t("loggingOut") : t("logout")}
        </button>
      </div>
      <MerchantBottomNav locale={locale} />
    </MerchantScaffold>
  );
}
