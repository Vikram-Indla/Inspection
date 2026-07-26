"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FieldVisit } from "../VisitsClient";
import styles from "../visits.module.css";

type View = "day" | "week" | "month";
const DAY = 86_400_000;
const midnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const key = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export default function FieldCalendarBoard({ visits, locale, s }: { visits: FieldVisit[]; locale: "en" | "ar"; s: Record<string, string> }) {
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => midnight(new Date()));
  const byDay = useMemo(() => {
    const map = new Map<string, FieldVisit[]>();
    for (const visit of visits) {
      const list = map.get(visit.windowStart.slice(0, 10)) ?? [];
      list.push(visit); map.set(visit.windowStart.slice(0, 10), list);
    }
    for (const list of map.values()) list.sort((a, b) => a.windowStart.localeCompare(b.windowStart));
    return map;
  }, [visits]);
  const date = new Date(anchor), weekStart = anchor - date.getUTCDay() * DAY;
  const week = Array.from({ length: 7 }, (_, i) => weekStart + i * DAY);
  const first = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const gridStart = first - new Date(first).getUTCDay() * DAY;
  const month = Array.from({ length: 42 }, (_, i) => gridStart + i * DAY);
  const intl = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-SA", { ...o, timeZone: "UTC" });
  const shift = (n: number) => view === "day" ? setAnchor(anchor + n * DAY) : view === "week" ? setAnchor(anchor + n * 7 * DAY) : setAnchor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
  const heading = view === "month" ? intl({ month: "long", year: "numeric" }).format(date) : view === "week" ? `${intl({ day: "numeric", month: "short" }).format(new Date(week[0]))} — ${intl({ day: "numeric", month: "short" }).format(new Date(week[6]))}` : intl({ weekday: "long", day: "numeric", month: "long" }).format(date);
  const card = (v: FieldVisit, time = true) => <Link key={v.id} href={`/field/${v.id}`} className="sq-link" style={{ display: "block", minHeight: 44, padding: "10px 8px", borderRadius: "var(--radius-xs)", background: "var(--accent-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{time && <span className="id-code">{v.windowStart.slice(11,16)} </span>}<bdi>{v.factory.name || "—"}</bdi></Link>;
  const cells = view === "month" ? month : week;
  return <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
    <div className={styles.segments} role="group" aria-label={s.calendarView}>{(["day","week","month"] as View[]).map(v => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{s[v]}</button>)}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><button className="btn btn-ghost btn-touch" onClick={() => shift(-1)} aria-label={s.prev}>‹</button><button className="btn btn-ghost btn-touch" onClick={() => setAnchor(midnight(new Date()))}>{s.today}</button><button className="btn btn-ghost btn-touch" onClick={() => shift(1)} aria-label={s.next}>›</button><strong>{heading}</strong></div>
    {view === "day" ? <div className="panel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>{(byDay.get(key(anchor)) ?? []).length ? (byDay.get(key(anchor)) ?? []).map(v => card(v)) : <div role="status" className={styles.state}>{s.empty}</div>}</div> :
      <div className={`${styles.calendarGrid} panel`}><div className={styles.calendarInner} style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {week.map(ms => <div className="t-caption" style={{ textAlign: "center" }} key={`h${ms}`}>{intl({ weekday: "short" }).format(new Date(ms))}</div>)}
        {cells.map(ms => { const list = byDay.get(key(ms)) ?? []; return <div key={ms} style={{ minHeight: view === "month" ? 104 : 210, padding: 5, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", display: "flex", flexDirection: "column", gap: 3 }}><span className="t-caption id-code">{new Date(ms).getUTCDate()}</span>{list.slice(0, view === "month" ? 3 : list.length).map(v => card(v, view !== "month"))}{view === "month" && list.length > 3 && <button className="btn btn-ghost" style={{ minHeight: 44 }} onClick={() => { setAnchor(ms); setView("day"); }}>{s.more.replace("{n}", String(list.length - 3))}</button>}</div>; })}
      </div></div>}
  </div>;
}
