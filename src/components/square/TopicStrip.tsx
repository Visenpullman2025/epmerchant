'use client';

export interface Topic {
  slug: string;
  name: string;
  postCount: number;
  hot?: boolean;
}

const DEFAULT_TOPICS: Topic[] = [
  { slug: '雨季屋顶', name: '雨季屋顶', postCount: 128, hot: true },
  { slug: '空调季', name: '空调季', postCount: 89 },
  { slug: '宠物寄养', name: '宠物寄养', postCount: 42 },
  { slug: '新店开张', name: '新店开张', postCount: 31 },
  { slug: '泳池小知识', name: '泳池小知识', postCount: 23 },
];

interface Props {
  topics?: Topic[];
  active?: string;
  onChange?: (slug: string | null) => void;
}

export function TopicStrip({ topics, active, onChange }: Props) {
  const data = topics && topics.length > 0 ? topics : DEFAULT_TOPICS;

  return (
    <div
      style={{
        background: '#fcfcfa',
        padding: '12px 18px 14px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`.topic-strip-inner::-webkit-scrollbar { display: none; }`}</style>
      {data.map((topic) => {
        const isActive = active === topic.slug;
        // hot AND not overridden by active selection -> hot styling; if active OR hot we use deep teal bg
        const useDeepStyle = isActive || (topic.hot && !active);
        return (
          <button
            key={topic.slug}
            type="button"
            onClick={() => onChange?.(isActive ? null : topic.slug)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '7px 12px',
              borderRadius: 999,
              flexShrink: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: useDeepStyle
                ? 'none'
                : '1px solid rgba(201,169,110,0.2)',
              background: useDeepStyle
                ? 'linear-gradient(135deg, var(--brand-primary, #0f523c), var(--brand-primary-deep, #0a3a2a))'
                : 'linear-gradient(135deg, rgba(15,82,60,0.05), rgba(201,169,110,0.08))',
              color: useDeepStyle ? 'var(--brand-accent, #c9a96e)' : 'var(--ink-900, #0a3a2a)',
            }}
          >
            {topic.hot && !active ? (
              <span style={{ fontSize: 14 }}>🔥</span>
            ) : null}
            <span
              style={{
                color: useDeepStyle ? 'var(--gray-100, #fcfcfa)' : 'var(--brand-accent, #c9a96e)',
                fontWeight: 700,
              }}
            >
              #
            </span>
            {topic.name}
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: useDeepStyle ? 'rgba(252,252,250,0.7)' : '#7a786d',
              }}
            >
              {topic.postCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

