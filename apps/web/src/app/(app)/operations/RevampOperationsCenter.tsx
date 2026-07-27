"use client";

import { useState } from "react";
import OperationsMapWorkspace, {
  type OperationsMapEntry,
  type OperationsMapWorkspaceStrings,
} from "./OperationsMapWorkspace";
import styles from "./operations.module.css";

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
  mapStrings: OperationsMapWorkspaceStrings;
  counts: Record<string, number>;
  monitoredCount: number;
  highlights: Highlight[];
  regions: RegionSummary[];
}) {
  const [showList, setShowList] = useState(false);
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
    <div className={styles.revampPage}>
      <div className={styles.revampCommand}>
        <nav className={styles.viewSwitch} aria-label={copy(locale, "Operations perspective", "منظور العمليات")}>
          <a className={`${styles.viewLink} ${view === "map" ? styles.viewLinkActive : ""}`} href={mapViewHref} aria-current={view === "map" ? "page" : undefined}>
            {copy(locale, "Operations map", "خريطة العمليات")}
          </a>
          <a className={`${styles.viewLink} ${view === "performance" ? styles.viewLinkActive : ""}`} href={performanceViewHref} aria-current={view === "performance" ? "page" : undefined}>
            {copy(locale, "National performance", "الأداء الوطني")}
          </a>
        </nav>
        <div className={styles.revampFreshness}>
          <span><i aria-hidden="true" />{copy(locale, "Live governed positions", "مواقع معتمدة مباشرة")}</span>
          {view === "map" && (
            <button className={styles.revampSecondary} type="button" onClick={() => setShowList(value => !value)}>
              {showList ? copy(locale, "Show map", "إظهار الخريطة") : copy(locale, "Show list equivalent", "إظهار القائمة المكافئة")}
            </button>
          )}
        </div>
      </div>

      {view === "map" ? (
        showList ? (
          <section className={styles.revampTableWrap}>
            <table className={styles.revampTable}>
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
              <tbody>{mapEntries.map(entry => (
                <tr key={entry.id}>
                  <th scope="row">{entry.inspectorName ?? "—"}</th>
                  <td><span className={styles.revampLozenge}>{entry.state}</span></td>
                  <td>{entry.visitId?.slice(0, 8) ?? "—"}</td>
                  <td>{entry.factoryName}</td>
                  <td>{[entry.region, entry.city].filter(Boolean).join(" / ") || "—"}</td>
                  <td>{entry.riskScore ?? "—"}</td>
                  <td>{entry.lastGeoAt ?? "—"}</td>
                  <td><a className={styles.revampSecondary} href={entry.href}>{copy(locale, "Open record", "فتح السجل")}</a></td>
                </tr>
              ))}</tbody>
            </table>
          </section>
        ) : (
          <section className={styles.revampMap}>
            <div className={styles.revampMapCrumb}>{copy(locale, "Saudi Arabia", "المملكة العربية السعودية")}</div>
            <OperationsMapWorkspace entries={mapEntries} strings={mapStrings} mapOnly />
          </section>
        )
      ) : (
        <section className={styles.revampRegions}>
          <div className={styles.revampSectionHead}>
            <h2>{copy(locale, "National performance by region", "الأداء الوطني حسب المنطقة")}</h2>
            <p>{copy(locale, "Selecting a region drills to its factories and active visits.", "يؤدي تحديد المنطقة إلى مصانعها وزياراتها النشطة.")}</p>
          </div>
          <div className={styles.revampRegionGrid}>
            {regions.map(region => (
              <a className={styles.revampRegionCard} href={region.href} key={region.name}>
                <span><strong>{region.name}</strong><b>—</b></span>
                <em>{copy(locale, "Compliance unavailable", "الامتثال غير متاح")}</em>
                <i><span style={{ inlineSize: `${Math.min(100, Math.max(3, region.active))}%` }} /></i>
                <small>{region.factories} {copy(locale, "factories", "مصانع")} · {region.active} {copy(locale, "active visits", "زيارات نشطة")}</small>
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className={styles.revampOverline}>{copy(locale, "Operational summary", "الملخص التشغيلي")}</h2>
        <div className={styles.revampKpiRow}>
          {summary.map(([label, value, href, action]) => (
            <article className={styles.revampKpi} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <a href={href}>{action}</a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.revampExceptions}>
        <div className={styles.revampSectionHead}>
          <h2>{copy(locale, "Live operational exceptions", "الاستثناءات التشغيلية المباشرة")}</h2>
          <span>{copy(locale, "Current RLS-scoped records", "السجلات الحالية المقيّدة بالصلاحيات")}</span>
        </div>
        {highlights.length ? highlights.slice(0, 8).map(item => (
          <article key={item.id}>
            <em>{copy(locale, "Open", "مفتوح")}</em>
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
            <a className={styles.revampSecondary} href={item.href}>{copy(locale, "Open record", "فتح السجل")}</a>
          </article>
        )) : <p className={styles.revampEmpty}>{copy(locale, "No open operational exceptions in this scope.", "لا توجد استثناءات تشغيلية مفتوحة ضمن هذا النطاق.")}</p>}
      </section>
    </div>
  );
}
