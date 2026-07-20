"use client";
// FIX WAVE F4 — M02-038: web Day/Week/Month calendar for Visit Management.
// Segmented view switch; month grid (Sun-first — KSA week), week columns, day
// list. Visits are placed by window_start (UTC day, consistent with every
// other timestamp render in the app); clicking a visit opens its detail page.
// All strings arrive pre-translated from the server page (strings-prop canon).
import { useMemo, useState } from "react";

export type CalVisit = {
  id: string;
  windowStart: string;   // ISO
  windowEnd: string;     // ISO
  factoryName: string;
  planningStatus: string;
  planningLabel: string; // pre-translated
  opsLabel: string;      // pre-translated
  typeLabel: string;     // pre-translated
};

export type CalendarStrings = {
  viewDay: string;
  viewWeek: string;
  viewMonth: string;
  viewSwitchAria: string;
  prev: string;
  next: string;
  today: string;
  emptyRange: string;
  moreCount: string;     // "{n}" placeholder
  visitsOn: string;      // "{n}" placeholder — count line for day view
};

type ViewKey = "day" | "week" | "month";

const DAY_MS = 86_400_000;
const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical", expired: "ax-lozenge--critical" };

// UTC day helpers — placement key is the ISO date of window_start (UTC),
// matching how windows are rendered everywhere else in the portal.
const dayKey = (iso: string) => iso.slice(0, 10);
const utcMidnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const keyOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const timeOf = (iso: string) => iso.slice(11, 16);

export default function CalendarBoard({ visits, locale, strings }: {
  visits: CalVisit[];
  locale: "en" | "ar";
  strings: CalendarStrings;
}) {
  const [view, setView] = useState<ViewKey>("month");
  const [anchorMs, setAnchorMs] = useState(() => utcMidnight(new Date()));

  const byDay = useMemo(() => {
    const m = new Map<string, CalVisit[]>();
    for (const v of visits) {
      const k = dayKey(v.windowStart);
      const list = m.get(k) ?? [];
      list.push(v);
      m.set(k, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.windowStart.localeCompare(b.windowStart));
    return m;
  }, [visits]);

  const intl = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { ...opts, timeZone: "UTC" });
  const monthTitle = intl({ month: "long", year: "numeric" });
  const dayTitle = intl({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const shortDay = intl({ weekday: "short", day: "numeric", month: "short" });
  const weekdayName = intl({ weekday: "short" });

  const anchor = new Date(anchorMs);
  // KSA week starts Sunday (ENG-09 calendar Sun–Thu) — getUTCDay(): Sunday = 0.
  const weekStartMs = anchorMs - anchor.getUTCDay() * DAY_MS;

  const shift = (dir: -1 | 1) => {
    if (view === "day") setAnchorMs(anchorMs + dir * DAY_MS);
    else if (view === "week") setAnchorMs(anchorMs + dir * 7 * DAY_MS);
    else {
      const d = new Date(anchorMs);
      setAnchorMs(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + dir, 1));
    }
  };

  const heading =
    view === "month" ? monthTitle.format(anchor)
      : view === "week" ? `${shortDay.format(new Date(weekStartMs))} — ${shortDay.format(new Date(weekStartMs + 6 * DAY_MS))}`
        : dayTitle.format(anchor);

  const chip = (v: CalVisit, withTime: boolean) => (
    <a key={v.id} href={`/visits/${v.id}`} className="ax-link"
      style={{
        display: "block", padding: "2px 6px", borderRadius: "var(--ax-radius-small)",
        background: "var(--ax-color-primary-tint)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        font: "var(--ax-text-caption)",
      }}
      title={`${v.factoryName} · ${v.typeLabel} · ${v.planningLabel} · ${v.opsLabel}`}>
      {withTime && <span className="ax-numeric">{timeOf(v.windowStart)} </span>}{v.factoryName}
    </a>
  );

  // ---------- month grid: 6 rows × 7 cols starting the Sunday on/before the 1st ----------
  const monthCells = useMemo(() => {
    const first = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1);
    const gridStart = first - new Date(first).getUTCDay() * DAY_MS;
    return Array.from({ length: 42 }, (_, i) => gridStart + i * DAY_MS);
  }, [anchorMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayKey = keyOf(utcMidnight(new Date()));
  const inMonth = (ms: number) => new Date(ms).getUTCMonth() === anchor.getUTCMonth();

  const weekDays = Array.from({ length: 7 }, (_, i) => weekStartMs + i * DAY_MS);
  const dayVisits = byDay.get(keyOf(anchorMs)) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
        <div className="ax-segmented" role="group" aria-label={strings.viewSwitchAria}>
          {([["day", strings.viewDay], ["week", strings.viewWeek], ["month", strings.viewMonth]] as [ViewKey, string][]).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>{label}</button>
          ))}
        </div>
        <div className="row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
          <button type="button" className="ax-btn ax-btn--subtle" onClick={() => shift(-1)} aria-label={strings.prev}>‹</button>
          <button type="button" className="ax-btn ax-btn--subtle" onClick={() => setAnchorMs(utcMidnight(new Date()))}>{strings.today}</button>
          <button type="button" className="ax-btn ax-btn--subtle" onClick={() => shift(1)} aria-label={strings.next}>›</button>
          <strong style={{ marginInlineStart: "var(--ax-space-150)" }}>{heading}</strong>
        </div>
      </div>

      {view === "month" && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-200)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {weekDays.map(ms => (
              <div key={`h${ms}`} className="ax-overline" style={{ padding: "var(--ax-space-050)", textAlign: "center" }}>{weekdayName.format(new Date(ms))}</div>
            ))}
            {monthCells.map(ms => {
              const k = keyOf(ms);
              const list = byDay.get(k) ?? [];
              const isToday = k === todayKey;
              return (
                <div key={k} style={{
                  minBlockSize: 92, padding: "var(--ax-space-050)", borderRadius: "var(--ax-radius-small)",
                  border: `1px solid ${isToday ? "var(--ax-color-primary)" : "var(--ax-color-border)"}`,
                  background: inMonth(ms) ? "var(--ax-color-surface)" : "var(--ax-color-surface-sunken)",
                  display: "flex", flexDirection: "column", gap: 2, opacity: inMonth(ms) ? 1 : .6,
                }}>
                  <span className="ax-caption ax-numeric" style={{ alignSelf: "flex-end" }}>{new Date(ms).getUTCDate()}</span>
                  {list.slice(0, 3).map(v => chip(v, false))}
                  {list.length > 3 && (
                    <button type="button" className="ax-caption" onClick={() => { setAnchorMs(ms); setView("day"); }}
                      style={{ border: 0, background: "transparent", cursor: "pointer", textAlign: "start", color: "var(--ax-color-text-secondary)", padding: 0 }}>
                      {strings.moreCount.replace("{n}", String(list.length - 3))}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-200)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "var(--ax-space-100)" }}>
            {weekDays.map(ms => {
              const k = keyOf(ms);
              const list = byDay.get(k) ?? [];
              const isToday = k === todayKey;
              return (
                <div key={k} style={{
                  display: "flex", flexDirection: "column", gap: 4, minBlockSize: 180,
                  border: `1px solid ${isToday ? "var(--ax-color-primary)" : "var(--ax-color-border)"}`,
                  borderRadius: "var(--ax-radius-small)", padding: "var(--ax-space-100)",
                }}>
                  <span className="ax-overline" style={{ textAlign: "center" }}>{shortDay.format(new Date(ms))}</span>
                  {list.map(v => chip(v, true))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "day" && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <span className="ax-caption ax-numeric">{strings.visitsOn.replace("{n}", String(dayVisits.length))}</span>
          {dayVisits.length === 0 ? (
            <div className="ax-state ax-state--inline"><p className="ax-caption">{strings.emptyRange}</p></div>
          ) : dayVisits.map(v => (
            <a key={v.id} href={`/visits/${v.id}`} className="ax-surface"
              style={{ padding: "var(--ax-space-200)", display: "flex", gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap", textDecoration: "none", color: "inherit", border: "1px solid var(--ax-color-border)" }}>
              <span className="ax-numeric"><strong>{timeOf(v.windowStart)}</strong> → {timeOf(v.windowEnd)}</span>
              <strong>{v.factoryName}</strong>
              <span className="ax-caption">{v.typeLabel}</span>
              <span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[v.planningStatus] ?? ""}`}>{v.planningLabel}</span>
              <span className="ax-lozenge ax-lozenge--ops">{v.opsLabel}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
