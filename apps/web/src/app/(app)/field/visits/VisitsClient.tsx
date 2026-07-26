"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  isVisitPriority, visitSegment, visitSegmentCounts, type AssignmentTask,
  type VisitPriority, type VisitSegment,
} from "../my-tasks/assignment-task-model";
import styles from "./visits.module.css";

export type FieldVisit = AssignmentTask & {
  // The design's `VS-40219` is the establishment-facing visit number, not the row
  // uuid. It comes from visits.visit_reference; when a row has none we render the
  // em dash rather than exposing an internal id as if it were a visit number.
  visitReference: string | null;
  factory: AssignmentTask["factory"] & {
    crNumber: string | null; licenseNumber: string | null;
    officialLat: number | null; officialLng: number | null;
  };
};
export type VisitStrings = Record<string, string>;
type Position = { lat: number; lng: number } | null;

const riskColor = (p: VisitPriority) => p === "high" ? "var(--status-critical)" : p === "medium" ? "var(--status-warning)" : "var(--status-compliant-text)";
const radians = (n: number) => n * Math.PI / 180;
function distanceKm(a: Position, b: { officialLat: number | null; officialLng: number | null }) {
  if (!a || b.officialLat == null || b.officialLng == null) return null;
  const dLat = radians(b.officialLat - a.lat), dLng = radians(b.officialLng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.officialLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function VisitsClient({ visits, locale, now, strings }: { visits: FieldVisit[]; locale: "en" | "ar"; now: number; strings: VisitStrings }) {
  const [segment, setSegment] = useState<VisitSegment>("today");
  const [risk, setRisk] = useState<VisitPriority | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(25);
  const [position, setPosition] = useState<Position>(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => setPosition(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }, []);
  const counts = visitSegmentCounts(visits, now);
  const segmentVisits = useMemo(() => visits.filter(v => visitSegment(v, now) === segment), [visits, now, segment]);
  const riskCounts = { all: segmentVisits.length, high: 0, medium: 0, low: 0 };
  for (const v of segmentVisits) if (isVisitPriority(v.priority)) riskCounts[v.priority]++;
  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return segmentVisits.filter(v => risk === "all" || v.priority === risk).filter(v => !needle || [
      v.visitReference, v.factory.name, v.factory.code, v.factory.crNumber, v.factory.licenseNumber,
    ].some(x => x?.toLocaleLowerCase(locale).includes(needle))).sort((a, b) => sort === "asc" ? a.windowStart.localeCompare(b.windowStart) : b.windowStart.localeCompare(a.windowStart));
  }, [segmentVisits, risk, query, locale, sort]);
  useEffect(() => setVisibleCount(25), [segment, risk, query, sort]);
  const fmtTime = (iso: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-SA", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(new Date(iso));
  const label = (v: string | null) => v ? (strings[`enum.${v}`] ?? v.replaceAll("_", " ")) : "—";
  const cta = (v: FieldVisit): { label: string; href?: string } => {
    if (v.operationalState === "on_the_way") return { label: strings.directions, href: `/field/${v.id}/travel` };
    if ((v.operationalState === "arrived" || v.operationalState === "executing") && v.inspectionId) return { label: strings.continue, href: `/field/inspection/${v.inspectionId}` };
    if (v.operationalState === "submitted" && v.inspectionId) return { label: strings.results, href: `/field/inspection/${v.inspectionId}/statement` };
    if (v.operationalState === "new" || v.operationalState === "prepared") return { label: strings.start, href: `/field/${v.id}` };
    return { label: strings.view };
  };
  return <main className={styles.page}>
    <nav className={styles.views} aria-label={strings.viewsAria}>
      <Link href="/field/visits" aria-current="page">{strings.list}</Link><Link href="/field/visits/calendar">{strings.calendar}</Link><Link href="/field/map">{strings.map}</Link>
    </nav>
    <div className={styles.segments} role="group" aria-label={strings.segmentsAria}>
      {(["today", "upcoming", "completed"] as VisitSegment[]).map(k => <button key={k} aria-pressed={segment === k} onClick={() => setSegment(k)}>{strings[k]} · {counts[k]}</button>)}
    </div>
    <div className={styles.controlRow}>
      <label className={styles.search}><span className="sr-only">{strings.search}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input className="input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={strings.search}/></label>
      <select className={styles.sort} value={sort} onChange={e => setSort(e.target.value as "asc" | "desc")} aria-label={strings.sort}><option value="asc">{strings.soonest}</option><option value="desc">{strings.latest}</option></select>
    </div>
    <div className={styles.chips}>
      {(["all", "high", "medium", "low"] as const).map(k => <button className={styles.chip} key={k} aria-pressed={risk === k} onClick={() => setRisk(k)}>{k !== "all" && <span className={styles.dot} style={{ "--risk-color": riskColor(k) } as React.CSSProperties}/>} {strings[k]} · {riskCounts[k]}</button>)}
    </div>
    {shown.length === 0 ? <div className={styles.state} role="status"><strong>{strings.empty}</strong><p className="t-caption">{strings.emptyBody}</p></div> :
      <div className={styles.cards}>{shown.slice(0, visibleCount).map(v => {
        const p = isVisitPriority(v.priority) ? v.priority : null, action = cta(v), km = distanceKm(position, v.factory);
        return <article className={styles.card} key={v.id} style={p ? { "--risk-color": riskColor(p) } as React.CSSProperties : undefined}>
          <div className={styles.row1}><span className="id-code t-caption">{fmtTime(v.windowStart)}</span><span className={styles.factory}><bdi>{v.factory.name || "—"}</bdi></span>{p && <span className={`badge ${p === "high" ? "badge-critical" : p === "medium" ? "badge-warning" : "badge-compliant"}`}>{strings[p]}</span>}</div>
          <div className={`t-caption ${styles.caption}`}><span className="id-code">{v.visitReference ?? "—"}</span> · {label(v.visitType)} · {km == null ? "—" : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km)} ${strings.km}`}</div>
          <div className={styles.row3}><span className="badge">{label(v.planningStatus)}</span><span aria-hidden="true">›</span><span className="badge">{label(v.operationalState)}</span><span className="grow"/>{action.href ? <Link className={styles.cta} href={action.href}>{action.label}<span aria-hidden="true">›</span></Link> : <span className={styles.cta}>{action.label}</span>}</div>
        </article>;
      })}{shown.length > visibleCount && <button type="button" className="btn btn-secondary btn-touch" onClick={() => setVisibleCount(n => n + 25)}>{strings.loadMore}</button>}</div>}
    <div className={`t-caption ${styles.footnote}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>{strings.twoStates}</div>
  </main>;
}
