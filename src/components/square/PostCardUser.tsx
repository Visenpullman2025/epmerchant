'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getServiceNameZh } from '@/lib/service-name-map';

// ------------------------------ Defensive adapters ------------------------------

export interface PostAuthor {
  id?: number | string;
  nickname?: string;
  name?: string;
  avatarUrl?: string | null;
  verified?: boolean;
}

export interface PostShape {
  id: number | string;
  type?: 'user_post' | 'merchant_post' | 'featured' | 'question' | string;
  content?: string;
  content_i18n?: { zh?: string; en?: string; th?: string };
  tags?: string[] | string;
  imageUrl?: string | null;
  likes?: number;
  likesCount?: number;
  likes_count?: number;
  comments?: number;
  commentsCount?: number;
  comments_count?: number;
  shares?: number;
  sharesCount?: number;
  shares_count?: number;
  createdAt?: string;
  created_at?: string;
  city_code?: string;
  cityCode?: string;
  linked_service_code?: string | null;
  linkedServiceCode?: string | null;
  linked_merchant_id?: number | string | null;
  linkedMerchantId?: number | string | null;
  author?: PostAuthor;
  authorName?: string;
  authorAvatar?: string | null;
  isFollowingAuthor?: boolean;
  isLiked?: boolean;
}

export function pickContent(p: PostShape): string {
  return p.content_i18n?.zh ?? p.content ?? '';
}

export function pickTags(p: PostShape): string[] {
  const t = p.tags;
  if (Array.isArray(t)) return t.filter((x) => typeof x === 'string');
  if (typeof t === 'string') {
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function pickLikes(p: PostShape): number {
  return p.likes ?? p.likesCount ?? p.likes_count ?? 0;
}

export function pickComments(p: PostShape): number {
  return p.comments ?? p.commentsCount ?? p.comments_count ?? 0;
}

function pickShares(p: PostShape): number {
  return p.shares ?? p.sharesCount ?? p.shares_count ?? 0;
}

export function pickCreatedAt(p: PostShape): string {
  return p.createdAt ?? p.created_at ?? '';
}

export function pickAuthorName(p: PostShape): string {
  return p.authorName ?? p.author?.nickname ?? p.author?.name ?? '匿名';
}

export function pickAuthorAvatar(p: PostShape): string | null {
  return p.authorAvatar ?? p.author?.avatarUrl ?? null;
}

export function pickLinkedServiceCode(p: PostShape): string | null {
  return p.linkedServiceCode ?? p.linked_service_code ?? null;
}

export function pickCity(p: PostShape): string {
  return p.cityCode ?? p.city_code ?? '';
}

// ------------------------------ Thumbnail gradient fallback ------------------------------

const POST_GRADIENTS: Record<string, string> = {
  '雨季屋顶':   'linear-gradient(135deg, #d6e9d4 0%, #a8c8a1 100%)',
  '空调季':     'linear-gradient(135deg, #e8f1f8 0%, #b4d4e8 100%)',
  '宠物寄养':   'linear-gradient(135deg, #f8e6d2 0%, #e2b88e 100%)',
  '新店开张':   'linear-gradient(135deg, #f4ead4 0%, #d4b375 100%)',
  '泳池小知识': 'linear-gradient(135deg, #d4e8f0 0%, #88b7d4 100%)',
  '空调':       'linear-gradient(135deg, #e8f1f8 0%, #b4d4e8 100%)',
  '泳池':       'linear-gradient(135deg, #d4e8f0 0%, #88b7d4 100%)',
  '宠物':       'linear-gradient(135deg, #f8e6d2 0%, #e2b88e 100%)',
  '清洁':       'linear-gradient(135deg, #e6efe8 0%, #b7d0bd 100%)',
  '维修':       'linear-gradient(135deg, #efe6d6 0%, #d4b78a 100%)',
  default:     'linear-gradient(135deg, #f0ece0 0%, #c8c0a8 100%)',
};

export function getPostThumbnailGradient(post: PostShape): string {
  const tagList = pickTags(post);
  for (const tag of tagList) {
    if (POST_GRADIENTS[tag]) return POST_GRADIENTS[tag];
    for (const key of Object.keys(POST_GRADIENTS)) {
      if (key !== 'default' && tag.includes(key)) return POST_GRADIENTS[key];
    }
  }
  const code = pickLinkedServiceCode(post);
  if (code && POST_GRADIENTS[code]) return POST_GRADIENTS[code];
  return POST_GRADIENTS.default;
}

// Triple-photo placeholder palette — 仅本文件用
const SWATCH_A = 'linear-gradient(135deg, #7ab8d4, #3a7290)';
const SWATCH_B = 'linear-gradient(135deg, #a8d8c2, #5d8970)';
const SWATCH_C = 'linear-gradient(135deg, #f4c896, #d4a473)';
const SWATCH_D = 'linear-gradient(135deg, #d4ad88, #8a6f3d)';
const SWATCH_E = 'linear-gradient(135deg, #0f523c, #0a3a2a)';

const TRIPLE_PALETTE: Record<string, [string, string, string]> = {
  '雨季屋顶':   [SWATCH_A, SWATCH_C, SWATCH_B],
  '空调季':     [SWATCH_A, SWATCH_C, SWATCH_B],
  '空调':       [SWATCH_A, SWATCH_C, SWATCH_B],
  '宠物寄养':   [SWATCH_C, SWATCH_D, SWATCH_A],
  '宠物':       [SWATCH_C, SWATCH_D, SWATCH_A],
  '新店开张':   [SWATCH_C, SWATCH_E, SWATCH_D],
  '泳池小知识': [SWATCH_A, SWATCH_B, SWATCH_E],
  '泳池':       [SWATCH_A, SWATCH_B, SWATCH_E],
  '清洁':       [SWATCH_B, SWATCH_C, SWATCH_A],
  '维修':       [SWATCH_C, SWATCH_D, SWATCH_B],
};

const TRIPLE_DEFAULT: [string, string, string] = [SWATCH_A, SWATCH_C, SWATCH_B];

function pickTripleGradients(post: PostShape): [string, string, string] {
  const tagList = pickTags(post);
  for (const tag of tagList) {
    if (TRIPLE_PALETTE[tag]) return TRIPLE_PALETTE[tag];
    for (const key of Object.keys(TRIPLE_PALETTE)) {
      if (tag.includes(key)) return TRIPLE_PALETTE[key];
    }
  }
  const code = pickLinkedServiceCode(post);
  if (code && TRIPLE_PALETTE[code]) return TRIPLE_PALETTE[code];
  return TRIPLE_DEFAULT;
}

export function formatTimeAgo(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const min = Math.max(1, Math.floor((Date.now() - t) / 60000));
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} 周前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

// ------------------------------ Component ------------------------------

interface Props {
  post: PostShape;
}

export function PostCardUser({ post }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const name = pickAuthorName(post);
  const avatar = pickAuthorAvatar(post);
  const content = pickContent(post);
  const tags = pickTags(post);
  const likes = pickLikes(post);
  const comments = pickComments(post);
  const shares = pickShares(post);
  const linkedService = pickLinkedServiceCode(post);
  const city = pickCity(post);
  const timeAgo = formatTimeAgo(pickCreatedAt(post));
  const isLiked = post.isLiked ?? false;

  const locationInfo = [city ? `📍 ${city}` : null, timeAgo].filter(Boolean).join(' · ');

  return (
    <article
      style={{
        background: '#fcfcfa',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(15,52,40,0.04), 0 4px 14px rgba(15,52,40,0.04)',
        border: '1px solid rgba(15,52,40,0.04)',
      }}
    >
      {/* HEAD — replica: avatar 38px circle, name Inter 13 600, info Inter 10.5 gray-500, ⋮ right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: avatar
              ? undefined
              : 'linear-gradient(135deg, #c9a96e, #a07a32)',
            backgroundImage: avatar ? `url(${avatar})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#0a3a2a',
              }}
            >
              {name}
            </span>
          </div>
          {locationInfo ? (
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#7a786d',
                marginTop: 1,
              }}
            >
              {locationInfo}
            </div>
          ) : null}
        </div>
        <span
          style={{
            color: '#a8a59a',
            fontSize: 17,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ⋮
        </span>
      </div>

      {/* TEXT + inline topic tags */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: '#0a3a2a',
          lineHeight: 1.55,
        }}
      >
        {content}
        {tags.length > 0 ? (
          <>
            {tags.map((tag) => (
              <span key={tag}>
                {' '}
                <span
                  style={{
                    color: '#c9a96e',
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              </span>
            ))}
          </>
        ) : null}
      </div>

      {/* PHOTOS — triple grid or single image (replica: gap 4, aspect 1, radius 10) */}
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          style={{
            width: '100%',
            aspectRatio: '1.6',
            borderRadius: 10,
            objectFit: 'cover',
            marginTop: 10,
            display: 'block',
          }}
        />
      ) : (
        /* Triple placeholder gradient — replica palette per tag (5 swatches a/b/c/d/e) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            marginTop: 10,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {pickTripleGradients(post).map((g, i) => (
            <div key={i} style={{ aspectRatio: '1', background: g }} />
          ))}
        </div>
      )}

      {/* LINKED SERVICE */}
      {linkedService ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            router.push(`/${locale}/merchant/capabilities` as `/${string}`);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(15,82,60,0.05), rgba(201,169,110,0.05))',
            border: '1px solid rgba(15,82,60,0.1)',
            borderRadius: 10,
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          <span style={{ color: '#c9a96e', fontSize: 14 }}>⏱</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#7a786d',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              来自服务
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                color: '#0a3a2a',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getServiceNameZh(linkedService) ?? linkedService}
            </div>
          </div>
          <span style={{ color: '#0f523c', fontSize: 14, fontWeight: 700 }}>→</span>
        </div>
      ) : null}

      {/* FOOT — replica: ❤ N · 💬 N · 🔗 N · spacer · ✓ 已下单 */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(15,52,40,0.06)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#5d6d68',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: isLiked ? '#b9402d' : '#5d6d68',
          }}
        >
          ❤ {likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          💬 {comments}
        </span>
        {shares > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            🔗 {shares}
          </span>
        ) : null}
        <span style={{ flex: 1 }} />
        {linkedService ? (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#7a786d' }}>
            ✓ 已下单
          </span>
        ) : null}
      </div>
    </article>
  );
}
