"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type DragEvent } from "react";
import type { GeoMarkerData } from "@/components/GeoMap";

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
const formatShort = (date: Date) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" }).format(date);
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const titleCase = (value: string | null) => value ? value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase()) : "—";

export default function RevampExecutionWorkspace({ rows, currentUserId }: {
  rows: ExecutionRow[];
  currentUserId: string;
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
      {filters[key] ? `${label}: ${titleCase(filters[key]!)}` : label}
    </button>
  );

  return (
    <div className="sq-execution">
      <section className="sq-execution__week">
        <div>
          <strong>{calendarMode === "week" ? "Week" : "Five-week view"} of {formatDate(weekStart.toISOString()).replace(/^\d{2} /, "")} – {formatDate(calendarEnd.toISOString())}</strong>
          <span><button type="button" aria-pressed={calendarMode === "week"} onClick={() => setCalendarMode("week")}>Week</button><button type="button" aria-pressed={calendarMode === "month"} onClick={() => setCalendarMode("month")}>Month</button></span>
        </div>
        <div className="sq-execution__days">
          {calendarDays.map(day => {
            const key = day.toISOString().slice(0, 10);
            const dayRows = calendarRows.filter(row => row.windowStart.slice(0, 10) === key);
            return (
              <article key={key} onDragOver={event => event.preventDefault()} onDrop={event => onDropDay(event, key)}>
                <header><span>{formatShort(day)}</span><span>{dayRows.length ? `${dayRows.length} visit${dayRows.length === 1 ? "" : "s"}` : ""}</span></header>
                {dayRows.slice(0, 4).map(row => <a href={`/visits/${row.id}`} key={row.id} data-risk={row.risk ?? ""} draggable onDragStart={event => event.dataTransfer.setData("text/visit-id", row.id)}>{row.factory}</a>)}
              </article>
            );
          })}
        </div>
        <p>Dragging a visit onto a day opens the configuration drawer with the planning window enforced — it never silently reschedules.</p>
      </section>

      <div className="sq-execution__viewbar">
        <nav aria-label="Execution view">
          <button type="button" aria-pressed={view === "mine"} onClick={() => setView("mine")}>My inspections</button>
          <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>All inspections</button>
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>Live map</button>
        </nav>
        <span><i />Tracking uses governed recorded positions</span>
      </div>

      <div className="sq-execution__filters">
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search factory, CR, licence…" />
        {filterButton("Inspector", "inspector")}
        {filterButton("Region", "region")}
        {filterButton("Risk", "risk")}
        {filterButton("Visit mode", "visitMode")}
        {filterButton("Operational state", "operationalState")}
        {filterButton("Priority", "priority")}
        {Object.keys(filters).some(key => filters[key as FilterKey]) ? <button type="button" onClick={() => setFilters({})}>Clear filters</button> : null}
      </div>

      {view === "map" ? (
        <section className="sq-execution__map">
          {markers.length ? <GeoMap center={[23.8859, 45.0792]} zoom={5} markers={markers} height="100%" />
            : <div><strong>No governed coordinates in this view</strong><p>The table views remain fully usable.</p></div>}
        </section>
      ) : (
        <section className="sq-execution__tablewrap">
          <table>
            <thead><tr>
              <th>Visit ref</th><th>Factory</th><th>Planning window</th><th>Execution date</th><th>Visit type</th><th>Visit mode</th><th>Risk</th>
              {view === "all" && <><th>Inspector</th><th>Region / city</th></>}
              <th>Operational state</th>
              {view === "mine" && <><th>Preparation</th><th>Report type</th></>}
              {view === "all" && <th>Tracking</th>}
              <th>Action</th>
            </tr></thead>
            <tbody>{visibleRows.map(row => (
              <tr key={row.id}>
                <th scope="row" data-label="Visit ref">{row.visitReference}</th>
                <td data-label="Factory">{row.factory}</td>
                <td data-label="Planning window">{formatDate(row.windowStart)} – {formatDate(row.windowEnd)}</td>
                <td data-label="Execution date">{formatDate(row.executionDate)}</td>
                <td data-label="Visit type">{titleCase(row.visitType)}</td>
                <td data-label="Visit mode">{titleCase(row.visitMode)}</td>
                <td data-label="Risk"><span data-tone={row.risk ?? ""}>{titleCase(row.risk)}</span></td>
                {view === "all" && <><td data-label="Inspector">{row.inspector ?? "Unassigned"}</td><td data-label="Region / city">{[row.region, row.city].filter(Boolean).join(" / ") || "—"}</td></>}
                <td data-label="Operational state"><span>{titleCase(row.operationalState)}</span></td>
                {view === "mine" && <><td data-label="Preparation">{titleCase(row.planningStatus)}</td><td data-label="Report type">Inspection report</td></>}
                {view === "all" && <td data-label="Tracking">{row.lat != null ? "Position recorded" : "No position"}</td>}
                <td data-label="Action"><a href={`/field/${row.id}`}>{row.operationalState === "new" ? "Prepare" : "Open"}</a></td>
              </tr>
            ))}</tbody>
          </table>
          {!visibleRows.length && <p>No inspections match this view and filter.</p>}
        </section>
      )}
      {reschedule ? (
        <div className="sq-execution__drawer" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
          <button type="button" aria-label="Close configuration drawer" onClick={() => setReschedule(null)}>×</button>
          <p className="sq-overline">Planning window guard</p>
          <h2 id="reschedule-title">Configure {reschedule.row.visitReference}</h2>
          <p><strong>{reschedule.row.factory}</strong> was dropped on {formatDate(reschedule.date)}. No date has been changed.</p>
          <div className="sq-banner"><strong>Current governed window:</strong> {formatDate(reschedule.row.windowStart)} – {formatDate(reschedule.row.windowEnd)}. The planning workflow validates conflicts and records the change.</div>
          <a className="sq-btn" href={`/planning/visits/${reschedule.row.id}?proposedDate=${encodeURIComponent(reschedule.date)}`}>Continue in Planning</a>
          <button className="sq-btn sq-btn--secondary" type="button" onClick={() => setReschedule(null)}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
}
