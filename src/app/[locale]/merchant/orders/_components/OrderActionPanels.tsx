import type { ReviewDraft } from "../_lib/review";

type Translate = (key: string, values?: Record<string, string>) => string;

export function ScheduleEditor({
  scheduleDraft,
  merchantNote,
  minTime,
  t,
  onScheduleDraftChange,
  onMerchantNoteChange
}: {
  scheduleDraft: string;
  merchantNote: string;
  minTime?: string;
  t: Translate;
  onScheduleDraftChange: (value: string) => void;
  onMerchantNoteChange: (value: string) => void;
}) {
  return (
    <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-2.5">
      <div>
        <label className="field-label">{t("confirmedServiceTime")}</label>
        <input
          className="field-input"
          min={minTime}
          type="datetime-local"
          value={scheduleDraft}
          onChange={(event) => onScheduleDraftChange(event.target.value)}
        />
      </div>
      <div>
        <label className="field-label">{t("merchantNote")}</label>
        <input
          className="field-input"
          placeholder={t("merchantNote")}
          value={merchantNote}
          onChange={(event) => onMerchantNoteChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function InServiceReschedule({
  scheduleDraft,
  minTime,
  t,
  onScheduleDraftChange,
  onUpdateSchedule
}: {
  scheduleDraft: string;
  minTime?: string;
  t: Translate;
  onScheduleDraftChange: (value: string) => void;
  onUpdateSchedule: () => void;
}) {
  return (
    <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-2.5">
      <div>
        <label className="field-label">{t("confirmedServiceTime")}</label>
        <input
          className="field-input"
          min={minTime}
          type="datetime-local"
          value={scheduleDraft}
          onChange={(event) => onScheduleDraftChange(event.target.value)}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {t("rescheduleCompensationHint")}
        </p>
      </div>
      <div className="mt-3">
        <button className="apple-btn-primary" onClick={onUpdateSchedule} type="button">
          {t("updateSchedule")}
        </button>
      </div>
    </div>
  );
}

export function CustomerReviewPanel({
  draft,
  submitting,
  t,
  onDraftChange,
  onSubmit
}: {
  draft: ReviewDraft;
  submitting: boolean;
  t: Translate;
  onDraftChange: (draft: ReviewDraft) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="merchant-order-action-panel merchant-order-action-panel--compact mt-2.5">
      <div>
        <label className="field-label">{t("reviewRating")}</label>
        <select className="field-select" value={draft.rating} onChange={(event) => onDraftChange({ ...draft, rating: event.target.value })}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={String(rating)}>
              {rating}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">{t("reviewContent")}</label>
        <textarea className="field-textarea" value={draft.content} onChange={(event) => onDraftChange({ ...draft, content: event.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input checked={draft.publishToSquare} onChange={(event) => onDraftChange({ ...draft, publishToSquare: event.target.checked })} type="checkbox" />
        {t("publishToSquare")}
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input checked={draft.squarePublishAnonymous} onChange={(event) => onDraftChange({ ...draft, squarePublishAnonymous: event.target.checked })} type="checkbox" />
        {t("squarePublishAnonymous")}
      </label>
      <button className="apple-btn-primary" disabled={submitting} onClick={onSubmit} type="button">
        {submitting ? t("reviewSubmitting") : t("reviewCustomer")}
      </button>
    </div>
  );
}

export function OrderActions({
  showScheduleEditor,
  scheduleSaved,
  showStartService,
  startEnabled,
  showAwaitPayment,
  canMarkDone,
  canCancel,
  t,
  onSaveSchedule,
  onStartService,
  onMarkDone,
  onCancel
}: {
  showScheduleEditor: boolean;
  scheduleSaved: boolean;
  showStartService: boolean;
  startEnabled: boolean;
  showAwaitPayment: boolean;
  canMarkDone: boolean;
  canCancel: boolean;
  t: Translate;
  onSaveSchedule: () => void;
  onStartService: () => void;
  onMarkDone: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {showScheduleEditor ? (
        <button className="apple-btn-primary" onClick={onSaveSchedule} type="button">
          {scheduleSaved ? t("updateSchedule") : t("saveSchedule")}
        </button>
      ) : null}
      {showStartService ? (
        <button className="apple-btn-secondary" disabled={!startEnabled} onClick={onStartService} type="button">
          {t("actions.inService")}
        </button>
      ) : null}
      {showAwaitPayment ? (
        <p className="w-full text-sm" style={{ color: "var(--muted)" }}>
          {t("awaitPayment")}
        </p>
      ) : null}
      {canMarkDone ? (
        <button className="apple-btn-secondary" onClick={onMarkDone} type="button">
          {t("actions.done")}
        </button>
      ) : null}
      {canCancel ? (
        <button className="apple-btn-secondary" onClick={onCancel} type="button">
          {t("actions.cancelled")}
        </button>
      ) : null}
    </div>
  );
}
