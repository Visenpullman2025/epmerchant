'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getJson, postJson, putJson } from '@/lib/merchant/auth-client';
import { uploadToOss } from '@/lib/merchant/oss-upload';
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
  resolveTemplateDetailSource,
  type MerchantServiceDraft,
} from '@/app/[locale]/merchant/services/services-store';
import type {
  MerchantCategoriesResponse,
  MerchantProcessTemplateResponse,
  MerchantProfileResponse,
  MerchantServiceDetailResponse,
  MerchantServiceSaveResponse,
} from '@/lib/api/merchant-api';

export function useServiceEditor(t: (key: string) => string) {
  const router = useRouter();
  const params = useParams<{ locale: string; serviceId: string }>();
  const locale = params.locale || 'zh';
  const serviceId = params.serviceId || 'new';

  const [service, setService] = useState<MerchantServiceDraft>(createEmptyService());
  const [categories, setCategories] = useState<MerchantCategoriesResponse['list']>([]);
  const [boundCodes, setBoundCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(serviceId !== 'new');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadTemplateConfig(
    templateCode: string,
    existingPriceItems: MerchantServiceDraft['priceItems'],
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
      if (!result.ok) { setMessage(result.message); return; }
      configSource = resolveTemplateDetailSource(result.data);
    }
    setService((current) => ({
      ...current,
      pricingStrategy: extractPricingStrategy(configSource!),
      pricingSchema: extractPricingSchema(configSource!),
      priceItems: applyTemplatePriceItems(extractTemplatePriceItems(configSource!), existingPriceItems),
    }));
  }

  useEffect(() => {
    let active = true;
    async function loadPageData() {
      const profileResult = await getJson<MerchantProfileResponse>('/api/merchant/profile');
      if (!active) return;
      const profileServiceTypes = profileResult.ok ? profileResult.data.serviceTypes || [] : [];
      setBoundCodes(profileServiceTypes);

      const categoriesResult = await getJson<MerchantCategoriesResponse>('/api/merchant/categories');
      if (!active) return;
      if (categoriesResult.ok) {
        const normalized = normalizeCategories(categoriesResult.data.list);
        setCategories(normalized.map((item) => ({ ...item, selected: profileServiceTypes.includes(item.code) })));
        if (serviceId === 'new') {
          const available = normalized.filter((item) => profileServiceTypes.includes(item.code));
          const firstCategory = available[0] || normalized[0];
          const firstTemplate =
            firstCategory?.templates?.find((t) => t.code === firstCategory?.defaultTemplateCode) ||
            firstCategory?.templates?.[0];
          const nextService = createEmptyService(firstCategory?.code || '', firstTemplate?.code || '');
          setService(nextService);
          if (firstTemplate?.code) {
            const defaultDetail =
              firstCategory?.defaultTemplateCode === firstTemplate.code
                ? firstCategory.defaultTemplateDetail || firstTemplate.templateDetail || null
                : firstTemplate.templateDetail || null;
            void loadTemplateConfig(firstTemplate.code, nextService.priceItems, defaultDetail);
          }
        }
      }

      if (serviceId === 'new') { setLoading(false); return; }

      const detailResult = await getJson<MerchantServiceDetailResponse>(`/api/merchant/services/${serviceId}`);
      if (!active) return;
      setLoading(false);
      if (!detailResult.ok) { setMessage(detailResult.message); return; }
      const normalizedDetail = normalizeServiceDetail(detailResult.data);
      setService(normalizedDetail);
      if (detailResult.data.processTemplateCode) {
        await loadTemplateConfig(
          detailResult.data.processTemplateCode,
          normalizedDetail.priceItems,
          resolveTemplateDetailSource(detailResult.data)
        );
      }
    }
    void loadPageData();
    return () => { active = false; };
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
    setMessage('');
    const nextCategory = categories.find((item) => item.code === nextCategoryCode);
    const nextTemplate =
      nextCategory?.templates?.find((tmpl) => tmpl.code === nextCategory?.defaultTemplateCode) ||
      nextCategory?.templates?.[0];
    const nextPriceItems = service.priceItems;
    update({ categoryCode: nextCategoryCode, processTemplateCode: nextTemplate?.code || '', priceItems: nextPriceItems });
    if (nextTemplate?.code) {
      const nextTemplateDetail =
        nextCategory?.defaultTemplateCode === nextTemplate.code
          ? nextCategory.defaultTemplateDetail || nextTemplate.templateDetail || null
          : nextTemplate.templateDetail || null;
      void loadTemplateConfig(nextTemplate.code, nextPriceItems, nextTemplateDetail);
    }
  }

  function onTemplateChange(nextTemplateCode: string) {
    setMessage('');
    const nextTemplate = selectedCategory?.templates?.find((tmpl) => tmpl.code === nextTemplateCode) || null;
    const nextPriceItems = service.priceItems;
    update({ processTemplateCode: nextTemplateCode, priceItems: nextPriceItems });
    if (nextTemplateCode) {
      void loadTemplateConfig(nextTemplateCode, nextPriceItems, nextTemplate?.templateDetail || null);
    }
  }

  function updatePriceItem(priceId: string, patch: Partial<MerchantServiceDraft['priceItems'][number]>) {
    update({ priceItems: service.priceItems.map((item) => item.id === priceId ? { ...item, ...patch } : item) });
  }

  async function handleCoverUpload(file: File | undefined) {
    if (!file) return;
    setUploadingCover(true);
    setMessage('');
    try {
      const url = await uploadToOss('serviceCover', file);
      update({ coverImageUrl: url });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('uploadFailed'));
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSave() {
    setMessage('');
    if (!service.title.trim() || !service.categoryCode || !service.processTemplateCode ||
        (serviceId !== 'new' && computedPrice.priceMax <= 0)) {
      setMessage(t('invalidServiceForm'));
      return;
    }
    setSaving(true);
    const payload = buildSavePayload(service);
    const result = serviceId === 'new'
      ? await postJson<MerchantServiceSaveResponse>('/api/merchant/services', payload)
      : await putJson<MerchantServiceSaveResponse>(`/api/merchant/services/${serviceId}`, payload);
    setSaving(false);
    if (!result.ok) { setMessage(result.message); return; }
    router.push(`/${locale}/merchant/services`);
  }

  return {
    locale, serviceId, service, categories, selectableCategories, selectedCategory,
    computedPrice, loading, saving, uploadingCover, templateLoading, message,
    update, onCategoryChange, onTemplateChange, updatePriceItem, handleCoverUpload, onSave,
  };
}
