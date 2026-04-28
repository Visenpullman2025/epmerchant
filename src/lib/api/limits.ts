/** 列表类 limit / pageSize：与客户端约定，默认 20、上限 100 */
export const DEFAULT_LIST_LIMIT = 20;
export const MAX_LIST_LIMIT = 100;

const LIST_CLAMP_KEYS = ["limit", "pageSize"] as const;

/**
 * 将单个 limit/pageSize 规范为 [1, MAX_LIST_LIMIT]；
 * 非有限数字或小于 1 时用 fallback（默认 DEFAULT_LIST_LIMIT）。
 */
export function clampListLimitParam(raw: string | null, fallback = DEFAULT_LIST_LIMIT): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), MAX_LIST_LIMIT);
}

/** GET 查询串：重写 limit、pageSize，其余参数不变 */
export function sanitizeListQueryString(search: string): string {
  if (!search || search === "?") return search;
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  let touched = false;
  for (const key of LIST_CLAMP_KEYS) {
    if (sp.has(key)) {
      sp.set(key, String(clampListLimitParam(sp.get(key), DEFAULT_LIST_LIMIT)));
      touched = true;
    }
  }
  if (!touched) return search;
  const q = sp.toString();
  return q ? `?${q}` : "";
}
