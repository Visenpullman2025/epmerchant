# Expatth Phase-1 前端指南（中文唯一版）

> 本文档是当前项目唯一实施基线。英文版指南已弃用，不再作为执行依据。

## 1. 项目目标
- 只做移动端入口，优先保证转化链路可用与稳定。
- 默认中文，支持英文/泰文切换。
- 以最小改动迭代，先保可用，再做体验优化。

## 2. 当前前端范围（已落地）
- 首页：`/[locale]`
- 分类总页：`/[locale]/categories`
- 分类详情：`/[locale]/categories/[slug]`
- 服务详情：`/[locale]/services/[id]`
- 创建订单：`/[locale]/orders/new`
- 支付页：`/[locale]/orders/[id]/pay`
- 订单跟踪：`/[locale]/orders/[id]`
- 入驻申请：`/[locale]/apply`
- 我的页面：`/[locale]/me` 与 `/[locale]/me/[feature]`
- 认证：`/[locale]/auth/login`、`/[locale]/auth/register`
- 广场：`/[locale]/square`、作者页

## 3. 技术栈与约束
- Next.js App Router + TypeScript strict。
- 多语言：`next-intl`（`zh/en/th`）。
- 样式：Tailwind + `src/app/globals.css` 全局 token。
- API 统一走项目内 API Route 代理后端。

## 4. 数据策略（当前口径）
- 以“实时可用”为优先：
  - `/api/services`：`cache: 'no-store'`
  - `/api/categories`：`cache: 'no-store'`
- API 请求失败兜底：
  - 分类返回默认 5 个分类（有图标占位）
  - 服务返回空数组

## 5. 图片策略（当前口径）
- 外链图片全部走 `unoptimized` 直连，避免代理引发跨域/类型拦截问题。
- 若 OSS 返回 403（HostForbidden），优先修复后端返回域名与 OSS 绑定域名配置。

## 6. 导航与布局规则
- 底部导航只在主流程页面显示：首页/分类/广场/我的。
- 底部栏固定定位，优先保证层级不被内容覆盖。
- 分类卡片链接默认关闭预取（避免重复请求观感）。

## 7. 本阶段不做
- 不做复杂缓存治理与后台缓存控制台。
- 不做大型状态管理重构。
- 不做与当前转化链路无关的大规模样式重写。

## 8. 下一步优先级
1. 图片域名治理（后端返回统一可访问 URL）。
2. 分类/服务接口稳定性与错误态统一。
3. 移动端主题是否固定浅色的产品决策与落地。
