'use client';

import {
  type PostShape,
  pickAuthorAvatar,
  pickAuthorName,
  pickCity,
  pickComments,
  pickContent,
  pickCreatedAt,
  pickLikes,
  formatTimeAgo,
} from './PostCardUser';

interface QATopAnswer {
  merchantName?: string;
  merchantAvatar?: string | null;
  content?: string;
  createdAt?: string;
  verified?: boolean;
}

interface QAPostShape extends PostShape {
  topAnswer?: QATopAnswer | null;
  category?: string;
  categoryLabel?: string;
}

interface Props {
  post: QAPostShape;
}

export function PostCardQA({ post }: Props) {
  const name = pickAuthorName(post);
  const avatar = pickAuthorAvatar(post);
  const content = pickContent(post);
  const city = pickCity(post);
  const timeAgo = formatTimeAgo(pickCreatedAt(post));
  const likes = pickLikes(post);
  const comments = pickComments(post);
  const answer = post.topAnswer ?? null;
  const categoryLabel = post.categoryLabel ?? post.category ?? '求推荐';

  const locationInfo = [city ? `📍 ${city}` : null, timeAgo].filter(Boolean).join(' · ');

  return (
    <article
      style={{
        position: 'relative',
        background: '#fcfcfa',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(15,52,40,0.04), 0 4px 14px rgba(15,52,40,0.04)',
        border: '1px solid rgba(15,52,40,0.04)',
      }}
    >
      {/* HEAD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: avatar
              ? undefined
              : 'linear-gradient(135deg, #7ab8d4, #3a7290)',
            backgroundImage: avatar ? `url(${avatar})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: '#0a3a2a',
            }}
          >
            {name}
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
      </div>

      {/* Q tag — replica: brass bg, "Q · 提问 / 求推荐" */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#c9a96e',
          background: 'rgba(201,169,110,0.12)',
          padding: '2px 8px',
          borderRadius: 5,
          fontWeight: 700,
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}
      >
        Q · 提问 / {categoryLabel}
      </span>

      {/* Question body */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: '#0a3a2a',
          lineHeight: 1.55,
        }}
      >
        {content}
      </div>

      {/* Answer mini-card — replica: gray bg, borderLeft brand-primary 3px */}
      {answer ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 10,
            padding: 10,
            background: 'rgba(15,82,60,0.04)',
            borderRadius: 8,
            borderLeft: '3px solid #0f523c',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: answer.merchantAvatar
                ? undefined
                : 'linear-gradient(135deg, #c9a96e, #a07a32)',
              backgroundImage: answer.merchantAvatar ? `url(${answer.merchantAvatar})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#5d6d68',
              }}
            >
              ✅ <strong style={{ color: '#0a3a2a' }}>{answer.merchantName ?? '商家'}</strong>{' '}
              商家
              {answer.createdAt ? <> · {formatTimeAgo(answer.createdAt)}</> : null}
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#0a3a2a',
                marginTop: 2,
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {answer.content}
            </div>
          </div>
        </div>
      ) : (
        /* "✅ N 商家已回答" chip when no full answer */
        comments > 0 ? (
          <div
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              color: '#0f523c',
              fontWeight: 600,
            }}
          >
            ✅ {comments} 商家已回答
          </div>
        ) : null
      )}

      {/* FOOT */}
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
          💬 {comments} 回答
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: '#0f523c', fontWeight: 600 }}>
          {comments > 0 ? `${comments} 个回答` : '暂无回答'}
        </span>
      </div>
    </article>
  );
}
