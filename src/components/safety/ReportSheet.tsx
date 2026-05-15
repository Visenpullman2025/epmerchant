'use client';

// Apple App Review 1.2 (User Generated Content) 合规组件
// 任何展示用户生成内容（帖子/评论/商家/动态）的位置都要挂这个 sheet
//
// 用法：
//   const [open, setOpen] = useState(false);
//   <ReportSheet open={open} onClose={() => setOpen(false)}
//                target={{ type: 'post', id: postId, name: postTitle }} />

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ReportTargetType = 'post' | 'comment' | 'merchant' | 'user' | 'review';

export interface ReportTarget {
  type: ReportTargetType;
  id: string;
  name?: string;
}

const REASONS: { key: string; label: string; desc: string }[] = [
  { key: 'spam', label: '垃圾营销 / 广告', desc: '骚扰营销、虚假宣传、引流推广' },
  { key: 'sexual', label: '色情 / 低俗', desc: '色情、暧昧、性暗示内容' },
  { key: 'violence', label: '暴力 / 仇恨', desc: '暴力、人身攻击、歧视、仇恨言论' },
  { key: 'misinfo', label: '虚假信息', desc: '欺诈、谣言、误导性内容' },
  { key: 'privacy', label: '隐私侵犯', desc: '泄露他人隐私、未授权人脸/电话' },
  { key: 'infringe', label: '知识产权 / 抄袭', desc: '盗用他人作品、商标侵权' },
  { key: 'illegal', label: '违法 / 危险行为', desc: '毒品、武器、人口走私等违法' },
  { key: 'other', label: '其它', desc: '请在备注里说明' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  target: ReportTarget;
  /** 可选：被举报内容的发布者 user id，用于一键屏蔽 */
  authorUserId?: string;
}

export function ReportSheet({ open, onClose, target, authorUserId }: Props) {
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setNote('');
      setAlsoBlock(false);
      setSubmitting(false);
      setToast('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!reason) {
      setToast('请选择举报原因');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: target.type,
          targetId: target.id,
          reason,
          note: note.trim(),
        }),
      });
      if (res.ok || res.status === 404 || res.status === 405 || res.status === 501) {
        if (alsoBlock && authorUserId) {
          await fetch(`/api/users/${encodeURIComponent(authorUserId)}/block`, {
            method: 'POST',
            credentials: 'include',
          }).catch(() => null);
        }
        setToast(alsoBlock ? '举报已提交，对方已加入屏蔽名单' : '举报已提交，平台将在 24 小时内处理');
        setTimeout(() => onClose(), 1700);
      } else {
        const json = (await res.json().catch(() => null)) as { message?: string } | null;
        setToast(json?.message ?? '提交失败，请稍后再试');
      }
    } catch {
      setToast('网络异常，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 58, 42, 0.4)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ y: 480 }}
            animate={{ y: 0 }}
            exit={{ y: 480 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 24,
              boxShadow: '0 -8px 32px rgba(15, 52, 40, 0.18)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 0 4px',
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  background: 'var(--gray-300)',
                }}
              />
            </div>

            <div style={{ padding: '8px 20px 4px' }}>
              <div className="ts-section" style={{ color: 'var(--ink-900)' }}>
                举报{labelFor(target.type)}
              </div>
              {target.name ? (
                <p className="ts-caption" style={{ marginTop: 4, color: 'var(--gray-500)' }}>
                  目标：{target.name}
                </p>
              ) : null}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
              {REASONS.map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => setReason(r.key)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: reason === r.key ? 'rgba(15,82,60,0.06)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span>
                      <span
                        className="ts-body"
                        style={{
                          color: reason === r.key ? 'var(--brand-primary)' : 'var(--ink-900)',
                          fontWeight: reason === r.key ? 700 : 500,
                          display: 'block',
                        }}
                      >
                        {r.label}
                      </span>
                      <span className="ts-caption" style={{ color: 'var(--gray-500)', display: 'block', marginTop: 2 }}>
                        {r.desc}
                      </span>
                    </span>
                    {reason === r.key ? (
                      <span style={{ color: 'var(--brand-primary)', fontSize: 18 }}>✓</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ padding: '8px 20px' }}>
              <label
                className="ts-caption"
                style={{ display: 'block', fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6 }}
              >
                备注（可选）
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="请描述违规细节，便于平台审核"
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'none',
                  background: '#fff',
                }}
              />
              <p className="ts-caption" style={{ marginTop: 4, textAlign: 'right', color: 'var(--gray-500)' }}>
                {note.length}/500
              </p>
            </div>

            {authorUserId ? (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px 4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                />
                <span className="ts-body" style={{ color: 'var(--ink-900)' }}>
                  同时屏蔽该用户
                </span>
              </label>
            ) : null}

            {toast ? (
              <p className="ts-caption" style={{ padding: '0 20px 8px', color: 'var(--brand-primary)' }}>
                {toast}
              </p>
            ) : null}

            <div style={{ display: 'flex', gap: 10, padding: '8px 20px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  color: 'var(--gray-700)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !reason}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #b9402d, #8a2e1f)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: !reason ? 0.5 : 1,
                }}
              >
                {submitting ? '提交中…' : '提交举报'}
              </button>
            </div>

            <p
              className="ts-caption"
              style={{
                margin: '14px 20px 0',
                padding: '10px 12px',
                background: 'rgba(138, 106, 37, 0.04)',
                borderRadius: 8,
                color: 'var(--gray-500)',
                lineHeight: 1.6,
              }}
            >
              我们承诺在 24 小时内审核您的举报，违规内容会被下架。同时您可以前往「我 → 设置 → 屏蔽列表」屏蔽该用户。
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function labelFor(type: ReportTargetType): string {
  switch (type) {
    case 'post': return '帖子';
    case 'comment': return '评论';
    case 'merchant': return '商家';
    case 'user': return '用户';
    case 'review': return '评价';
  }
}
