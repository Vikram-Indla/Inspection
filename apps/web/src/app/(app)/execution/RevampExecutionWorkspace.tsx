"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type RefObject } from "react";
import type { GeoMarkerData } from "@/components/GeoMap";
import type { Locale } from "@/lib/i18n";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type ExecutionRow = {
  id: string;
  visitReference: string;
  factoryId: string | null;
  factory: string;
  factoryCode: string | null;
  crNumber: string | null;
  windowStart: string;
  windowEnd: string;
  executionDate: string | null;
  reportType: string | null;
  packageCode: string | null;
  packageVersion: string | null;
  visitType: string | null;
  visitMode: string | null;
  risk: string | null;
  priority: string | null;
  inspectorId: string | null;
  inspector: string | null;
  assignmentMethod: string | null;
  assignmentStatus: string | null;
  region: string | null;
  city: string | null;
  operationalState: string;
  planningStatus: string;
  lat: number | null;
  lng: number | null;
  journeyStatus: string | null;
  journeyStartedAt: string | null;
  journeyEndedAt: string | null;
};

type View = "mine" | "all" | "map";
type CalendarMode = "week" | "month";
type FilterKey = "inspector" | "region" | "risk" | "visitMode" | "operationalState";

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
const formatDateTime = (locale: Locale, value: string | null) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
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

const useDialogFocus = (
  open: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
  initialFocusRef: RefObject<HTMLButtonElement | null>,
  close: () => void,
) => {
  useEffect(() => {
    if (!open) return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    initialFocusRef.current?.focus();
    const governKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", governKeyboard);
    return () => {
      document.removeEventListener("keydown", governKeyboard);
      origin?.focus();
    };
  }, [close, dialogRef, initialFocusRef, open]);
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
  const [selected, setSelected] = useState<ExecutionRow | null>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  const rescheduleDialogRef = useRef<HTMLDivElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const rescheduleCloseRef = useRef<HTMLButtonElement>(null);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const closeSelected = useCallback(() => setSelected(null), []);
  const closeReschedule = useCallback(() => setReschedule(null), []);
  useDialogFocus(!!selected, detailDialogRef, detailCloseRef, closeSelected);
  useDialogFocus(!!reschedule, rescheduleDialogRef, rescheduleCloseRef, closeReschedule);
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
      && (!filters.operationalState || row.operationalState === filters.operationalState);
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
  const calendarRows = visibleRows;
  const calendarEnd = calendarDays[calendarDays.length - 1]!;
  const hasActiveFilters = !!query.trim() || Object.values(filters).some(Boolean);
  const missingCoordinateCount = visibleRows.filter(row => row.lat == null || row.lng == null).length;
  const filterOptions: Record<FilterKey, string[]> = {
    inspector: Array.from(new Set(sourceRows.map(row => row.inspector).filter((value): value is string => !!value))).sort(),
    region: Array.from(new Set(sourceRows.map(row => row.region).filter((value): value is string => !!value))).sort(),
    risk: Array.from(new Set(sourceRows.map(row => row.risk).filter((value): value is string => !!value))).sort(),
    visitMode: Array.from(new Set(sourceRows.map(row => row.visitMode).filter((value): value is string => !!value))).sort(),
    operationalState: Array.from(new Set(sourceRows.map(row => row.operationalState).filter(Boolean))).sort(),
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
      <div className="sq-banner" role="status">
        <div>
          <strong>{copy(locale, "Live tracking is not available in this Web view.", "التتبع المباشر غير متاح في عرض الويب هذا.")}</strong>{" "}
          {copy(locale, "DEC-002 remains the authority boundary for telemetry frequency, accuracy, and geofence policy. The map uses recorded official factory coordinates only.", "يظل القرار DEC-002 هو الحد المرجعي لتواتر القياس ودقته وسياسة النطاق الجغرافي. تستخدم الخريطة إحداثيات المصنع الرسمية المسجلة فقط.")}
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
                {dayRows.slice(0, 4).map(row => <a href={row.inspectorId === currentUserId ? `/field/${row.id}` : `/visits/${row.id}`} onClick={event => { event.preventDefault(); setSelected(row); }} key={row.id} data-risk={row.risk ?? ""} draggable onDragStart={event => event.dataTransfer.setData("text/visit-id", row.id)}>{row.factory}</a>)}
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
        <input type="search" aria-label={copy(locale, "Search execution visits", "البحث في زيارات التنفيذ")} value={query} onChange={event => setQuery(event.target.value)} placeholder={copy(locale, "Search factory, CR, or visit reference…", "ابحث باسم المصنع أو السجل أو مرجع الزيارة…")} />
        {filterButton(copy(locale, "Inspector", "المفتش"), "inspector")}
        {filterButton(copy(locale, "Region", "المنطقة"), "region")}
        {filterButton(copy(locale, "Risk", "المخاطر"), "risk")}
        {filterButton(copy(locale, "Visit mode", "نمط الزيارة"), "visitMode")}
        {filterButton(copy(locale, "Operational state", "الحالة التشغيلية"), "operationalState")}
        {hasActiveFilters ? <button type="button" onClick={() => { setFilters({}); setQuery(""); }}>{copy(locale, "Clear filters", "مسح عوامل التصفية")}</button> : null}
      </div>
      {missingCoordinateCount ? (
        <div className="sq-banner" role="status">
          <div>
            <strong>{copy(locale, "Location coverage is partial.", "تغطية بيانات الموقع جزئية.")}</strong>{" "}
            {copy(locale, `${missingCoordinateCount.toLocaleString("en-GB")} visit${missingCoordinateCount === 1 ? "" : "s"} in this scope do not have governed official coordinates and are omitted from the map.`, `لا تحتوي ${missingCoordinateCount.toLocaleString("ar-SA")} زيارة في هذا النطاق على إحداثيات رسمية معتمدة، ولذلك لا تظهر على الخريطة.`)}
          </div>
        </div>
      ) : null}

      {view === "map" ? (
        <section className="sq-execution__map">
          {markers.length ? <GeoMap
            center={[23.8859, 45.0792]}
            zoom={5}
            markers={markers}
            selectedId={selected?.id}
            onMarkerClick={id => {
              const row = visibleRows.find(candidate => candidate.id === id);
              if (row) setSelected(row);
            }}
            fitMarkers
            height="100%"
            ariaLabel={copy(locale, "Official factory location map; select a marker to open governed visit details", "خريطة مواقع المصانع الرسمية؛ اختر علامة لفتح تفاصيل الزيارة المعتمدة")}
          />
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
                <td data-label={copy(locale, "Action", "الإجراء")}><a href={row.inspectorId === currentUserId ? `/field/${row.id}` : `/visits/${row.id}`} onClick={event => { event.preventDefault(); setSelected(row); }}>{copy(locale, "View", "عرض")}</a></td>
              </tr>
            ))}</tbody>
          </table>
          {!visibleRows.length && <p>{hasActiveFilters
            ? copy(locale, "No RLS-visible inspections match the current search and filters. Clear the filters to restore this view.", "لا توجد تفتيشات ظاهرة وفق سياسات أمان الصفوف تطابق البحث وعوامل التصفية الحالية. امسح عوامل التصفية لاستعادة العرض.")
            : copy(locale, "No inspections are available in this RLS-scoped view.", "لا توجد تفتيشات متاحة في هذا العرض المقيّد بسياسات أمان الصفوف.")}</p>}
        </section>
      )}
      {selected ? (
        <div ref={detailDialogRef} className="sq-execution__drawer" role="dialog" aria-modal="true" aria-labelledby="execution-detail-title">
          <button ref={detailCloseRef} type="button" aria-label={copy(locale, "Close visit details", "إغلاق تفاصيل الزيارة")} onClick={() => setSelected(null)}>×</button>
          <p className="sq-overline">{copy(locale, "Execution visit", "زيارة التنفيذ")}</p>
          <h2 id="execution-detail-title">{selected.factory}</h2>
          <p>{selected.visitReference} · <span>{titleCase(locale, selected.operationalState)}</span></p>
          <div className="sq-banner" role="status">
            <strong>{copy(locale, "Governed planning window:", "نافذة التخطيط المعتمدة:")}</strong>{" "}
            {formatDate(locale, selected.windowStart)} – {formatDate(locale, selected.windowEnd)}.{" "}
            {copy(locale, "Date or assignment changes continue through the state-guarded visit workflow.", "تستمر تغييرات التاريخ أو الإسناد عبر مسار الزيارة المحمي بالحالة.")}
          </div>
          <dl>
            <div><dt>{copy(locale, "Planning window", "نافذة التخطيط")}</dt><dd>{formatDate(locale, selected.windowStart)} – {formatDate(locale, selected.windowEnd)}</dd></div>
            <div><dt>{copy(locale, "Execution date", "تاريخ التنفيذ")}</dt><dd>{formatDate(locale, selected.executionDate)}</dd></div>
            <div><dt>{copy(locale, "Visit type / mode", "نوع الزيارة / نمطها")}</dt><dd>{titleCase(locale, selected.visitType)} · {titleCase(locale, selected.visitMode)}</dd></div>
            <div><dt>{copy(locale, "Assigned inspector", "المفتش المسند")}</dt><dd>{selected.inspector ?? copy(locale, "Unassigned", "غير مسند")}</dd></div>
            <div><dt>{copy(locale, "Assignment state / method", "حالة الإسناد / طريقته")}</dt><dd>{titleCase(locale, selected.assignmentStatus)} · {titleCase(locale, selected.assignmentMethod)}</dd></div>
            <div><dt>{copy(locale, "Region / city", "المنطقة / المدينة")}</dt><dd>{[selected.region, selected.city].filter(Boolean).join(" / ") || "—"}</dd></div>
            <div><dt>{copy(locale, "Risk / priority", "المخاطر / الأولوية")}</dt><dd>{titleCase(locale, selected.risk)} · {titleCase(locale, selected.priority)}</dd></div>
            <div><dt>{copy(locale, "Preparation", "التحضير")}</dt><dd>{titleCase(locale, selected.planningStatus)}</dd></div>
            <div><dt>{copy(locale, "Report package", "حزمة التقرير")}</dt><dd>{[selected.packageCode, selected.reportType, selected.packageVersion].filter(Boolean).join(" · ") || copy(locale, "Not configured", "غير مهيأ")}</dd></div>
            <div><dt>{copy(locale, "Location data", "بيانات الموقع")}</dt><dd>{selected.lat != null && selected.lng != null ? copy(locale, "Official factory coordinates recorded", "إحداثيات المصنع الرسمية مسجلة") : copy(locale, "No governed official coordinates", "لا توجد إحداثيات رسمية معتمدة")}</dd></div>
            <div><dt>{copy(locale, "Journey / tracking record", "سجل الرحلة / التتبع")}</dt><dd>{selected.journeyStatus
              ? `${titleCase(locale, selected.journeyStatus)} · ${formatDateTime(locale, selected.journeyStartedAt)}${selected.journeyEndedAt ? ` – ${formatDateTime(locale, selected.journeyEndedAt)}` : ""}`
              : copy(locale, "No journey session recorded. Live tracking remains unavailable in this Web view.", "لا توجد جلسة رحلة مسجلة. يظل التتبع المباشر غير متاح في عرض الويب هذا.")}</dd></div>
            <div><dt>{copy(locale, "Offline and queued actions", "العمل دون اتصال والإجراءات المعلّقة")}</dt><dd>{copy(locale, "Unavailable in this Web read model; open the assigned Field workspace.", "غير متاح في نموذج القراءة على الويب؛ افتح مساحة العمل الميدانية المسندة.")}</dd></div>
          </dl>
          {selected.inspectorId === currentUserId ? (
            <a className="sq-btn" href={`/field/${selected.id}`}>{selected.operationalState === "new" ? copy(locale, "Prepare in Field workspace", "التحضير في مساحة العمل الميدانية") : copy(locale, "Open Field workspace", "فتح مساحة العمل الميدانية")}</a>
          ) : (
            <a className="sq-btn" href={`/visits/${selected.id}`}>{copy(locale, "Open governed visit details", "فتح تفاصيل الزيارة المعتمدة")}</a>
          )}
          <button className="sq-btn sq-btn--secondary" type="button" onClick={() => setSelected(null)}>{copy(locale, "Close", "إغلاق")}</button>
        </div>
      ) : null}
      {reschedule ? (
        <div ref={rescheduleDialogRef} className="sq-execution__drawer" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
          <button ref={rescheduleCloseRef} type="button" aria-label={copy(locale, "Close configuration drawer", "إغلاق لوحة الإعداد")} onClick={() => setReschedule(null)}>×</button>
          <p className="sq-overline">{copy(locale, "Planning window guard", "حماية نافذة التخطيط")}</p>
          <h2 id="reschedule-title">{copy(locale, "Configure", "إعداد")} {reschedule.row.visitReference}</h2>
          <p><strong>{reschedule.row.factory}</strong> {copy(locale, `was dropped on ${formatDate(locale, reschedule.date)}. No date has been changed.`, `تم إسقاطها على ${formatDate(locale, reschedule.date)}. لم يتم تغيير أي تاريخ.`)}</p>
          <div className="sq-banner"><strong>{copy(locale, "Current governed window:", "النافذة المعتمدة الحالية:")}</strong> {formatDate(locale, reschedule.row.windowStart)} – {formatDate(locale, reschedule.row.windowEnd)}. {copy(locale, "The planning workflow validates conflicts and records the change.", "يتحقق مسار التخطيط من التعارضات ويسجل التغيير.")}</div>
          <p>{copy(locale, "The proposed day is not transferred because Planning has no governed handoff contract for it.", "لا يتم نقل اليوم المقترح لأن التخطيط لا يملك عقد تسليم معتمداً له.")}</p>
          <a className="sq-btn" href={`/planning/visits/${reschedule.row.id}`}>{copy(locale, "Continue in Planning", "المتابعة في التخطيط")}</a>
          <button className="sq-btn sq-btn--secondary" type="button" onClick={() => setReschedule(null)}>{copy(locale, "Cancel", "إلغاء")}</button>
        </div>
      ) : null}
    </div>
  );
}
