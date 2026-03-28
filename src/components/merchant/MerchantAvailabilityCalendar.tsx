"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const DEFAULT_TZ = "Asia/Bangkok";

type MerchantAvailabilityCalendarProps = {
  locale: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function bangkokYmd(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${day}`;
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

/** 0 = Sunday … 6 = Saturday, for the given calendar day in Asia/Bangkok */
function bangkokWeekdaySun0(year: number, month1to12: number, day: number): number {
  const iso = `${year}-${pad2(month1to12)}-${pad2(day)}T12:00:00+07:00`;
  const inst = new Date(iso);
  const short = new Intl.DateTimeFormat("en", { timeZone: DEFAULT_TZ, weekday: "short" }).format(inst);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const key = short.replace(/\.$/, "").slice(0, 3);
  return map[key] ?? 0;
}

function parseTodayBangkokMonth(): { year: number; month: number } {
  const [y, m] = bangkokYmd(new Date()).split("-").map(Number);
  return { year: y, month: m || 1 };
}

function normalizePayloadData(raw: unknown): {
  timeZone: string;
  openDates: string[];
  fullyBookedDates: string[];
} {
  if (!raw || typeof raw !== "object") {
    return { timeZone: DEFAULT_TZ, openDates: [], fullyBookedDates: [] };
  }
  const o = raw as Record<string, unknown>;
  const tz =
    typeof o.timeZone === "string" ? o.timeZone : typeof o.time_zone === "string" ? o.time_zone : DEFAULT_TZ;

  const od = o.openDates ?? o.open_dates;
  if (Array.isArray(od)) {
    const openDates = od.filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x));
    const fb = o.fullyBookedDates ?? o.fully_booked_dates;
    const fullyBookedDates = Array.isArray(fb)
      ? fb.filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x))
      : [];
    return { timeZone: tz || DEFAULT_TZ, openDates, fullyBookedDates };
  }

  const slots = o.slotStarts ?? o.slot_starts;
  if (Array.isArray(slots)) {
    const dates = slots
      .map((s) => (typeof s === "string" ? s.slice(0, 10) : ""))
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
    return { timeZone: tz || DEFAULT_TZ, openDates: [...new Set(dates)], fullyBookedDates: [] };
  }

  return { timeZone: tz || DEFAULT_TZ, openDates: [], fullyBookedDates: [] };
}

function prevMonth(year: number, month: number) {
  if (month <= 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function nextMonth(year: number, month: number) {
  if (month >= 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export default function MerchantAvailabilityCalendar({ locale }: MerchantAvailabilityCalendarProps) {
  const t = useTranslations("MerchantAvailability");
  const [timeZone, setTimeZone] = useState(DEFAULT_TZ);
  const [openDates, setOpenDates] = useState<Set<string>>(() => new Set());
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(() => new Set());
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");
  const [saveMessage, setSaveMessage] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveDetail, setSaveDetail] = useState("");
  const [visible, setVisible] = useState(parseTodayBangkokMonth);

  const todayYmd = useMemo(() => bangkokYmd(new Date()), []);

  const localeTag = locale === "zh" ? "zh-CN" : locale === "th" ? "th-TH" : "en-GB";

  const monthTitle = useMemo(() => {
    const inst = new Date(`${visible.year}-${pad2(visible.month)}-15T12:00:00+07:00`);
    return new Intl.DateTimeFormat(localeTag, {
      timeZone: DEFAULT_TZ,
      year: "numeric",
      month: "long"
    }).format(inst);
  }, [visible.year, visible.month, localeTag]);

  const weekdayLabels = useMemo(() => {
    const sunToSat = [
      "2023-01-01T12:00:00+07:00",
      "2023-01-02T12:00:00+07:00",
      "2023-01-03T12:00:00+07:00",
      "2023-01-04T12:00:00+07:00",
      "2023-01-05T12:00:00+07:00",
      "2023-01-06T12:00:00+07:00",
      "2023-01-07T12:00:00+07:00"
    ];
    return sunToSat.map((iso) =>
      new Intl.DateTimeFormat(localeTag, { timeZone: DEFAULT_TZ, weekday: "narrow" }).format(new Date(iso))
    );
  }, [localeTag]);

  const gridCells = useMemo(() => {
    const { year: y, month: m } = visible;
    const dim = daysInMonth(y, m);
    const firstWd = bangkokWeekdaySun0(y, m, 1);
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstWd; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(`${y}-${pad2(m)}-${pad2(d)}`);
    while (cells.length % 7 !== 0) cells.push(null);
    while (cells.length < 42) cells.push(null);
    return cells;
  }, [visible]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoadStatus("loading");
      try {
        const res = await fetch("/api/merchant/availability", { cache: "no-store", credentials: "include" });
        const text = await res.text();
        let json: { code?: number; data?: unknown; message?: string } | null = null;
        try {
          json = JSON.parse(text) as { code?: number; data?: unknown; message?: string };
        } catch {
          json = null;
        }
        if (cancelled) return;
        if (!res.ok) {
          setOpenDates(new Set());
          setFullyBookedDates(new Set());
          setTimeZone(DEFAULT_TZ);
          setLoadStatus("error");
          return;
        }
        if (json && json.code === 0 && json.data !== undefined) {
          const parsed = normalizePayloadData(json.data);
          setTimeZone(parsed.timeZone);
          setOpenDates(new Set(parsed.openDates));
          setFullyBookedDates(new Set(parsed.fullyBookedDates));
          setLoadStatus("ok");
          return;
        }
        if (json && json.code !== 0) {
          setOpenDates(new Set());
          setFullyBookedDates(new Set());
          setLoadStatus("error");
          return;
        }
        setOpenDates(new Set());
        setFullyBookedDates(new Set());
        setLoadStatus("error");
      } catch {
        if (!cancelled) {
          setLoadStatus("error");
          setOpenDates(new Set());
          setFullyBookedDates(new Set());
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleDate(ymd: string) {
    if (ymd < todayYmd) return;
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(ymd)) next.delete(ymd);
      else next.add(ymd);
      return next;
    });
    setSaveMessage("idle");
  }

  async function onSave() {
    setSaveMessage("saving");
    setSaveDetail("");
    try {
      const res = await fetch("/api/merchant/availability", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeZone,
          openDates: Array.from(openDates).sort()
        })
      });
      const text = await res.text();
      let json: { code?: number; message?: string } | null = null;
      try {
        json = JSON.parse(text) as { code?: number; message?: string };
      } catch {
        json = null;
      }
      if (!res.ok || !json || json.code !== 0) {
        setSaveMessage("error");
        setSaveDetail(json?.message || t("saveError"));
        return;
      }
      setSaveMessage("success");
      setSaveDetail("");
    } catch {
      setSaveMessage("error");
      setSaveDetail(t("saveError"));
    }
  }

  const backendMissing = loadStatus === "error";

  return (
    <article className="apple-card">
      <h2 className="text-base font-semibold">{t("title")}</h2>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
        {t("description")}
      </p>
      {backendMissing ? (
        <p className="mt-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {t("syncPending")}
        </p>
      ) : null}
      {loadStatus === "loading" ? (
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          {t("loading")}
        </p>
      ) : (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              className="apple-btn-secondary min-w-[4rem] px-2 py-1 text-sm"
              onClick={() => setVisible((v) => prevMonth(v.year, v.month))}
              type="button"
            >
              {t("prevMonth")}
            </button>
            <span className="text-center text-sm font-semibold">{monthTitle}</span>
            <button
              className="apple-btn-secondary min-w-[4rem] px-2 py-1 text-sm"
              onClick={() => setVisible((v) => nextMonth(v.year, v.month))}
              type="button"
            >
              {t("nextMonth")}
            </button>
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {weekdayLabels.map((w, i) => (
              <div className="text-center text-[10px] font-medium" key={`wd-${i}`} style={{ color: "var(--muted)" }}>
                {w}
              </div>
            ))}
            {gridCells.map((ymd, idx) => {
              if (!ymd) {
                return <div className="h-10" key={`empty-${idx}`} />;
              }
              const isOpen = openDates.has(ymd);
              const isPast = ymd < todayYmd;
              const isBookedOut = fullyBookedDates.has(ymd);
              return (
                <button
                  aria-label={t("dayToggleAria", { date: ymd })}
                  className="flex h-10 flex-col items-center justify-center rounded-lg border text-xs transition-colors disabled:opacity-40"
                  disabled={isPast || backendMissing}
                  key={ymd}
                  onClick={() => toggleDate(ymd)}
                  style={{
                    borderColor: isOpen ? "var(--ok)" : "var(--border)",
                    backgroundColor: isOpen ? "color-mix(in srgb, var(--ok) 22%, transparent)" : "transparent",
                    color: isOpen ? "var(--ok)" : "var(--muted)"
                  }}
                  type="button"
                >
                  <span className="font-semibold">{Number(ymd.slice(8, 10))}</span>
                  {isBookedOut && isOpen ? (
                    <span className="text-[9px] leading-none" style={{ color: "var(--warn)" }}>
                      {t("fullyBookedShort")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        {t("legend")}
      </p>
      {fullyBookedDates.size > 0 ? (
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {t("fullyBookedLegend")}
        </p>
      ) : null}
      <button
        className="apple-btn-primary mt-3 w-full"
        disabled={saveMessage === "saving" || loadStatus === "loading" || backendMissing}
        onClick={() => void onSave()}
        type="button"
      >
        {saveMessage === "saving" ? t("saving") : t("save")}
      </button>
      {saveMessage === "success" ? (
        <p className="mt-2 text-sm" style={{ color: "var(--ok)" }}>
          {t("saved")}
        </p>
      ) : null}
      {saveMessage === "error" && saveDetail ? (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {saveDetail}
        </p>
      ) : null}
    </article>
  );
}
