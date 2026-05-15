'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { PostCardUser, type PostShape, pickTags } from './PostCardUser';
import { PostCardMerchant } from './PostCardMerchant';
import { PostCardFeatured } from './PostCardFeatured';
import { PostCardQA } from './PostCardQA';
import { TopicStrip, type Topic } from './TopicStrip';

type SubTab = 'recommended' | 'following' | 'nearby' | 'topics';

interface SubTabDef {
  key: SubTab;
  label: string;
  badge?: number;
}

const SUB_TABS: SubTabDef[] = [
  { key: 'recommended', label: '推荐' },
  { key: 'following', label: '关注' },
  { key: 'nearby', label: '附近' },
  { key: 'topics', label: '话题' },
];

const PAGE_SIZE = 10;

interface PostsResponse {
  list?: PostShape[];
  total?: number;
  page?: number;
  pageSize?: number;
}

interface SquareFeedProps {
  initialTab?: SubTab;
  topics?: Topic[];
}

function inferPostType(p: PostShape): 'user_post' | 'merchant_post' | 'featured' | 'question' {
  if (p.type === 'user_post' || p.type === 'merchant_post' || p.type === 'featured' || p.type === 'question') {
    return p.type;
  }
  const issueNum = (p as { issue_number?: string; issueNumber?: string }).issueNumber ??
    (p as { issue_number?: string }).issue_number;
  const isFeatured = (p as { is_featured?: number | boolean }).is_featured;
  if (issueNum || isFeatured) return 'featured';

  const content = ((p.content_i18n?.zh ?? p.content) ?? '').trim();
  if (/[?？]/.test(content) || content.startsWith('有没有') || content.startsWith('请问')) {
    return 'question';
  }
  const tags = pickTags(p);
  if (tags.some((t) => /新店开张|开业|早鸟|本周|促销|优惠/.test(t))) return 'merchant_post';
  const author = p.author;
  if (author?.nickname && /商家|merchant|shop/i.test(author.nickname)) return 'merchant_post';
  return 'user_post';
}

export function SquareFeed({ initialTab = 'recommended', topics }: SquareFeedProps) {
  const locale = useLocale();
  const [feedRef] = useAutoAnimate<HTMLDivElement>({ duration: 220 });
  const [tab, setTab] = useState<SubTab>(initialTab);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostShape[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const reqIdRef = useRef(0);

  const buildQuery = useCallback(
    (page: number) => {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (tab === 'recommended') qs.set('sort', 'hot');
      else if (tab === 'nearby') qs.set('sort', 'nearby');
      else if (tab === 'following') {
        qs.set('sort', 'hot');
        qs.set('tab', 'following');
      } else if (tab === 'topics') {
        qs.set('sort', 'hot');
        if (activeTopic) qs.set('topic', activeTopic);
      }
      return qs.toString();
    },
    [tab, activeTopic],
  );

  const load = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const myReqId = ++reqIdRef.current;
      const nextPage = reset ? 1 : pageRef.current;
      const qs = buildQuery(nextPage);
      try {
        const res = await fetch(`/api/posts?${qs}`, { cache: 'no-store' });
        if (myReqId !== reqIdRef.current) return;
        const json = (await res.json()) as { code?: number; data?: PostsResponse | PostShape[] };
        let payload: PostsResponse;
        if (Array.isArray(json.data)) {
          payload = { list: json.data, total: json.data.length };
        } else {
          payload = json.data ?? {};
        }
        const list: PostShape[] = Array.isArray(payload.list) ? payload.list : [];
        setPosts((prev) => (reset ? list : [...prev, ...list]));
        const more = list.length === PAGE_SIZE;
        hasMoreRef.current = more;
        setHasMore(more);
        pageRef.current = nextPage + 1;
      } catch {
        setError('加载失败，请稍后重试');
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        if (myReqId === reqIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [buildQuery],
  );

  useEffect(() => {
    // 不清空 posts —— 让旧列表保留显示直到新数据回来（stale-while-revalidate）
    // 避免「内容消失 → 空白闪一下 → 新内容出现」的三帧闪烁。
    // load(reset=true) 内部 setPosts(reset ? newList : [...prev, ...newList]) 会原子替换。
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeTopic]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          void load(false);
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [load]);

  return (
    <div>
      {/* SUB TABS — replica: padding 0 18px, sticky, border-bottom, bg gray-50 */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          padding: '0 18px',
          background: '#fcfcfa',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid rgba(15,52,40,0.06)',
        }}
      >
        {SUB_TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 14px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? '#0a3a2a' : '#7a786d',
                borderBottom: isActive ? '2px solid #0f523c' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? '#0f523c' : 'transparent',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {t.label}
              {t.badge ? (
                <span
                  style={{
                    background: '#c9a96e',
                    color: '#0a3a2a',
                    fontSize: 11,
                    padding: '1px 4px',
                    borderRadius: 5,
                    fontWeight: 700,
                    marginLeft: 3,
                    verticalAlign: 'top',
                  }}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TOPIC STRIP — replica: always visible, bg gray-50, padding 12px 18px 14px */}
      <TopicStrip
        topics={topics}
        active={activeTopic ?? undefined}
        onChange={(slug) => setActiveTopic(slug)}
      />

      {/* FEED — 小红书式瀑布流（CSS columns，breakInside avoid 防卡片被切） */}
      <div
        ref={feedRef}
        style={{
          padding: '14px 10px',
          minHeight: 360,
          background: '#f5f5f0',
          columnCount: 2,
          columnGap: 8,
        }}
      >
        {posts.length === 0 && !loading ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#7a786d',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              columnSpan: 'all',
            }}
          >
            {error
              ? error
              : tab === 'following'
                ? '还没有关注任何作者，去发现页看看'
                : tab === 'topics' && !activeTopic
                  ? '选个话题，开始刷起来'
                  : '广场还没有内容'}
          </div>
        ) : (
          posts.map((p) => {
            const variant = inferPostType(p);
            const key = `${variant}-${p.id}`;
            const card =
              variant === 'merchant_post' ? <PostCardMerchant post={p} /> :
              variant === 'featured' ? <PostCardFeatured post={p} /> :
              variant === 'question' ? <PostCardQA post={p} /> :
              <PostCardUser post={p} />;
            return (
              <Link
                key={key}
                href={`/${locale}/merchant/square/${encodeURIComponent(String(p.id))}` as `/${string}`}
                style={{
                  display: 'inline-block',
                  width: '100%',
                  marginBottom: 8,
                  textDecoration: 'none',
                  color: 'inherit',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                }}
              >
                {card}
              </Link>
            );
          })
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              color: '#7a786d',
              fontSize: 11,
              padding: 12,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            加载中…
          </div>
        ) : null}
        {!hasMore && posts.length > 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#a8a59a',
              fontSize: 11,
              padding: 20,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            没有更多了
          </div>
        ) : null}
      </div>
    </div>
  );
}
