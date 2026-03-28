"use client";

import Image from "next/image";
import type { RefObject } from "react";
import type { PreviewAssetType } from "@/components/merchant/MerchantVerificationUploadField";

type PreviewState = {
  label: string;
  type: PreviewAssetType;
  url: string;
} | null;

type DialogLabels = {
  closePreview: string;
  openOriginal: string;
  previewFileHint: string;
};

export default function MerchantAssetPreviewDialog({
  dialogRef,
  labels,
  onClose,
  previewAsset
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  labels: DialogLabels;
  onClose: () => void;
  previewAsset: PreviewState;
}) {
  return (
    <dialog className="merchant-preview-dialog" onClose={onClose} ref={dialogRef}>
      {previewAsset ? (
        <div className="merchant-preview-dialog-body">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="field-label mb-1">{previewAsset.label}</p>
              <p className="text-xs break-all" style={{ color: "var(--muted)" }}>
                {previewAsset.url}
              </p>
            </div>
            <button className="apple-btn-secondary" onClick={onClose} type="button">
              {labels.closePreview}
            </button>
          </div>
          {previewAsset.type === "image" ? (
            <div className="merchant-preview-stage">
              <Image alt={previewAsset.label} fill sizes="(max-width: 640px) 100vw, 640px" src={previewAsset.url} />
            </div>
          ) : previewAsset.type === "pdf" ? (
            <iframe className="merchant-preview-frame" src={previewAsset.url} title={previewAsset.label} />
          ) : (
            <div className="merchant-preview-file-fallback">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {labels.previewFileHint}
              </p>
            </div>
          )}
          <a
            className="apple-btn-primary inline-flex items-center justify-center"
            href={previewAsset.url}
            rel="noreferrer"
            target="_blank"
          >
            {labels.openOriginal}
          </a>
        </div>
      ) : null}
    </dialog>
  );
}
