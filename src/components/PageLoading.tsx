/**
 * 商户端通用 loading / 空状态 / 功能开发中 组件
 * 与客户端 ep 的 PageLoading 视觉一致（暗金 token 自动驱动），便于跨端复用。
 *
 * 简化版：不依赖 Lottie（避免新增依赖）；用纯 CSS 转圈 + 暗金色调
 */

export function PageLoading({ label }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(250, 246, 233, 0.93)', backdropFilter: 'blur(8px)' }}
      aria-live="polite"
      aria-label={label ?? '加载中'}
    >
      <Spinner size={56} />
      <p
        className="mt-3 text-sm font-bold"
        style={{ color: 'var(--gray-700)' }}
      >
        {label ?? '正在加载…'}
      </p>
    </div>
  );
}

export function InlineLoading({ size = 56, label }: { size?: number; label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: size + 40, width: '100%', padding: '20px 0' }}
      aria-live="polite"
    >
      <Spinner size={size} />
      {label ? (
        <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--gray-700)' }}>
          {label}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title = '暂无内容',
  desc = '稍后再来看看吧',
  action,
}: {
  title?: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(138,106,37,0.06))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 16,
        }}
      >
        📭
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink-900)', margin: 0 }}>
        {title}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.55 }}>
        {desc}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ComingSoon({
  title = '功能开发中',
  desc = '敬请期待',
}: {
  title?: string;
  desc?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(201,169,110,0.25), rgba(138,106,37,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 16,
        }}
      >
        🛠
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink-900)', margin: 0 }}>
        {title}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.55 }}>
        {desc}
      </p>
    </div>
  );
}

function Spinner({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.max(2, size / 14)}px solid rgba(138, 106, 37, 0.18)`,
        borderTopColor: 'var(--brand-primary)',
        animation: 'merSpin 0.85s linear infinite',
      }}
      aria-hidden
    />
  );
}
