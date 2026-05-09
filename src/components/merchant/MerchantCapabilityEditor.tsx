"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import MerchantCapabilityForm from "@/components/merchant/MerchantCapabilityForm";
import {
  draftFromCapability,
  emptyCapabilityDraft,
  parseDateList,
  parseJsonValue,
  parseObject,
  type CapabilityDraft
} from "@/components/merchant/merchant-capability-utils";
import { getJson, postJson, putJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCapabilitiesResponse,
  MerchantCapabilitySaveResponse,
  MerchantStandardServiceItem,
  MerchantStandardServicesResponse
} from "@/lib/api/merchant-api";

type Props = {
  capabilityId: string;
};

export default function MerchantCapabilityEditor({ capabilityId }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("MerchantCapabilities");
  const isNew = capabilityId === "new";
  const [draft, setDraft] = useState<CapabilityDraft>(emptyCapabilityDraft);
  const [standardServices, setStandardServices] = useState<MerchantStandardServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");

  useEffect(() => {
    let active = true;

    async function loadStandardServices() {
      setServicesLoading(true);
      const result = await getJson<MerchantStandardServicesResponse>(
        `/api/merchant/standard-services?locale=${encodeURIComponent(locale)}`
      );
      if (!active) return;
      setServicesLoading(false);
      if (!result.ok) {
        setMessageTone("error");
        setMessage(t("standardServicesLoadFailed"));
        return;
      }
      setStandardServices(result.data || []);
    }

    async function loadCapability() {
      if (isNew) return;
      setLoading(true);
      const result = await getJson<MerchantCapabilitiesResponse>("/api/merchant/capabilities");
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setMessageTone("error");
        setMessage(result.message);
        return;
      }
      const found = (result.data.list || []).find(
        (item) => String(item.capabilityId) === capabilityId
      );
      if (!found) {
        setMessageTone("error");
        setMessage(t("notFound"));
        return;
      }
      setDraft(draftFromCapability(found));
    }

    void loadStandardServices();
    void loadCapability();

    return () => {
      active = false;
    };
  }, [capabilityId, isNew, locale, t]);

  async function saveCapability() {
    setMessage("");
    if (!draft.standardServiceCode.trim()) {
      setMessageTone("error");
      setMessage(t("standardServiceRequired"));
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = {
        standardServiceCode: draft.standardServiceCode.trim(),
        enabled: draft.enabled,
        serviceArea: parseObject(draft.serviceArea, t("invalidJson")),
        basePricingRule: parseObject(draft.basePricingRule, t("invalidJson")),
        extraDistanceRule: parseObject(draft.extraDistanceRule, t("invalidJson")),
        capacityRule: parseObject(draft.capacityRule, t("invalidJson")),
        timeSlots: parseJsonValue(draft.timeSlots, t("invalidJson")),
        readyStatus: draft.readyStatus.trim() || undefined,
        openDates: parseDateList(draft.openDates),
        blackoutDates: parseDateList(draft.blackoutDates)
      };
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : t("invalidJson"));
      return;
    }

    setSaving(true);
    const result = draft.capabilityId
      ? await putJson<MerchantCapabilitySaveResponse>(
          `/api/merchant/capabilities/${draft.capabilityId}`,
          body
        )
      : await postJson<MerchantCapabilitySaveResponse>("/api/merchant/capabilities", body);
    setSaving(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      return;
    }
    router.push(`/${locale}/merchant/capabilities`);
  }

  return (
    <div className="mt-4 space-y-4">
      {message ? (
        <div
          className="rounded-xl border p-3 text-sm"
          style={{
            borderColor: messageTone === "info" ? "var(--border)" : "var(--danger)",
            color: messageTone === "info" ? "var(--text)" : "var(--danger)"
          }}
        >
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {t("loading")}
        </div>
      ) : (
        <MerchantCapabilityForm
          draft={draft}
          saving={saving}
          servicesLoading={servicesLoading}
          standardServices={standardServices}
          t={t}
          onCancel={() => router.push(`/${locale}/merchant/capabilities`)}
          onChange={setDraft}
          onSave={saveCapability}
        />
      )}
    </div>
  );
}
