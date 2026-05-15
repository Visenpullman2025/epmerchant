'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  type PostShape,
  pickAuthorAvatar,
  pickAuthorName,
  pickComments,
  pickContent,
  pickCreatedAt,
  pickLikes,
  pickTags,
  formatTimeAgo,
  getPostThumbnailGradient,
} from './PostCardUser';

interface Props {
  post: PostShape & {
    promo?: { title?: string; savingsHint?: string };
    rating?: number;
  };
}

export function PostCardMerchant({ post }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const name = pickAuthorName(post);
  const avatar = pickAuthorAvatar(post);
  const content = pickContent(post);
  const tags = pickTags(post);
  const likes = pickLikes(post);
  const comments = pickComments(post);
  const timeAgo = formatTimeAgo(pickCreatedAt(post));
  const rating = post.rating;
  const promo = post.promo;
  const thumbnailGradient = getPostThumbnailGradient(post);

  return (
    <article
      style={{
        background: '#fcfcfa',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(15,52,40,0.04), 0 4px 14px rgba(15,52,40,0.04)',
        border: '1px solid rgba(15,52,40,0.04)',
        borderTop: '3px solid #c9a96e',
      }}
    >
      {/* HEAD — biz avatar (brass &), name + 商家 badge, ★ + time */}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            color: '#0a3a2a',
            fontSize: 17,
          }}
        >
          {!avatar ? '&' : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
            {/* biz-badge — replica: Sora 800 9px, gradient bg */}
            <span
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 11,
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 5,
                background: 'linear-gradient(135deg, #c9a96e, #a07a32)',
                color: '#0a3a2a',
                letterSpacing: '0.04em',
              }}
            >
              商家
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              color: '#7a786d',
              marginTop: 1,
            }}
          >
            {rating ? `★ ${rating.toFixed(2)} · ` : ''}{timeAgo}
          </div>
        </div>
        <span style={{ color: '#a8a59a', fontSize: 17, lineHeight: 1 }}>⋮</span>
      </div>

      {/* TEXT */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: '#0a3a2a',
          lineHeight: 1.55,
        }}
      >
        {tags.length > 0 ? (
          <>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{ color: '#c9a96e', fontWeight: 600, marginRight: 6 }}
              >
                #{tag}
              </span>
            ))}{' '}
          </>
        ) : null}
        {content}
      </div>

      {/* THUMBNAIL when no promo */}
      {!promo ? (
        post.imageUrl ? (
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
          <div
            aria-hidden
            style={{
              width: '100%',
              height: 100,
              borderRadius: 10,
              background: thumbnailGradient,
              marginTop: 10,
            }}
          />
        )
      ) : null}

      {/* MERCH CTA — replica: brass gradient block, Sora 13 700 deep-ink, marginTop 12 */}
      {promo ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #c9a96e, #a07a32)',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 14,
              fontWeight: 700,
              color: '#0a3a2a',
              flex: 1,
              letterSpacing: '-0.005em',
            }}
          >
            {promo.title ?? '本周优惠'}
          </span>
          <span style={{ color: '#0a3a2a' }}>→</span>
        </div>
      ) : null}

      {/* FOOT — replica: ❤ N · 💬 N · spacer · 推门看看 → (brass) */}
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          ❤ {likes}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          💬 {comments}
        </span>
        <span style={{ flex: 1 }} />
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            router.push(`/${locale}/merchant/square` as `/${string}`);
          }}
          style={{
            color: '#c9a96e',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          推门看看 →
        </span>
      </div>
    </article>
  );
}
