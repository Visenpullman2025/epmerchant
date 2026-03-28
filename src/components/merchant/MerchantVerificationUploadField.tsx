"use client";

import Image from "next/image";

export type PreviewAssetType = "image" | "pdf" | "file";

export type MerchantVerificationUploadLabels = {
  openOriginal: string;
  previewFileHint: string;
  previewImageHint: string;
  replaceUpload: string;
};

export function getPreviewAssetType(url: string): PreviewAssetType {
  const normalizedUrl = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(normalizedUrl)) {
    return "image";
  }
  if (/\.pdf$/i.test(normalizedUrl)) {
    return "pdf";
  }
  return "file";
}

type Props = {
  accept: string;
  disabled: boolean;
  fieldKey: string;
  label: string;
  labels: MerchantVerificationUploadLabels;
  onFileChange: (file: File | undefined) => void;
  onPreview: (label: string, url: string) => void;
  url: string;
};

export default function MerchantVerificationUploadField({
  accept,
  disabled,
  fieldKey,
  label,
  labels,
  onFileChange,
  onPreview,
  url
}: Props) {
  const inputId = `verification-upload-${fieldKey}`;
  const assetType = url ? getPreviewAssetType(url) : "file";

  return (
    <div>
      <label className="field-label">{label}</label>
      {url ? (
        <div className="space-y-2">
          <button
            className="merchant-upload-preview"
            disabled={disabled}
            onClick={() => onPreview(label, url)}
            type="button"
          >
            {assetType === "image" ? (
              <span className="merchant-upload-preview-media">
                <Image alt={label} fill sizes="(max-width: 640px) 100vw, 320px" src={url} />
              </span>
            ) : (
              <span className="merchant-upload-preview-file">{assetType === "pdf" ? "PDF" : "FILE"}</span>
            )}
            <span className="merchant-upload-preview-body">
              <span className="merchant-upload-preview-title">{label}</span>
              <span className="merchant-upload-preview-hint">
                {assetType === "image" ? labels.previewImageHint : labels.previewFileHint}
              </span>
            </span>
          </button>
          <div className="flex gap-2">
            <label
              className={`apple-btn-secondary inline-flex flex-1 cursor-pointer items-center justify-center ${
                disabled ? "pointer-events-none opacity-60" : ""
              }`}
              htmlFor={inputId}
            >
              {labels.replaceUpload}
            </label>
            <a
              className="apple-btn-secondary inline-flex flex-1 items-center justify-center"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              {labels.openOriginal}
            </a>
          </div>
          <input
            accept={accept}
            className="sr-only"
            disabled={disabled}
            id={inputId}
            onChange={(event) => onFileChange(event.target.files?.[0])}
            type="file"
          />
          <p className="text-xs break-all" style={{ color: "var(--muted)" }}>
            {url}
          </p>
        </div>
      ) : (
        <input
          accept={accept}
          className="field-input"
          disabled={disabled}
          onChange={(event) => onFileChange(event.target.files?.[0])}
          type="file"
        />
      )}
    </div>
  );
}
