"use client";

import type { CapabilityDraft } from "@/components/merchant/MerchantCapabilityManager";

type Props = {
  draft: CapabilityDraft;
  saving: boolean;
  t: (key: string) => string;
  onChange: (draft: CapabilityDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function MerchantCapabilityForm({
  draft,
  saving,
  t,
  onChange,
  onSave,
  onCancel
}: Props) {
  return (
    <section className="merchant-order-action-panel">
      <div>
        <label className="field-label">{t("standardServiceCode")}</label>
        <input
          className="field-input"
          value={draft.standardServiceCode}
          onChange={(event) => onChange({ ...draft, standardServiceCode: event.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          checked={draft.enabled}
          onChange={(event) => onChange({ ...draft, enabled: event.target.checked })}
          type="checkbox"
        />
        {t("enabled")}
      </label>
      <JsonField label={t("serviceArea")} value={draft.serviceArea} onChange={(serviceArea) => onChange({ ...draft, serviceArea })} />
      <JsonField
        label={t("basePricingRule")}
        value={draft.basePricingRule}
        onChange={(basePricingRule) => onChange({ ...draft, basePricingRule })}
      />
      <JsonField
        label={t("extraDistanceRule")}
        value={draft.extraDistanceRule}
        onChange={(extraDistanceRule) => onChange({ ...draft, extraDistanceRule })}
      />
      <JsonField
        label={t("capacityRule")}
        value={draft.capacityRule}
        onChange={(capacityRule) => onChange({ ...draft, capacityRule })}
      />
      <div>
        <label className="field-label">{t("openDates")}</label>
        <input
          className="field-input"
          placeholder="2026-05-10, 2026-05-11"
          value={draft.openDates}
          onChange={(event) => onChange({ ...draft, openDates: event.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="apple-btn-primary" disabled={saving} onClick={onSave} type="button">
          {saving ? t("saving") : draft.capabilityId ? t("update") : t("create")}
        </button>
        {draft.capabilityId ? (
          <button className="apple-btn-secondary" onClick={onCancel} type="button">
            {t("cancelEdit")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function JsonField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <textarea className="field-textarea" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
