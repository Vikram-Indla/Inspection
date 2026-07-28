"use client";

import { useState } from "react";
import OperationsMapWorkspace, {
  type OperationsMapEntry,
  type OperationsMapWorkspaceStrings,
} from "./OperationsMapWorkspace";

type Locale = "en" | "ar";
type Highlight = {
  id: string;
  label: string;
  description: string;
  at: number;
  href: string;
  evidenceUrl: string | null;
};
type RegionSummary = {
  name: string;
  factories: number;
  active: number;
  href: string;
};

const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;

export default function RevampOperationsCenter({
  locale,
  view,
  mapViewHref,
  performanceViewHref,
  mapEntries,
  regionalMapEntries,
  mapStrings,
  counts,
  monitoredCount,
  highlights,
  regions,
}: {
  locale: Locale;
  view: "map" | "performance";
  mapViewHref: string;
  performanceViewHref: string;
  mapEntries: OperationsMapEntry[];
  regionalMapEntries: OperationsMapEntry[];
  mapStrings: OperationsMapWorkspaceStrings;
  counts: Record<string, number>;
  monitoredCount: number;
  highlights: Highlight[];
  regions: RegionSummary[];
}) {
  const [showList, setShowList] = useState(false);
  const activeMapEntries = view === "performance" ? regionalMapEntries : mapEntries;
  const onTheWayInspectors = new Set(
    mapEntries
      .filter(entry => entry.state === "on_the_way" || entry.state.toLowerCase().includes("way"))
      .map(entry => entry.inspectorName)
      .filter(Boolean),
  ).size;
  const summary = [
    [copy(locale, "Active visits", "الزيارات النشطة"), String(monitoredCount), "/execution", copy(locale, "Open Execution", "فتح التنفيذ")],
    [copy(locale, "Inspectors on the way", "المفتشون في الطريق"), String(onTheWayInspectors || counts.on_the_way || 0), mapViewHref, copy(locale, "Show on map", "إظهار على الخريطة")],
    [copy(locale, "Executing inspections", "التفتيشات قيد التنفيذ"), String(counts.executing || 0), "/execution", copy(locale, "Open Execution", "فتح التنفيذ")],
    [copy(locale, "Submitted today", "المقدمة اليوم"), "—", "/reviews", copy(locale, "Open Review & Approval", "فتح المراجعة والاعتماد")],
    [copy(locale, "Active operational alerts", "التنبيهات التشغيلية النشطة"), "—", performanceViewHref, copy(locale, "Review exceptions", "مراجعة الاستثناءات")],
  ];

  return (
    <div className="stack">
      <div className="grid-toolbar">
        <nav className="seg" aria-label={copy(locale, "Operations perspective", "منظور العمليات")}>
          <a className="seg-opt" href={mapViewHref} aria-current={view === "map" ? "page" : undefined} aria-pressed={view === "map"}>
            {copy(locale, "Operations map", "خريطة العمليات")}
          </a>
          <a className="seg-opt" href={performanceViewHref} aria-current={view === "performance" ? "page" : undefined} aria-pressed={view === "performance"}>
            {copy(locale, "National performance", "الأداء الوطني")}
          </a>
        </nav>
        <div className="row">
          {/* CR-431 · WA-M3-AC-001 — preserve the accepted command-bar
              composition while making its live-status affordance complete the
              real Operations Center → Operations Live route flow. */}
          <a className="tl-meta" href="/operations/live">
            {copy(locale, "Live governed positions", "مواقع معتمدة مباشرة")}
          </a>
          <button className="btn btn-secondary" type="button" onClick={() => setShowList(value => !value)}>
            {showList ? copy(locale, "Show map", "إظهار الخريطة") : copy(locale, "Show list equivalent", "إظهار القائمة المكافئة")}
          </button>
        </div>
      </div>

      {showList ? (
          <section className="table-wrap">
            <table className="table">
              <caption>{copy(locale, "Accessible equivalent of the live map. Same records, same actions, no map dependency.", "المكافئ القابل للوصول للخريطة المباشرة. السجلات والإجراءات نفسها دون الاعتماد على الخريطة.")}</caption>
              <thead><tr>
                <th>{copy(locale, "Inspector", "المفتش")}</th>
                <th>{copy(locale, "Operational state", "الحالة التشغيلية")}</th>
                <th>{copy(locale, "Visit", "الزيارة")}</th>
                <th>{copy(locale, "Factory", "المصنع")}</th>
                <th>{copy(locale, "Region / city", "المنطقة / المدينة")}</th>
                <th>{copy(locale, "Risk", "المخاطر")}</th>
                <th>{copy(locale, "Last update", "آخر تحديث")}</th>
                <th>{copy(locale, "Actions", "الإجراءات")}</th>
              </tr></thead>
              <tbody>{activeMapEntries.map(entry => (
                <tr key={entry.id}>
                  <th scope="row" data-label={copy(locale, "Inspector", "المفتش")}>{entry.inspectorName ?? "—"}</th>
                  <td data-label={copy(locale, "Operational state", "الحالة التشغيلية")}><span className="badge badge-info">{entry.state}</span></td>
                  <td data-label={copy(locale, "Visit", "الزيارة")}>{entry.visitId?.slice(0, 8) ?? "—"}</td>
                  <td data-label={copy(locale, "Factory", "المصنع")}>{entry.factoryName}</td>
                  <td data-label={copy(locale, "Region / city", "المنطقة / المدينة")}>{[entry.region, entry.city].filter(Boolean).join(" / ") || "—"}</td>
                  <td data-label={copy(locale, "Risk", "المخاطر")}><span className="badge badge-pending">{entry.riskScore ?? copy(locale, "Not configured", "غير مهيأ")}</span></td>
                  <td data-label={copy(locale, "Last update", "آخر تحديث")}>{entry.lastGeoAt ?? "—"}</td>
                  <td data-label={copy(locale, "Actions", "الإجراءات")}><a className="btn btn-secondary" href={entry.href}>{copy(locale, "Open record", "فتح السجل")}</a></td>
                </tr>
              ))}</tbody>
            </table>
          </section>
      ) : (
          <section className="map-panel">
            <nav className="breadcrumb" aria-label={copy(locale, "Map drill", "التنقل في الخريطة")}><ul className="breadcrumb"><li>{copy(locale, "Saudi Arabia", "المملكة العربية السعودية")}</li></ul></nav>
            <OperationsMapWorkspace entries={activeMapEntries} strings={mapStrings} mapOnly />
          </section>
      )}

      {view === "performance" ? (
        <section className="stack">
          <div className="panel-row">
            <h2>{copy(locale, "National performance by region", "الأداء الوطني حسب المنطقة")}</h2>
            <p>{copy(locale, "Selecting a region drills to its factories and active visits.", "يؤدي تحديد المنطقة إلى مصانعها وزياراتها النشطة.")}</p>
          </div>
          <div className="kpi-grid">
            {regions.map(region => (
              <a className="panel kpi" href={region.href} key={region.name}>
                <span><strong>{region.name}</strong><b>—</b></span>
                <span className="badge badge-pending">{copy(locale, "Compliance unavailable", "الامتثال غير متاح")}</span>
                <span className="tl-meta">{region.factories} {copy(locale, "factories", "مصانع")} · {region.active} {copy(locale, "active visits", "زيارات نشطة")}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="tl-meta">{copy(locale, "Operational summary", "الملخص التشغيلي")}</h2>
        <div className="kpi-grid">
          {summary.map(([label, value, href, action]) => (
            <article className="panel kpi" key={label}>
              <span>{label}</span>
              <strong className="sq-kpi__value">{value}</strong>
              <a className="btn btn-ghost" href={href}>{action}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div className="panel-row">
          <h2>{copy(locale, "Live operational exceptions", "الاستثناءات التشغيلية المباشرة")}</h2>
          <span className="tl-meta">{copy(locale, "Current RLS-scoped records", "السجلات الحالية المقيّدة بالصلاحيات")}</span>
        </div>
        {highlights.length ? highlights.slice(0, 8).map(item => (
          <article className="panel-row" key={item.id}>
            <span className="badge badge-warning">{copy(locale, "Open", "مفتوح")}</span>
            <div className="grow">
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
            <a className="btn btn-secondary" href={item.href}>{copy(locale, "Open record", "فتح السجل")}</a>
          </article>
        )) : <section className="saqeel-state"><div className="saqeel-state__content"><h2>{copy(locale, "No open operational exceptions", "لا توجد استثناءات تشغيلية مفتوحة")}</h2><p>{copy(locale, "No open operational exceptions in this scope.", "لا توجد استثناءات تشغيلية مفتوحة ضمن هذا النطاق.")}</p></div></section>}
      </section>
    </div>
  );
}
