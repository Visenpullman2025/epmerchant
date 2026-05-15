/**
 * 商户端品牌主题：拉后端 publicSettings 注入 :root CSS var
 *
 * 优先读 `ui.brand.color_primary_merchant`（商家端专用），fallback 才用 `color_primary`。
 * 商家端不读客户端 #0f523c 避免主题被污染。
 *
 * 后端 API：GET /api/v1/settings/public （响应里包含 ui.brand.{color_primary,color_accent,color_primary_merchant,color_accent_merchant}）
 * 失败时静默 fallback 到 globals.css 默认暗金值。
 */

const BACKEND = process.env.BACKEND_API_BASE ?? 'http://127.0.0.1:8000/api/v1';

interface PublicSettingsBrand {
  color_primary?: string;
  color_accent?: string;
  color_primary_merchant?: string;
  color_accent_merchant?: string;
}

interface PublicSettingsResponse {
  data?: {
    ui?: {
      brand?: PublicSettingsBrand;
    };
  };
}

export async function fetchBrandTokens(): Promise<{ primary?: string; accent?: string }> {
  try {
    const res = await fetch(`${BACKEND}/settings/public?tenant=merchant`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const json = (await res.json()) as PublicSettingsResponse;
    const brand = json.data?.ui?.brand ?? {};
    // 商家端优先读 _merchant suffix；没有时不 fallback 到客户端色，让 globals.css 默认值生效
    return {
      primary: brand.color_primary_merchant,
      accent: brand.color_accent_merchant ?? brand.color_accent,
    };
  } catch {
    return {};
  }
}

/** 生成 inline <style> 内容；token 缺失时返回空字符串。 */
export function brandThemeCss(tokens: { primary?: string; accent?: string }): string {
  const lines: string[] = [];
  if (tokens.primary && /^#[0-9a-fA-F]{3,8}$/.test(tokens.primary)) {
    lines.push(`  --brand-primary: ${tokens.primary};`);
  }
  if (tokens.accent && /^#[0-9a-fA-F]{3,8}$/.test(tokens.accent)) {
    lines.push(`  --brand-accent: ${tokens.accent};`);
  }
  if (lines.length === 0) return '';
  return `:root {\n${lines.join('\n')}\n}`;
}
