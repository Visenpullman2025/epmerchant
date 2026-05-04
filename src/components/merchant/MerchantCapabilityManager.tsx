"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MerchantCapabilityCard from "@/components/merchant/MerchantCapabilityCard";
import MerchantCapabilityForm from "@/components/merchant/MerchantCapabilityForm";
import { getJson, postJson, putJson } from "@/lib/merchant/auth-client";
import type {
  MerchantCapabilitiesResponse,
  MerchantCapabilityItem,
  MerchantCapabilitySaveResponse
} from "@/lib/api/merchant-api";

export type CapabilityDraft = {
  capabilityId?: string | number;
  standardServiceCode: string;
  enabled: boolean;
  serviceArea: string;
  basePricingRule: string;
  extraDistanceRule: string;
  capacityRule: string;
  openDates: string;
};

const emptyDraft: CapabilityDraft = {
  standardServiceCode: "",
  enabled: true,
  serviceArea: "{}",
  basePricingRule: "{}",
  extraDistanceRule: "{}",
  capacityRule: "{}",
  openDates: ""
};

function stringifyJson(value: unknown) {
  if (value == null) return "{}";
  return JSON.stringify(value, null, 2);
}

function draftFromCapability(item: MerchantCapabilityItem): CapabilityDraft {
  return {
    capabilityId: item.capabilityId,
    standardServiceCode: item.standardServiceCode || "",
    enabled: item.enabled !== false,
    serviceArea: stringifyJson(item.serviceArea),
    basePricingRule: stringifyJson(item.basePricingRule),
    extraDistanceRule: stringifyJson(item.extraDistanceRule),
    capacityRule: stringifyJson(item.capacityRule),
    openDates: (item.openDates || []).join(", ")
  };
}

function parseObject(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed) as unknown;
  if (parsed == null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(label);
  }
  return parsed as Record<string, unknown>;
}

export default function MerchantCapabilityManager() {
  const t = useTranslations("MerchantCapabilities");
  const [items, setItems] = useState<MerchantCapabilityItem[]>([]);
  const [draft, setDraft] = useState<CapabilityDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("error");

  async function loadCapabilities(active = true) {
    setLoading(true);
    const result = await getJson<MerchantCapabilitiesResponse>("/api/merchant/capabilities");
    if (!active) return;
    setLoading(false);
    if (!result.ok) {
      setMessageTone("error");
      setMessage(result.message);
      setItems([]);
      return;
    }
    setMessage("");
    setItems(result.data.list || []);
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadCapabilities(active);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

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
        openDates: draft.openDates
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
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
    setMessageTone("info");
    setMessage(draft.capabilityId ? t("updated") : t("created"));
    setDraft(emptyDraft);
    void loadCapabilities();
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

      <MerchantCapabilityForm
        draft={draft}
        saving={saving}
        t={t}
        onCancel={() => setDraft(emptyDraft)}
        onChange={setDraft}
        onSave={saveCapability}
      />

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        {!loading && !items.length ? (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("empty")}
          </div>
        ) : null}
        {items.map((item) => (
          <MerchantCapabilityCard
            item={item}
            key={String(item.capabilityId)}
            t={t}
            onEdit={(capability) => setDraft(draftFromCapability(capability))}
          />
        ))}
      </section>
    </div>
  );
}
