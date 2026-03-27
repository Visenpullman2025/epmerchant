# 商家版 AI 技术支持文档（Stage 2）

> 用途：给新开商家版 Cursor/AI 直接作为执行上下文，确保与当前用户版风格、规则、技术栈一致。  
> 适用范围：商家端项目启动、骨架落地、首批核心页面实现。

---

## 1. 当前主仓库基线（必须先读）

### 1.1 规则与文档基线
- 总规则：`.cursorrules`
- Stage2 总设计：`docs/stage2/design.md`
- 共享主进度：`shared/docs/progress/master-progress.zh.md`
- 共享日同步：`shared/docs/progress/daily-sync.zh.md`
- 共享 ADR：`shared/docs/decisions/adr-log.zh.md`
- 共享风险台账：`shared/docs/risks/risk-register.zh.md`
- Stage1 历史参考（用户版实现沉淀）：
  - `docs/stage1/phase1-guide.zh.md`
  - `docs/stage1/development-rules.zh.md`
  - `docs/stage1/theme-style.zh.md`
  - `docs/stage1/development-progress.zh.md`

> 若当前仓尚未同步 `*.zh.md` 文件，先使用同名 `*.md` 版本，后续补齐中文唯一基线。

### 1.2 代码技术栈（按当前真实代码）
- Next.js App Router（`next@16.1.6`）
- React 19 + TypeScript strict
- `next-intl` 多语言（`zh/en/th`）
- TailwindCSS v4（`@tailwindcss/postcss`）
- 统一路径别名：`@/*`

### 1.3 必须继承的核心实现方式
- API 调用统一通过项目 API Route 代理后端（前端页面尽量不直连后端域名）
- 失败可兜底（空数组、默认分类、占位显示）
- 外链图片使用 `unoptimized` 直连 + 占位策略（避免代理跨域/403）
- 用户可见文案必须三语同步（`zh/en/th`）

---

## 2. 可直接复用的关键文件（商家版优先抄这套思路）

### 2.1 基础配置
- `package.json`：脚本与依赖基线
- `tsconfig.json`：strict + `@/*` 路径
- `next.config.ts`：`next-intl` 插件接入、远程图片白名单
- `postcss.config.mjs`：Tailwind v4 方式

### 2.2 国际化与路由
- `src/i18n/routing.ts`：`locales = ['en','zh','th']`
- `src/i18n/request.ts`：按 locale 载入 messages
- `src/proxy.ts`：locale proxy + 受限路由拦截示例（Next 16）

### 2.3 主题与样式
- `src/app/globals.css`：全局 token + 复用样式类
  - `.app-shell`
  - `.apple-card`
  - `.apple-btn-primary`
  - `.apple-btn-secondary`
- 注意：当前基线含 `prefers-color-scheme: dark`，如商家版要固定浅色需产品先定版

### 2.4 API 封装
- `src/lib/api/server.ts`：RSC 场景下 `fetchApi()` 封装（通过 host 推导 baseUrl）

### 2.5 组件风格基线
- `src/components/SecondaryTopBar.tsx`
- `src/components/BottomTabBar.tsx`
- `src/components/LocaleSwitcher.tsx`
- `src/components/ServiceCard.tsx`

---

## 3. Stage 1 复盘给商家版的结论（请直接执行）

### 3.1 要保留的做法
1. **先规则后代码**：先建规则、日志、风险台账，再写页面
2. **先主链路后增强**：先跑通 auth/onboarding/审核状态，再做高级交互
3. **失败兜底优先**：接口失败时页面仍可用
4. **日志先于提交**：每个大功能必须写进度日志

### 3.2 要避免的坑
1. 图片域名不统一导致大面积 403
2. 缓存策略与实时数据冲突，造成“怎么刷都没变化”
3. Link 预取与 no-store 叠加造成“看起来请求两次”
4. 文档与实现漂移，后续 AI 接手困难

---

## 4. 商家版项目启动建议（最小可运行骨架）

### 4.1 目录建议
- `src/app/[locale]/merchant/(auth)/login/page.tsx`
- `src/app/[locale]/merchant/(auth)/register/page.tsx`
- `src/app/[locale]/merchant/onboarding/page.tsx`
- `src/app/[locale]/merchant/status/page.tsx`
- `src/app/api/merchant/auth/login/route.ts`
- `src/app/api/merchant/auth/register/route.ts`
- `src/app/api/merchant/profile/route.ts`
- `src/lib/merchant/auth-client.ts`
- `src/messages/{zh,en,th}.json` 增加 `Merchant*` 命名空间

### 4.2 首批页面（必须先落）
1. 商家注册页
2. 商家登录页
3. 入驻资料页（onboarding）
4. 审核状态页（待审核/通过/拒绝）

### 4.3 首批接口（薄代理）
1. `POST /api/merchant/auth/register`
2. `POST /api/merchant/auth/login`
3. `GET /api/merchant/profile`
4. `POST /api/merchant/onboarding`

---

## 5. 商家版执行流程（给新 AI 的硬要求）

1. 先读：`.cursorrules` + `docs/stage2/design.md` + 本文档
2. 开工前必须产出：
   - 任务范围
   - 影响面
   - 回滚点
3. 每个功能完成后必须更新：
   - `shared/docs/progress/daily-sync.zh.md`
4. 遇到架构取舍必须更新：
   - `shared/docs/decisions/adr-log.zh.md`
5. 发现系统性风险必须更新：
   - `shared/docs/risks/risk-register.zh.md`

---

## 6. 质量门禁（商家版）

每次提交至少满足：
1. 关键路由可访问（登录/注册/onboarding/状态）
2. API 失败可兜底（无白屏）
3. lint/type 无新增错误
4. 三语 key 同步
5. 进度日志已补齐

---

## 7. 建议给新 AI 的起步 Prompt（可直接复制）

你现在负责 Expatth 商家版（Stage2）。  
请严格遵循：`.cursorrules`、`docs/stage2/design.md`、`docs/stage2/merchant-ai-support.zh.md`。  
先完成最小可运行骨架：商家登录/注册/onboarding/审核状态。  
要求：
- 复用当前项目技术栈和风格（`next-intl`、`globals.css`、API Route 薄代理）
- 三语文案同步
- 失败兜底
- 每完成一个大功能必须更新 `shared/docs/progress/daily-sync.zh.md`
- 如有架构取舍，写入 `shared/docs/decisions/adr-log.zh.md`

---

## 8. 维护约定
- 本文档是商家版 AI 接手文档，后续每个里程碑完成后都要回写一次。
- 如果目录或规则变更，先改文档再改代码，避免 AI 上下文失真。

---

## 9. 文档最小集合（稳定执行建议）
- 为降低上下文噪音，默认只保留并维护以下文档作为执行主线：
  - `docs/stage2/design.md`
  - `docs/stage2/merchant-ai-support.zh.md`
  - `shared/docs/progress/master-progress.zh.md`
  - `shared/docs/progress/daily-sync.zh.md`
  - `shared/docs/decisions/adr-log.zh.md`
  - `shared/docs/risks/risk-register.zh.md`
- 其余临时规划文档若与本文件重复，应优先合并后删除，避免多版本口径并存。

---

## 10. 商家版 UI 设计稿与执行计划（已启用）

### 10.1 设计目标
- 商家版必须呈现“移动端 APP 管理后台”质感，而非传统网页表单风格。
- 登录后直接进入商户管理中心，核心模块首屏可见：实名资质、服务能力、在线接单。
- 保持与用户版统一技术栈与多语言机制，避免双轨风格。

### 10.2 视觉系统（Design Tokens）
- 背景：双层径向渐变 + 玻璃卡片（`backdrop-filter`），增强纵深与光感。
- 主色：`--primary #2d6bff`，强调色：`--accent #7f53ff`。
- 卡片：20px 圆角 + 细描边 + 柔和阴影，统一移动端层级。
- 控件：按钮、输入、状态 chip 全部使用统一样式类，避免“拼凑感”。

### 10.3 页面结构稿（首批）
1. 登录页 `/merchant/login`：品牌顶栏 + 视觉 Hero + 登录卡片 + 注册切换。
2. 注册页 `/merchant/register`：同构视觉语言，保持动线与登录一致。
3. 入驻页 `/merchant/onboarding`：实名信息 + 服务类目 + 在线接单开关。
4. 状态页 `/merchant/status`：审核状态解释 + 快捷跳转管理中心。
5. 管理中心 `/merchant/dashboard`：KPI、实名资质、服务配置、在线接单。

### 10.4 图片素材（已接入）
- `public/images/merchant-auth-hero.svg`
- `public/images/merchant-onboarding-hero.svg`
- `public/images/merchant-dashboard-hero.svg`

### 10.5 执行计划与状态
1. **P1 视觉底座**（已完成）
   - 全局主题 token、卡片层级、按钮与表单统一样式。
2. **P2 核心页面对版**（已完成）
   - 登录/注册/onboarding/状态页面完成 APP 风格改造。
3. **P3 管理首页**（已完成）
   - 新增 `/merchant/dashboard`，首屏体现“实名 + 服务 + 接单”三核心。
4. **P4 业务深化**（下一步）
   - 对接真实后端契约，落地服务配置编辑、订单中心、钱包等功能页。

---

## 11. 用户版对齐规范（可直接同步）

> 目标：让用户版与商家版在视觉、布局、交互语义上同源统一，避免“像两个产品”。

### 11.1 视觉风格基线（必须一致）
- 设计气质：移动端 APP 管理后台感，不使用廉价网页风格。
- 主题 token 来源：`src/app/globals.css`（禁止平行复制一套新 token）。
- 核心视觉元素：
  - 渐变背景 + 玻璃卡片（含 `backdrop-filter`）
  - 20px 圆角卡片、轻描边、柔和阴影
  - 状态 chip、主次按钮、输入框统一样式语义
- 推荐复用类：
  - `.app-shell`
  - `.merchant-topbar`
  - `.merchant-hero`
  - `.apple-card`
  - `.apple-btn-primary` / `.apple-btn-secondary`
  - `.merchant-status-chip`

### 11.2 页面组织与布局规范
- 页面骨架优先复用：`src/components/merchant/MerchantScaffold.tsx`。
- 底部导航规范：`src/components/merchant/MerchantBottomNav.tsx`。
- 页面信息层级固定顺序：
  1. 顶栏（品牌/状态）
  2. Hero 视觉图
  3. 主信息卡片（标题 + 说明 + 核心操作）
  4. 底部导航（运营页面）
- 不允许同级页面出现两套不同层级体系（如一部分用卡片，一部分裸列表）。

### 11.3 交互语义统一（用户版/商家版共用）
- 主按钮（Primary）：提交、保存、确认、进入核心流程。
- 次按钮（Secondary）：取消、查看详情、辅助操作。
- 状态色语义：
  - 成功/在线：`--ok`
  - 警告/待处理：`--warn`
  - 失败/拒绝：`--danger`
- 失败兜底：所有列表与接口提交必须有可读错误提示，不允许白屏。

### 11.4 多语言与入口规则（最新口径）
- 语言入口放在商家首页，不在注册/登录页显示切换器。
- 默认语言策略：
  - 优先系统语言（`accept-language`）
  - 无法识别则回退英文（`en`）
- 注册/登录后将语言偏好绑定账号（当前为 Cookie 模拟，后续落库用户表）。
- 登录后业务页面按账号语言自动路由；修改语言入口仅保留在资料设置页。

### 11.5 素材与图像规范
- 素材目录：`public/images/*`
- 当前基线素材：
  - `merchant-auth-hero.svg`
  - `merchant-onboarding-hero.svg`
  - `merchant-dashboard-hero.svg`
- 用户版若补充新素材，需维持同一光影/配色语义，避免风格漂移。

### 11.6 用户版落地建议（执行顺序）
1. 先复用 token 与基础类，不先改业务逻辑。
2. 先统一页面骨架与导航，再统一按钮/输入/状态 chip。
3. 最后再替换页面局部视觉与插图素材。
4. 每完成一批对齐，执行 `lint + typecheck + build` 并记录日志。
