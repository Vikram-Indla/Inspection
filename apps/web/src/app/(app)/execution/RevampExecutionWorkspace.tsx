"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
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
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);
  const mine = rows.filter(row => row.inspectorId === currentUserId);
  const sourceRows = view === "mine" ? mine : rows;
  const visibleRows = sourceRows.filter(row => {
    const needle = query.trim().toLowerCase();
    return !needle || [row.factory, row.crNumber, row.visitReference].some(value => value?.toLowerCase().includes(needle));
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
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

  return (
    <div className="sq-execution">
      <section className="sq-execution__week">
        <div>
          <strong>Week of {formatDate(weekStart.toISOString()).replace(/^\d{2} /, "")} – {formatDate(weekEnd.toISOString())}</strong>
          <span><button type="button" aria-pressed="true">Week</button><button type="button">Month</button></span>
        </div>
        <div className="sq-execution__days">
          {weekDays.map(day => {
            const key = day.toISOString().slice(0, 10);
            const dayRows = calendarRows.filter(row => row.windowStart.slice(0, 10) === key);
            return (
              <article key={key}>
                <header><span>{formatShort(day)}</span><span>{dayRows.length ? `${dayRows.length} visit${dayRows.length === 1 ? "" : "s"}` : ""}</span></header>
                {dayRows.slice(0, 4).map(row => <a href={`/visits/${row.id}`} key={row.id} data-risk={row.risk ?? ""}>{row.factory}</a>)}
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
        {["Inspector", "Region", "Risk", "Visit mode", "Operational state", "More filters"].map(label => <button type="button" key={label}>{label}</button>)}
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
                <th scope="row">{row.visitReference}</th>
                <td>{row.factory}</td>
                <td>{formatDate(row.windowStart)} – {formatDate(row.windowEnd)}</td>
                <td>{formatDate(row.executionDate)}</td>
                <td>{titleCase(row.visitType)}</td>
                <td>{titleCase(row.visitMode)}</td>
                <td><span data-tone={row.risk ?? ""}>{titleCase(row.risk)}</span></td>
                {view === "all" && <><td>{row.inspector ?? "Unassigned"}</td><td>{[row.region, row.city].filter(Boolean).join(" / ") || "—"}</td></>}
                <td><span>{titleCase(row.operationalState)}</span></td>
                {view === "mine" && <><td>{titleCase(row.planningStatus)}</td><td>Inspection report</td></>}
                {view === "all" && <td>{row.lat != null ? "Position recorded" : "No position"}</td>}
                <td><a href={`/field/${row.id}`}>{row.operationalState === "new" ? "Prepare" : "Open"}</a></td>
              </tr>
            ))}</tbody>
          </table>
          {!visibleRows.length && <p>No inspections match this view and filter.</p>}
        </section>
      )}
    </div>
  );
}
