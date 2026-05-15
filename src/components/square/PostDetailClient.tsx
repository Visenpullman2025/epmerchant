'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  type PostShape,
  pickAuthorName,
  pickAuthorAvatar,
  pickContent,
  pickTags,
  pickLikes,
  pickComments,
  pickCreatedAt,
  pickCity,
  pickLinkedServiceCode,
  formatTimeAgo,
  getPostThumbnailGradient,
} from './PostCardUser';
import {
  addPostComment,
  getPostComments,
  toggleFollowAuthor,
  togglePostLike,
  togglePostFavorite,
  FeaturePendingError,
} from '@/lib/square/client';
import type { SquareComment } from '@/data/square';
import { ReportSheet, type ReportTarget } from '@/components/safety/ReportSheet';

function isAuthGateRedirectError(_err: unknown): boolean {
  return false;
}

interface Props {
  post: Record<string, unknown>;
  postId: string;
}

function pickImageUrl(p: PostShape): string {
  const u = (p as any).imageUrl ?? (p as any).image_url ?? (p as any).coverUrl ?? '';
  return typeof u === 'string' ? u : '';
}

export function PostDetailClient({ post, postId }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const p = post as unknown as PostShape;
  const name = pickAuthorName(p);
  const avatar = pickAuthorAvatar(p);
  const content = pickContent(p);
  const tags = pickTags(p);
  const likes = pickLikes(p);
  const comments = pickComments(p);
  const city = pickCity(p);
  const timeAgo = formatTimeAgo(pickCreatedAt(p));
  const linkedService = pickLinkedServiceCode(p);
  const imageUrl = pickImageUrl(p);
  const heroGradient = getPostThumbnailGradient(p);

  const [commentList, setCommentList] = useState<SquareComment[]>([]);
  const [commentsRef] = useAutoAnimate<HTMLDivElement>({ duration: 200 });
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState<boolean>((p as any).isLiked ?? false);
  const [likeCount, setLikeCount] = useState<number>(likes);
  const [isFavorited, setIsFavorited] = useState<boolean>((p as any).isFavorited ?? false);
  const [favoriteCount, setFavoriteCount] = useState<number>((p as any).favoriteCount ?? 0);
  const [isFollowing, setIsFollowing] = useState<boolean>((p as any).isFollowingAuthor ?? false);
  const [followBusy, setFollowBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const authorId = String((p.author as any)?.id ?? '');

  const refresh = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const list = await getPostComments(postId, locale);
      setCommentList(list);
    } catch {
      // best-effort
    } finally {
      setCommentsLoading(false);
    }
  }, [postId, locale]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [toast, setToast] = useState('');
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2400);
  };

  const handleFollow = async () => {
    if (!authorId) {
      router.push(`/${locale}/merchant/square` as `/${string}`);
      return;
    }
    setFollowBusy(true);
    try {
      const next = await toggleFollowAuthor(authorId, isFollowing);
      setIsFollowing(next);
      showToast(next ? '已关注' : '已取消关注');
    } catch (err) {
      if (isAuthGateRedirectError(err)) return;
      showToast('操作失败，请稍后再试');
    } finally {
      setFollowBusy(false);
    }
  };

  const handleLike = async () => {
    // 乐观更新：UI 先变，失败时回滚
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    setLikeBusy(true);
    try {
      await togglePostLike(postId, prevLiked);
    } catch (err) {
      if (isAuthGateRedirectError(err)) return;
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      if (err instanceof FeaturePendingError) showToast('点赞功能即将上线');
      else showToast('点赞失败，请稍后再试');
    } finally {
      setLikeBusy(false);
    }
  };

  const handleFavorite = async () => {
    const prev = isFavorited;
    const prevCount = favoriteCount;
    setIsFavorited(!prev);
    setFavoriteCount(prevCount + (prev ? -1 : 1));
    setFavBusy(true);
    try {
      await togglePostFavorite(postId, prev);
    } catch (err) {
      if (isAuthGateRedirectError(err)) return;
      setIsFavorited(prev);
      setFavoriteCount(prevCount);
      if (err instanceof FeaturePendingError) showToast('收藏功能即将上线');
      else showToast('收藏失败，请稍后再试');
    } finally {
      setFavBusy(false);
    }
  };

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text) return;
    setSubmitting(true);
    setError('');
    try {
      await addPostComment(postId, text, locale);
      setDraft('');
      showToast('评论已发布');
      await refresh();
    } catch (err) {
      if (isAuthGateRedirectError(err)) return; // 已跳转到 login，无需提示
      const msg = err instanceof Error ? err.message : '评论失败';
      setError(msg);
      showToast(msg.includes('unauthorized') || msg.includes('401') ? '请先登录后再评论' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="pb-32" data-module="post-detail">
      {/* HERO 图：4:5 沉浸式 */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4/5',
          position: 'relative',
          background: heroGradient,
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={content.slice(0, 30) || name}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            priority
            unoptimized
            style={{ objectFit: 'cover' }}
          />
        ) : null}
      </div>

      {/* 作者条 + 关注 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 20px 0',
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(15,82,60,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {name.slice(0, 1)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-900)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {name}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: 'var(--gray-500)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {[city ? `📍 ${city}` : null, timeAgo].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          disabled={followBusy}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: isFollowing ? 'rgba(15,82,60,0.08)' : 'var(--brand-primary)',
            color: isFollowing ? 'var(--brand-primary)' : '#fff',
            fontSize: 14,
            fontWeight: 600,
            border: isFollowing ? '1px solid rgba(15,82,60,0.2)' : 'none',
            fontFamily: 'var(--font-body)',
            cursor: followBusy ? 'wait' : 'pointer',
            opacity: followBusy ? 0.7 : 1,
          }}
          onClick={() => void handleFollow()}
        >
          {isFollowing ? '已关注' : '关注'}
        </button>
        <button
          type="button"
          onClick={() => setReportTarget({ type: 'post', id: postId, name: content.slice(0, 30) })}
          aria-label="举报"
          style={{
            marginLeft: 6,
            background: 'transparent',
            border: 'none',
            color: 'var(--gray-500)',
            fontSize: 18,
            padding: '4px 6px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ⋯
        </button>
      </header>

      {/* 正文 */}
      <section style={{ padding: '14px 20px 0' }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--ink-900)',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-body)',
          }}
        >
          {content}
        </p>

        {tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {tags.map((tg) => (
              <span
                key={tg}
                style={{
                  background: 'rgba(15,82,60,0.06)',
                  color: 'var(--brand-primary)',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontFamily: 'var(--font-body)',
                }}
              >
                #{tg}
              </span>
            ))}
          </div>
        ) : null}

        {/* 关联服务卡片 */}
        {linkedService ? (
          <button
            type="button"
            onClick={() =>
              router.push(`/${locale}/merchant/capabilities` as `/${string}`)
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              marginTop: 14,
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(15,82,60,0.05), rgba(201,169,110,0.05))',
              border: '1px solid rgba(15,82,60,0.1)',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontSize: 17 }}>🔗</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                关联服务
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ink-900)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {linkedService}
              </p>
            </div>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>→</span>
          </button>
        ) : null}
      </section>

      {/* 评论区 */}
      <section
        style={{
          padding: '20px 20px 12px',
          borderTop: '8px solid rgba(15,52,40,0.04)',
          marginTop: 18,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink-900)',
            fontFamily: 'var(--font-display)',
          }}
        >
          评论 {commentList.length > 0 ? `· ${commentList.length}` : ''}
        </h2>

        {error ? (
          <p style={{ marginTop: 8, fontSize: 14, color: '#b9402d' }}>{error}</p>
        ) : null}

        <div ref={commentsRef} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {commentsLoading ? (
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>加载评论中…</p>
          ) : commentList.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>还没有评论，做第一个评论的人</p>
          ) : (
            commentList.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'rgba(15,82,60,0.08)',
                    color: 'var(--brand-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {c.authorName.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--ink-900)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {c.authorName}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: 'var(--ink-900)',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {c.content}
                  </p>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: 11,
                      color: 'var(--gray-500)',
                    }}
                  >
                    {c.createdAt}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Toast —— 浮在互动栏上方，确保用户能看到反馈 */}
      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(80px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,58,42,0.92)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            boxShadow: '0 8px 20px rgba(15,52,40,0.18)',
            zIndex: 40,
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 32px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      ) : null}

      {/* 底部固定互动栏 —— 小红书式 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid rgba(15,52,40,0.08)',
          padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 30,
          fontFamily: 'var(--font-body)',
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="说点什么…"
          style={{
            flex: 1,
            height: 40,
            padding: '0 14px',
            background: 'var(--gray-100)',
            border: 'none',
            borderRadius: 999,
            fontSize: 14,
            outline: 'none',
            color: 'var(--ink-900)',
            fontFamily: 'inherit',
            minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={() => void handleLike()}
          disabled={likeBusy}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: likeBusy ? 'wait' : 'pointer',
            color: isLiked ? '#b9402d' : 'var(--gray-700)',
            fontSize: 11,
            fontFamily: 'inherit',
            minWidth: 36,
            opacity: likeBusy ? 0.5 : 1,
          }}
          aria-label={isLiked ? '取消点赞' : '点赞'}
        >
          <span style={{ fontSize: 17 }}>{isLiked ? '❤' : '♡'}</span>
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleFavorite()}
          disabled={favBusy}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: favBusy ? 'wait' : 'pointer',
            color: isFavorited ? '#c9a96e' : 'var(--gray-700)',
            fontSize: 11,
            fontFamily: 'inherit',
            minWidth: 36,
            opacity: favBusy ? 0.5 : 1,
          }}
          aria-label={isFavorited ? '取消收藏' : '收藏'}
        >
          <span style={{ fontSize: 17 }}>{isFavorited ? '★' : '☆'}</span>
          <span>{favoriteCount}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || draft.trim().length === 0}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            background: draft.trim()
              ? 'linear-gradient(135deg, var(--brand-accent), var(--brand-accent-deep))'
              : 'var(--gray-200)',
            color: draft.trim() ? 'var(--brand-primary-deep)' : 'var(--gray-500)',
            fontSize: 14,
            fontWeight: 700,
            border: 'none',
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          {submitting ? '发送…' : `发送 ${comments > 0 ? `(${comments})` : ''}`}
        </button>
      </div>

      <ReportSheet
        open={reportTarget != null}
        onClose={() => setReportTarget(null)}
        target={reportTarget ?? { type: 'post', id: postId }}
      />
    </article>
  );
}
