'use client';

import {
  type PostShape,
  pickComments,
  pickContent,
  pickLikes,
} from './PostCardUser';

interface FeaturedPostShape extends PostShape {
  issue_number?: string;
  issueNumber?: string;
  linked_service_count?: number;
  linkedServiceCount?: number;
  views?: number;
  viewsCount?: number;
  title?: string;
}

interface Props {
  post: FeaturedPostShape;
}

function pickIssueNumber(p: FeaturedPostShape): string {
  return p.issueNumber ?? p.issue_number ?? '编辑精选';
}

function pickViews(p: FeaturedPostShape): number {
  return p.views ?? p.viewsCount ?? 0;
}

function pickLinkedServiceCount(p: FeaturedPostShape): number {
  return p.linkedServiceCount ?? p.linked_service_count ?? 0;
}

function splitTitleAndBody(content: string): { title: string; body: string } {
  if (!content) return { title: '', body: '' };
  const firstBreak = content.search(/[。！？\n]/);
  if (firstBreak === -1 || firstBreak > 36) {
    const head = content.length > 24 ? content.slice(0, 24) + '…' : content;
    return { title: head, body: content.length > 24 ? content.slice(24) : '' };
  }
  return {
    title: content.slice(0, firstBreak + 1),
    body: content.slice(firstBreak + 1).trim(),
  };
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function PostCardFeatured({ post }: Props) {
  const content = pickContent(post);
  const likes = pickLikes(post);
  const views = pickViews(post);
  const linkedSvcCount = pickLinkedServiceCount(post);
  const issue = pickIssueNumber(post);

  const { title: derivedTitle, body } = splitTitleAndBody(content);
  const title = post.title ?? derivedTitle;

  return (
    <article
      style={{
        background: 'linear-gradient(135deg, #0a3a2a 0%, #0f523c 100%)',
        color: '#fcfcfa',
        padding: 18,
        borderRadius: 14,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* brass radial glow */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -50,
          right: -50,
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(201,169,110,0.25), transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* label — replica: Inter 9.5 letterSpacing 0.18em color brass */}
      <div
        style={{
          position: 'relative',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          letterSpacing: '0.18em',
          color: '#c9a96e',
          fontWeight: 700,
          textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        编辑精选 · {issue}
      </div>

      {/* h3 — replica: Sora 18 700, margin 6px 0 0, letterSpacing -0.02em, lineHeight 1.2 */}
      <h3
        style={{
          position: 'relative',
          fontFamily: 'Sora, sans-serif',
          fontSize: 17,
          fontWeight: 700,
          margin: '6px 0 0',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: '#fcfcfa',
          zIndex: 1,
        }}
      >
        {title || '住芭提雅雨季，家里 5 件事不能拖。'}
      </h3>

      {/* sub — replica: Inter 11.5 opacity 0.7, marginTop 6 */}
      {body || linkedSvcCount > 0 ? (
        <div
          style={{
            position: 'relative',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            opacity: 0.7,
            marginTop: 6,
            zIndex: 1,
          }}
        >
          {body || null}
          {linkedSvcCount > 0 ? ` · 涉及 ${linkedSvcCount} 个标准服务` : null}
        </div>
      ) : null}

      {/* stats — replica: gap 14, marginTop 14, fontSize 11, opacity 0.85 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 14,
          marginTop: 14,
          zIndex: 1,
        }}
      >
        {views > 0 ? (
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              opacity: 0.85,
            }}
          >
            📖 阅读 {formatViews(views)}
          </div>
        ) : null}
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, opacity: 0.85 }}>
          ❤ {likes}
        </div>
        {pickComments(post) > 0 ? (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, opacity: 0.85 }}>
            💬 {pickComments(post)}
          </div>
        ) : null}
      </div>

      {/* CTA line — replica: color brass, Inter 12 700, marginTop 10 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          color: '#c9a96e',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 700,
          zIndex: 1,
        }}
      >
        阅读全文 →
      </div>
    </article>
  );
}
