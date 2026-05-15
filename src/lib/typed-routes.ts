import type { Route } from 'next';

/**
 * 给 `${locale}` 动态路径加上 typedRoutes 期望的 `Route` 品牌类型。
 *
 * Next.js 的 typedRoutes 只能在字面量 href 上做编译期检查，无法推断 `/${locale}/me`
 * 这种 template literal。这个 helper 把 cast 集中在一处，避免散落 19 处 `as Route`。
 *
 * 用法：
 *   <Link href={localeHref(`/${locale}/me/settings`)}>
 *   router.push(localeHref(`/${locale}/me/profile`))
 *
 * 不会做运行时校验 —— 路径正确性靠路由清单（EXPATTH_HELP.md §8）+ knip 死链扫描兜底。
 */
export function localeHref<T extends string>(path: T): Route<T> {
  return path as Route<T>;
}
