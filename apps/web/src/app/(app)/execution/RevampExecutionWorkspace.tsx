"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type DragEvent } from "react";
import type { GeoMarkerData } from "@/components/GeoMap";
import type { Locale } from "@/lib/i18n";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type ExecutionRow = {
  id: string;
  visitReference: string;
  factoryId: string | null;
  factory: string;
  crNumber: string | null;
  windowStart: string;
  windowEnd: string;
  executionDate: string | null;
  reportType: string | null;
  visitType: string | null;
  visitMode: string | null;
  risk: string | null;
  priority: string | null;
  inspectorId: string | null;
  inspector: string | null;
  region: string | null;
  city: string | null;
  operationalState: string;
  planningStatus: string;
  lat: number | null;
  lng: number | null;
};

type View = "mine" | "all" | "map";
type CalendarMode = "week" | "month";
type FilterKey = "inspector" | "region" | "risk" | "visitMode" | "operationalState" | "priority";

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
};
const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;
const formatShort = (locale: Locale, date: Date) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { weekday: "short", day: "numeric" }).format(date);
const formatDate = (locale: Locale, value: string | null) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const titleCase = (locale: Locale, value: string | null) => {
  if (!value) return "—";
  const ar: Record<string, string> = {
    assigned: "مُسند", preparing: "قيد التحضير", ready: "جاهز للتنفيذ",
    new: "جديد", prepared: "جاهز للتنفيذ", on_the_way: "في الطريق",
    arrived: "وصل", executing: "جارٍ التفتيش", submitted: "مُقدّم",
    under_review: "قيد المراجعة", published: "منشور", returned: "مُعاد",
    cancelled: "ملغى", expired: "منتهي", physical: "ميداني",
    virtual: "افتراضي", self_assessment: "تقييم ذاتي",
    high: "مرتفع", medium: "متوسط", low: "منخفض",
  };
  if (locale === "ar") return ar[value] ?? value.replaceAll("_", " ");
  return value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
};

export default function RevampExecutionWorkspace({ rows, currentUserId, locale, totalVisibleRows }: {
  rows: ExecutionRow[];
  currentUserId: string;
  locale: Locale;
  totalVisibleRows: number;
}) {
  const [view, setView] = useState<View>("mine");
  const [query, setQuery] = useState("");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [reschedule, setReschedule] = useState<{ row: ExecutionRow; date: string } | null>(null);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const calendarDays = useMemo(() => Array.from({ length: calendarMode === "week" ? 7 : 35 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [calendarMode, weekStart]);
  const mine = rows.filter(row => row.inspectorId === currentUserId);
  const sourceRows = view === "mine" ? mine : rows;
  const visibleRows = sourceRows.filter(row => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [row.factory, row.crNumber, row.visitReference].some(value => value?.toLowerCase().includes(needle));
    return matchesQuery
      && (!filters.inspector || row.inspector === filters.inspector)
      && (!filters.region || row.region === filters.region)
      && (!filters.risk || row.risk === filters.risk)
      && (!filters.visitMode || row.visitMode === filters.visitMode)
      && (!filters.operationalState || row.operationalState === filters.operationalState)
      && (!filters.priority || row.priority === filters.priority);
  });
  const markers: GeoMarkerData[] = visibleRows
    .filter(row => row.lat != null && row.lng != null)
    .map(row => ({
      id: row.id,
      lat: row.lat!,
      lng: row.lng!,
      label: row.factory,
      tone: row.risk === "high" ? "high" : row.risk === "medium" ? "medium" : row.risk === "low" ? "low" : "neutral",
    }));
  const calendarRows = view === "mine" ? mine : rows;
  const calendarEnd = calendarDays[calendarDays.length - 1]!;
  const filterOptions: Record<FilterKey, string[]> = {
    inspector: Array.from(new Set(rows.map(row => row.inspector).filter((value): value is string => !!value))).sort(),
    region: Array.from(new Set(rows.map(row => row.region).filter((value): value is string => !!value))).sort(),
    risk: Array.from(new Set(rows.map(row => row.risk).filter((value): value is string => !!value))).sort(),
    visitMode: Array.from(new Set(rows.map(row => row.visitMode).filter((value): value is string => !!value))).sort(),
    operationalState: Array.from(new Set(rows.map(row => row.operationalState).filter(Boolean))).sort(),
    priority: Array.from(new Set(rows.map(row => row.priority).filter((value): value is string => !!value))).sort(),
  };
  const cycleFilter = (key: FilterKey) => {
    const options = filterOptions[key];
    if (!options.length) return;
    const current = filters[key];
    const index = current ? options.indexOf(current) : -1;
    const next = index >= options.length - 1 ? undefined : options[index + 1];
    setFilters(previous => ({ ...previous, [key]: next }));
  };
  const onDropDay = (event: DragEvent<HTMLElement>, date: string) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/visit-id");
    const row = rows.find(candidate => candidate.id === id);
    if (row) setReschedule({ row, date });
  };
  const filterButton = (label: string, key: FilterKey) => (
    <button type="button" aria-pressed={!!filters[key]} onClick={() => cycleFilter(key)}>
      {filters[key] ? `${label}: ${titleCase(locale, filters[key]!)}` : label}
    </button>
  );

  return (
    <div className="sq-execution">
      <h1 className="sq-sr-only">{copy(locale, "Inspection Execution", "تنفيذ التفتيش")}</h1>
      <div className="sq-banner sq-banner--critical" role="status">
        <div>
          <strong>{copy(locale, "Submission service unavailable.", "خدمة التقديم غير متاحة.")}</strong> {copy(locale, "Inspection preparation and execution records remain available, but real submission is blocked by DEC-032. No successful submission is claimed from this destination.", "تظل سجلات التحضير والتنفيذ متاحة، لكن التقديم الفعلي محظور بموجب DEC-032. لا تدّعي هذه الوجهة نجاح أي تقديم.")}
        </div>
      </div>
      {totalVisibleRows > rows.length ? (
        <div className="sq-banner" role="status">
          <div>
            <strong>{copy(locale, "Bounded result set.", "مجموعة نتائج محدودة.")}</strong>{" "}
            {copy(locale, `Showing ${rows.length.toLocaleString("en-GB")} non-fixture rows from a 1,000-row bounded fetch; ${totalVisibleRows.toLocaleString("en-GB")} visits are RLS-visible. Fixtures and records beyond the bound are not claimed visible here.`, `يُعرض ${rows.length.toLocaleString("ar-SA")} صفاً غير تجريبي من قراءة محدودة بألف صف؛ توجد ${totalVisibleRows.toLocaleString("ar-SA")} زيارة ظاهرة وفق سياسات أمان الصفوف. لا يُدّعى عرض السجلات التجريبية أو السجلات التي تتجاوز الحد هنا.`)}
          </div>
        </div>
      ) : null}
      <section className="sq-execution__week">
        <div>
          <strong>{calendarMode === "week" ? copy(locale, "Week", "أسبوع") : copy(locale, "Five-week view", "عرض خمسة أسابيع")} {formatDate(locale, weekStart.toISOString()).replace(/^\d{2} /, "")} – {formatDate(locale, calendarEnd.toISOString())}</strong>
          <span><button type="button" aria-pressed={calendarMode === "week"} onClick={() => setCalendarMode("week")}>{copy(locale, "Week", "أسبوع")}</button><button type="button" aria-pressed={calendarMode === "month"} onClick={() => setCalendarMode("month")}>{copy(locale, "Month", "شهر")}</button></span>
        </div>
        <div className="sq-execution__days">
          {calendarDays.map(day => {
            const key = day.toISOString().slice(0, 10);
            const dayRows = calendarRows.filter(row => (row.executionDate ?? row.windowStart).slice(0, 10) === key);
            return (
              <article key={key} onDragOver={event => event.preventDefault()} onDrop={event => onDropDay(event, key)}>
                <header><span>{formatShort(locale, day)}</span><span>{dayRows.length ? copy(locale, `${dayRows.length} visit${dayRows.length === 1 ? "" : "s"}`, `${dayRows.length} زيارة`) : ""}</span></header>
                {dayRows.slice(0, 4).map(row => <a href={row.inspectorId === currentUserId ? `/field/${row.id}` : `/visits/${row.id}`} key={row.id} data-risk={row.risk ?? ""} draggable onDragStart={event => event.dataTransfer.setData("text/visit-id", row.id)}>{row.factory}</a>)}
              </article>
            );
          })}
        </div>
        <p>{copy(locale, "Dragging a visit onto a day opens the configuration drawer with the planning window enforced — it never silently reschedules.", "يؤدي سحب الزيارة إلى يوم إلى فتح لوحة الإعداد مع فرض نافذة التخطيط، ولا تُعاد الجدولة بصمت.")}</p>
      </section>

      <div className="sq-execution__viewbar">
        <nav aria-label={copy(locale, "Execution view", "عرض التنفيذ")}>
          <button type="button" aria-pressed={view === "mine"} onClick={() => setView("mine")}>{copy(locale, "My inspections", "تفتيشاتي")}</button>
          <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>{copy(locale, "All inspections", "كل التفتيشات")}</button>
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>{copy(locale, "Location context", "سياق الموقع")}</button>
        </nav>
        <span><i />{copy(locale, "Map markers use recorded official factory coordinates—not live inspector tracking.", "تستخدم علامات الخريطة إحداثيات المصنع الرسمية المسجلة، وليست تتبعاً حياً للمفتش.")}</span>
      </div>

      <div className="sq-execution__filters">
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy(locale, "Search factory, CR, licence…", "ابحث باسم المصنع أو السجل أو الترخيص…")} />
        {filterButton(copy(locale, "Inspector", "المفتش"), "inspector")}
        {filterButton(copy(locale, "Region", "المنطقة"), "region")}
        {filterButton(copy(locale, "Risk", "المخاطر"), "risk")}
        {filterButton(copy(locale, "Visit mode", "نمط الزيارة"), "visitMode")}
        {filterButton(copy(locale, "Operational state", "الحالة التشغيلية"), "operationalState")}
        {filterButton(copy(locale, "Priority", "الأولوية"), "priority")}
        {Object.keys(filters).some(key => filters[key as FilterKey]) ? <button type="button" onClick={() => setFilters({})}>{copy(locale, "Clear filters", "مسح عوامل التصفية")}</button> : null}
      </div>

      {view === "map" ? (
        <section className="sq-execution__map">
          {markers.length ? <GeoMap center={[23.8859, 45.0792]} zoom={5} markers={markers} height="100%" ariaLabel={copy(locale, "Official factory location map", "خريطة مواقع المصانع الرسمية")} />
            : <div><strong>{copy(locale, "No governed coordinates in this view", "لا توجد إحداثيات معتمدة في هذا العرض")}</strong><p>{copy(locale, "The table views remain fully usable.", "تظل عروض الجدول متاحة بالكامل.")}</p></div>}
        </section>
      ) : (
        <section className="sq-execution__tablewrap">
          <table>
            <thead><tr>
              <th>{copy(locale, "Visit ref", "مرجع الزيارة")}</th><th>{copy(locale, "Factory", "المصنع")}</th><th>{copy(locale, "Planning window", "نافذة التخطيط")}</th><th>{copy(locale, "Execution date", "تاريخ التنفيذ")}</th><th>{copy(locale, "Visit type", "نوع الزيارة")}</th><th>{copy(locale, "Visit mode", "نمط الزيارة")}</th><th>{copy(locale, "Risk", "المخاطر")}</th>
              {view === "all" && <><th>{copy(locale, "Inspector", "المفتش")}</th><th>{copy(locale, "Region / city", "المنطقة / المدينة")}</th></>}
              <th>{copy(locale, "Operational state", "الحالة التشغيلية")}</th>
              {view === "mine" && <><th>{copy(locale, "Preparation", "التحضير")}</th><th>{copy(locale, "Report type", "نوع التقرير")}</th></>}
              {view === "all" && <th>{copy(locale, "Location data", "بيانات الموقع")}</th>}
              <th>{copy(locale, "Action", "الإجراء")}</th>
            </tr></thead>
            <tbody>{visibleRows.map(row => (
              <tr key={row.id}>
                <th scope="row" data-label={copy(locale, "Visit ref", "مرجع الزيارة")}>{row.visitReference}</th>
                <td data-label={copy(locale, "Factory", "المصنع")}>{row.factory}</td>
                <td data-label={copy(locale, "Planning window", "نافذة التخطيط")}>{formatDate(locale, row.windowStart)} – {formatDate(locale, row.windowEnd)}</td>
                <td data-label={copy(locale, "Execution date", "تاريخ التنفيذ")}>{formatDate(locale, row.executionDate)}</td>
                <td data-label={copy(locale, "Visit type", "نوع الزيارة")}>{titleCase(locale, row.visitType)}</td>
                <td data-label={copy(locale, "Visit mode", "نمط الزيارة")}>{titleCase(locale, row.visitMode)}</td>
                <td data-label={copy(locale, "Risk", "المخاطر")}><span data-tone={row.risk ?? ""}>{titleCase(locale, row.risk)}</span></td>
                {view === "all" && <><td data-label={copy(locale, "Inspector", "المفتش")}>{row.inspector ?? copy(locale, "Unassigned", "غير مسند")}</td><td data-label={copy(locale, "Region / city", "المنطقة / المدينة")}>{[row.region, row.city].filter(Boolean).join(" / ") || "—"}</td></>}
                <td data-label={copy(locale, "Operational state", "الحالة التشغيلية")}><span>{titleCase(locale, row.operationalState)}</span></td>
                {view === "mine" && <><td data-label={copy(locale, "Preparation", "التحضير")}>{titleCase(locale, row.planningStatus)}</td><td data-label={copy(locale, "Report type", "نوع التقرير")}>{row.reportType ?? copy(locale, "Not configured", "غير مهيأ")}</td></>}
                {view === "all" && <td data-label={copy(locale, "Location data", "بيانات الموقع")}>{row.lat != null ? copy(locale, "Official factory coordinates recorded", "إحداثيات المصنع الرسمية مسجلة") : copy(locale, "No official coordinates", "لا توجد إحداثيات رسمية")}</td>}
                <td data-label={copy(locale, "Action", "الإجراء")}><a href={row.inspectorId === currentUserId ? `/field/${row.id}` : `/visits/${row.id}`}>{row.inspectorId === currentUserId ? (row.operationalState === "new" ? copy(locale, "Prepare", "تحضير") : copy(locale, "Open", "فتح")) : copy(locale, "View", "عرض")}</a></td>
              </tr>
            ))}</tbody>
          </table>
          {!visibleRows.length && <p>{copy(locale, "No RLS-visible inspections match this view and filter.", "لا توجد تفتيشات ظاهرة وفق سياسات أمان الصفوف تطابق هذا العرض وعوامل التصفية.")}</p>}
        </section>
      )}
      {reschedule ? (
        <div className="sq-execution__drawer" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
          <button type="button" aria-label={copy(locale, "Close configuration drawer", "إغلاق لوحة الإعداد")} onClick={() => setReschedule(null)}>×</button>
          <p className="sq-overline">{copy(locale, "Planning window guard", "حماية نافذة التخطيط")}</p>
          <h2 id="reschedule-title">{copy(locale, "Configure", "إعداد")} {reschedule.row.visitReference}</h2>
          <p><strong>{reschedule.row.factory}</strong> {copy(locale, `was dropped on ${formatDate(locale, reschedule.date)}. No date has been changed.`, `تم إسقاطها على ${formatDate(locale, reschedule.date)}. لم يتم تغيير أي تاريخ.`)}</p>
          <div className="sq-banner"><strong>{copy(locale, "Current governed window:", "النافذة المعتمدة الحالية:")}</strong> {formatDate(locale, reschedule.row.windowStart)} – {formatDate(locale, reschedule.row.windowEnd)}. {copy(locale, "The planning workflow validates conflicts and records the change.", "يتحقق مسار التخطيط من التعارضات ويسجل التغيير.")}</div>
          <a className="sq-btn" href={`/planning/visits/${reschedule.row.id}?proposedDate=${encodeURIComponent(reschedule.date)}`}>{copy(locale, "Continue in Planning", "المتابعة في التخطيط")}</a>
          <button className="sq-btn sq-btn--secondary" type="button" onClick={() => setReschedule(null)}>{copy(locale, "Cancel", "إلغاء")}</button>
        </div>
      ) : null}
    </div>
  );
}
