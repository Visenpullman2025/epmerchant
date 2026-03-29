"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { getJson, postJson, putJson } from "@/lib/merchant/auth-client";
import { uploadToOss } from "@/lib/merchant/oss-upload";
import {
  applyTemplatePriceItems,
  buildSavePayload,
  computePriceRange,
  createEmptyService,
  extractTemplatePriceItems,
  extractPricingSchema,
  extractPricingStrategy,
  normalizeCategories,
  normalizeServiceDetail,
  replaceTemplatePriceItems,
  resolveTemplateDetailSource,
  type MerchantServiceDraft
} from "../services-store";
import type {
  MerchantCategoriesResponse,
  MerchantProcessTemplateResponse,
  MerchantProfileResponse,
  MerchantServiceDetailResponse,
  MerchantServiceSaveResponse
} from "@/lib/api/merchant-api";

export default function MerchantServiceDetailPage() {
  const t = useTranslations("MerchantServices");
  const router = useRouter();
  const params = useParams<{ locale: string; serviceId: string }>();
  const locale = params.locale || "zh";
  const serviceId = params.serviceId || "new";
  const [service, setService] = useState<MerchantServiceDraft>(createEmptyService());
  const [categories, setCategories] = useState<MerchantCategoriesResponse["list"]>([]);
  const [boundCodes, setBoundCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(serviceId !== "new");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTemplateConfig(
    templateCode: string,
    existingPriceItems: MerchantServiceDraft["priceItems"],
    templateDetail?: Record<string, unknown> | null
  ) {
    if (!templateCode) {
      setService((current) => ({ ...current, pricingStrategy: undefined, pricingSchema: null }));
      return;
    }
    let configSource: Record<string, unknown> | null = templateDetail || null;
    if (!configSource) {
      setTemplateLoading(true);
      const result = await getJson<MerchantProcessTemplateResponse>(
        `/api/merchant/process-templates/${templateCode}`
      );
      setTemplateLoading(false);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      configSource = resolveTemplateDetailSource(result.data);
    }
    const templatePriceItems = extractTemplatePriceItems(configSource);
    const pricingStrategy = extractPricingStrategy(configSource);
    const pricingSchema = extractPricingSchema(configSource);
    setService((current) => ({
      ...current,
      pricingStrategy,
      pricingSchema,
      priceItems: applyTemplatePriceItems(templatePriceItems, existingPriceItems)
    }));
  }

  useEffect(() => {
    let active = true;
    async function loadPageData() {
      const profileResult = await getJson<MerchantProfileResponse>("/api/merchant/profile");
      if (!active) return;
      const profileServiceTypes = profileResult.ok ? profileResult.data.serviceTypes || [] : [];
      setBoundCodes(profileServiceTypes);

      const categoriesResult = await getJson<MerchantCategoriesResponse>("/api/merchant/categories");
      if (!active) return;
      if (categoriesResult.ok) {
        const normalized = normalizeCategories(categoriesResult.data.list);
        setCategories(
          normalized.map((item) => ({
            ...item,
            selected: profileServiceTypes.includes(item.code)
          }))
        );
        if (serviceId === "new") {
          const availableCategories = normalized.filter((item) =>
            profileServiceTypes.includes(item.code)
          );
          const firstCategory = availableCategories[0] || normalized[0];
          const firstTemplate =
            firstCategory?.templates?.find(
              (template) => template.code === firstCategory?.defaultTemplateCode
            ) || firstCategory?.templates?.[0];
          const nextService = createEmptyService(
            firstCategory?.code || "",
            firstTemplate?.code || ""
          );
          setService(nextService);
          if (firstTemplate?.code) {
            const defaultTemplateDetail =
              firstCategory?.defaultTemplateCode === firstTemplate.code
                ? firstCategory.defaultTemplateDetail || firstTemplate.templateDetail || null
                : firstTemplate.templateDetail || null;
            void loadTemplateConfig(firstTemplate.code, nextService.priceItems, defaultTemplateDetail);
          }
        }
      }

      if (serviceId === "new") {
        setLoading(false);
        return;
      }

      const detailResult = await getJson<MerchantServiceDetailResponse>(
        `/api/merchant/services/${serviceId}`
      );
      if (!active) return;
      setLoading(false);
      if (!detailResult.ok) {
        setMessage(detailResult.message);
        return;
      }
      const normalizedDetail = normalizeServiceDetail(detailResult.data);
      setService(normalizedDetail);

      if (detailResult.data.processTemplateCode) {
        await loadTemplateConfig(
          detailResult.data.processTemplateCode,
          normalizedDetail.priceItems,
          resolveTemplateDetailSource(detailResult.data)
        );
        if (!active) return;
      }
    }
    void loadPageData();
    return () => {
      active = false;
    };
  }, [serviceId]);

  function update(patch: Partial<MerchantServiceDraft>) {
    setService((current) => ({ ...current, ...patch }));
  }

  const selectedCategory = useMemo(
    () => categories.find((item) => item.code === service.categoryCode) || null,
    [categories, service.categoryCode]
  );
  const selectableCategories = useMemo(() => {
    const selected = categories.filter((item) => boundCodes.includes(item.code));
    return selected.length ? selected : categories;
  }, [boundCodes, categories]);
  const computedPrice = computePriceRange(service.priceItems);

  function onCategoryChange(nextCategoryCode: string) {
    setMessage("");
    const nextCategory = categories.find((item) => item.code === nextCategoryCode);
    const nextTemplate =
      nextCategory?.templates?.find(
        (template) => template.code === nextCategory?.defaultTemplateCode
      ) || nextCategory?.templates?.[0];
    const nextPriceItems = replaceTemplatePriceItems(nextTemplate?.name || "", service.priceItems);
    update({
      categoryCode: nextCategoryCode,
      processTemplateCode: nextTemplate?.code || "",
      priceItems: nextPriceItems
    });
    if (nextTemplate?.code) {
      const nextTemplateDetail =
        nextCategory?.defaultTemplateCode === nextTemplate.code
          ? nextCategory.defaultTemplateDetail || nextTemplate.templateDetail || null
          : nextTemplate.templateDetail || null;
      void loadTemplateConfig(nextTemplate.code, nextPriceItems, nextTemplateDetail);
    }
  }

  function onTemplateChange(nextTemplateCode: string) {
    setMessage("");
    const nextTemplate =
      selectedCategory?.templates?.find((template) => template.code === nextTemplateCode) || null;
    const nextPriceItems = replaceTemplatePriceItems(nextTemplate?.name || "", service.priceItems);
    update({
      processTemplateCode: nextTemplateCode,
      priceItems: nextPriceItems
    });
    if (nextTemplateCode) {
      void loadTemplateConfig(nextTemplateCode, nextPriceItems, nextTemplate?.templateDetail || null);
    }
  }

  function updatePriceItem(
    priceId: string,
    patch: Partial<MerchantServiceDraft["priceItems"][number]>
  ) {
    update({
      priceItems: service.priceItems.map((item) =>
        item.id === priceId ? { ...item, ...patch } : item
      )
    });
  }

  async function handleCoverUpload(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    setMessage("");
    try {
      const url = await uploadToOss("serviceCover", file);
      update({ coverImageUrl: url });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("uploadFailed"));
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSave() {
    setMessage("");
    if (
      !service.title.trim() ||
      !service.categoryCode ||
      !service.processTemplateCode ||
      (serviceId !== "new" && computedPrice.priceMax <= 0)
    ) {
      setMessage(t("invalidServiceForm"));
      return;
    }
    setSaving(true);
    const payload = buildSavePayload(service);
    const result =
      serviceId === "new"
        ? await postJson<MerchantServiceSaveResponse>("/api/merchant/services", payload)
        : await putJson<MerchantServiceSaveResponse>(
            `/api/merchant/services/${serviceId}`,
            payload
          );
    setSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.push(`/${locale}/merchant/services`);
  }

  return (
    <MerchantScaffold
      brand={t("brand")}
      footer={<MerchantBottomNav locale={locale} />}
      heroAlt={t("heroAlt")}
      heroSrc="/images/merchant-dashboard-hero.svg"
      subtitle={t("detailSubtitle")}
      title={serviceId === "new" ? t("newServiceTitle") : service.title || t("editorTitle")}
      topRight={
        <Link className="text-xs underline" href={`/${locale}/merchant/services`} style={{ color: "var(--muted)" }}>
          {t("backToCatalog")}
        </Link>
      }
    >
      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {t("loading")}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            {message}
          </div>
        ) : null}

        <div className="merchant-editor-section">
          <h2 className="text-base font-semibold">{t("basicInfoTitle")}</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label">{t("serviceName")}</label>
              <input className="field-input" value={service.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div>
              <label className="field-label">{t("serviceCategoryCode")}</label>
              <select className="field-select" value={service.categoryCode} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">{t("selectCategory")}</option>
                {selectableCategories.map((category) => (
                  <option key={category.code} value={category.code}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">{t("serviceDescription")}</label>
              <textarea className="field-textarea" value={service.description} onChange={(e) => update({ description: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="merchant-editor-section">
          <h2 className="text-base font-semibold">{t("priceRangeTitle")}</h2>
          {templateLoading ? (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {t("loading")}
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label">{t("templateCode")}</label>
              <select className="field-select" value={service.processTemplateCode} onChange={(e) => onTemplateChange(e.target.value)}>
                <option value="">{t("selectTemplate")}</option>
                {(selectedCategory?.templates || []).map((template) => (
                  <option key={template.code} value={template.code}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            {service.priceItems.map((item, index) => (
              <div className="merchant-price-item-card" key={item.id}>
                <div className="merchant-price-item-grid">
                  <div>
                    <label className="field-label">{t("priceLabel")}</label>
                    {item.readonly ? (
                      <div className="merchant-static-field">
                        {item.label || `${t("skuLabel")} ${index + 1}`}
                      </div>
                    ) : (
                      <input className="field-input" value={item.label} onChange={(e) => updatePriceItem(item.id, { label: e.target.value })} placeholder={`${t("skuLabel")} ${index + 1}`} />
                    )}
                  </div>
                  <div>
                    <label className="field-label">{t("priceAmount")}</label>
                    {item.inputType === "select" ? (
                      <select
                        className="field-select"
                        value={item.amount}
                        onChange={(e) => updatePriceItem(item.id, { amount: e.target.value })}
                      >
                        <option value="">{t("selectFieldOption")}</option>
                        {(item.options || []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="field-input"
                        type={item.inputType === "text" ? "text" : "number"}
                        min={item.inputType === "number" ? "0" : undefined}
                        step={item.inputType === "number" ? "0.01" : undefined}
                        value={item.amount}
                        onChange={(e) => updatePriceItem(item.id, { amount: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="merchant-price-summary">
              {t("computedRange", {
                min: computedPrice.priceMin,
                max: computedPrice.priceMax
              })}
            </div>
          </div>
        </div>

        <div className="merchant-editor-section">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{t("coverImage")}</h2>
          </div>
          <input
            className="field-input mt-3"
            type="file"
            accept="image/*"
            disabled={uploadingCover}
            onChange={(event) => void handleCoverUpload(event.target.files?.[0])}
          />
          {uploadingCover ? (
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              {t("uploading")}
            </p>
          ) : null}
          {service.coverImageUrl ? (
            <p className="mt-2 text-xs break-all" style={{ color: "var(--muted)" }}>
              {service.coverImageUrl}
            </p>
          ) : null}
          <div className="merchant-media-cover mt-3">
            <Image alt={service.title || t("coverImage")} fill sizes="100vw" src={service.coverImageUrl} style={{ objectFit: "cover" }} />
          </div>
        </div>

        <div className="merchant-editor-section">
          <h2 className="text-base font-semibold">{t("serviceStatus")}</h2>
          <div className="mt-3 merchant-toggle-grid">
            <div className="merchant-toggle-card">
              <p className="field-label mb-2">{t("serviceVisibility")}</p>
              <div className="flex gap-2">
                <button className={`apple-btn-secondary ${service.visible ? "" : "opacity-70"}`} onClick={() => update({ visible: true })} type="button">
                  {t("show")}
                </button>
                <button className={`apple-btn-secondary ${service.visible ? "opacity-70" : ""}`} onClick={() => update({ visible: false })} type="button">
                  {t("hide")}
                </button>
              </div>
            </div>
            <div className="merchant-toggle-card">
              <p className="field-label mb-2">{t("serviceStatus")}</p>
              <div className="flex gap-2">
                <button className={`apple-btn-secondary ${service.published ? "" : "opacity-70"}`} onClick={() => update({ published: true })} type="button">
                  {t("onShelf")}
                </button>
                <button className={`apple-btn-secondary ${service.published ? "opacity-70" : ""}`} onClick={() => update({ published: false })} type="button">
                  {t("offShelf")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button className="apple-btn-primary w-full" disabled={saving || loading} onClick={onSave} type="button">
          {serviceId === "new" ? t("createService") : t("updateService")}
        </button>
      </div>
    </MerchantScaffold>
  );
}
