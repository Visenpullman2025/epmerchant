"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MerchantBottomNav from "@/components/merchant/MerchantBottomNav";
import MerchantScaffold from "@/components/merchant/MerchantScaffold";
import { useServiceEditor } from "@/hooks/useServiceEditor";

export default function MerchantServiceDetailPage() {
  const t = useTranslations("MerchantServices");
  const {
    locale, serviceId, service, selectableCategories, selectedCategory,
    computedPrice, loading, saving, uploadingCover, templateLoading, message,
    update, onCategoryChange, onTemplateChange, updatePriceItem, handleCoverUpload, onSave,
  } = useServiceEditor(t);

  return (
    <MerchantScaffold
      footer={<MerchantBottomNav locale={locale} />}
      title={serviceId === "new" ? t("newServiceTitle") : service.title || t("editorTitle")}
      titleAction={
        <Link className="apple-btn-secondary inline-flex items-center justify-center" href={`/${locale}/merchant/services`}>
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

        {/* 基本信息 */}
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
                  <option key={category.code} value={category.code}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">{t("serviceDescription")}</label>
              <textarea className="field-textarea" value={service.description} onChange={(e) => update({ description: e.target.value })} />
            </div>
          </div>
        </div>

        {/* 定价 */}
        <div className="merchant-editor-section">
          <h2 className="text-base font-semibold">{t("priceRangeTitle")}</h2>
          {templateLoading ? <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{t("loading")}</p> : null}
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label">{t("templateCode")}</label>
              <select className="field-select" value={service.processTemplateCode} onChange={(e) => onTemplateChange(e.target.value)}>
                <option value="">{t("selectTemplate")}</option>
                {(selectedCategory?.templates || []).map((template) => (
                  <option key={template.code} value={template.code}>{template.name}</option>
                ))}
              </select>
            </div>
            {service.priceItems.map((item, index) => (
              <div className="merchant-price-item-card" key={item.id}>
                <div className="merchant-price-item-grid">
                  <div>
                    <label className="field-label">{t("priceLabel")}</label>
                    {item.readonly ? (
                      <div className="merchant-static-field">{item.label || `${t("skuLabel")} ${index + 1}`}</div>
                    ) : (
                      <input className="field-input" value={item.label}
                        onChange={(e) => updatePriceItem(item.id, { label: e.target.value })}
                        placeholder={`${t("skuLabel")} ${index + 1}`} />
                    )}
                  </div>
                  <div>
                    <label className="field-label">{t("priceAmount")}</label>
                    {item.inputType === "select" ? (
                      <select className="field-select" value={item.amount}
                        onChange={(e) => updatePriceItem(item.id, { amount: e.target.value })}>
                        <option value="">{t("selectFieldOption")}</option>
                        {(item.options || []).map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input className="field-input"
                        type={item.inputType === "text" ? "text" : "number"}
                        min={item.inputType === "number" ? "0" : undefined}
                        step={item.inputType === "number" ? "0.01" : undefined}
                        value={item.amount}
                        onChange={(e) => updatePriceItem(item.id, { amount: e.target.value })} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="merchant-price-summary">
              {t("computedRange", { min: computedPrice.priceMin, max: computedPrice.priceMax })}
            </div>
          </div>
        </div>

        {/* 封面图 */}
        <div className="merchant-editor-section">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{t("coverImage")}</h2>
          </div>
          <input className="field-input mt-3" type="file" accept="image/*" disabled={uploadingCover}
            onChange={(event) => void handleCoverUpload(event.target.files?.[0])} />
          {uploadingCover ? <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{t("uploading")}</p> : null}
          {service.coverImageUrl ? <p className="mt-2 text-xs break-all" style={{ color: "var(--muted)" }}>{service.coverImageUrl}</p> : null}
          <div className="merchant-media-cover mt-3">
            <Image alt={service.title || t("coverImage")} fill sizes="100vw" src={service.coverImageUrl} style={{ objectFit: "cover" }} />
          </div>
        </div>

        {/* 上架状态 */}
        <div className="merchant-editor-section">
          <h2 className="text-base font-semibold">{t("serviceStatus")}</h2>
          <div className="mt-3 merchant-toggle-grid">
            <div className="merchant-toggle-card">
              <p className="field-label mb-2">{t("serviceVisibility")}</p>
              <div className="flex gap-2">
                <button className={`apple-btn-secondary ${service.visible ? "" : "opacity-70"}`} onClick={() => update({ visible: true })} type="button">{t("show")}</button>
                <button className={`apple-btn-secondary ${service.visible ? "opacity-70" : ""}`} onClick={() => update({ visible: false })} type="button">{t("hide")}</button>
              </div>
            </div>
            <div className="merchant-toggle-card">
              <p className="field-label mb-2">{t("serviceStatus")}</p>
              <div className="flex gap-2">
                <button className={`apple-btn-secondary ${service.published ? "" : "opacity-70"}`} onClick={() => update({ published: true })} type="button">{t("onShelf")}</button>
                <button className={`apple-btn-secondary ${service.published ? "opacity-70" : ""}`} onClick={() => update({ published: false })} type="button">{t("offShelf")}</button>
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
