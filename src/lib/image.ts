/**
 * 图片 URL 工具（商户端单仓；广场帖子规范化见 `@/lib/square/normalize`）。
 * 外链或可能跨域：用 unoptimized 直连，避免经 /next/image 代理触发 CORB
 */
export function isRemoteImageUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return true;
  if (u.includes("unsplash.com") || u.includes("unsplash")) return true;
  return false;
}

/**
 * 统一图片公网访问地址：
 * - 处理 OSS 被限制 host（HostForbidden）时的域名替换
 * - 保留本地相对路径和正常外链
 */
export function normalizePublicImageUrl(url: string): string {
  if (typeof url !== "string" || !url.trim()) return "";
  const raw = url.trim();

  if (raw.startsWith("/")) return raw;

  try {
    const parsed = new URL(raw);
    const blockedHost = process.env.OSS_BLOCKED_HOST ?? "expath.ap-southeast-7.thepacificqlx.com";
    const cdnBase = process.env.CDN_PUBLIC_BASE ?? "";
    if (parsed.hostname === blockedHost && cdnBase) {
      return `${cdnBase.replace(/\/$/, "")}${parsed.pathname}`;
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}
