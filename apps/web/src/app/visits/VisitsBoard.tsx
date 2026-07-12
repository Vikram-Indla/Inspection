"use client";
// W2/P2 — Visit Management board (SCR-WEB-200/210).
// M02-003/021: search by Visit ID / Factory / CR / Industrial License / Inspector
//              — client filter over the loaded server page (RLS-scoped rows).
// M02-002/004/022: KPI tiles filter the list on click; status/type/mode/date-range filters.
// M02-023: user sorting (window asc/desc, factory) + row selection.
// M02-007/011/031/032/033/034: multi-select rows → bulk reschedule / reassign /
//              cancel via server actions that report per-row outcomes.
// M02-016 display parity with field: lapsed published windows render 'expired'.
// All strings arrive pre-translated from the server page (strings-prop canon).
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { bulkCancelVisits, bulkRescheduleVisits, bulkReassignVisits, type ActionResult } from "./actions";

export type VisitRow = {
  id: string;
  visitType: string;
  executionMode: string;
  planningStatus: string;
  operationalState: string;
  windowStart: string;   // ISO
  windowEnd: string;     // ISO
  factoryName: string;
  factoryCode: string;
  crNumber: string;
  licenseNumber: string;
  planId: string;        // visit_plan_id ("" = immediate, no plan)
  planMethod: string;    // single|bulk ("" = immediate)
  inspectorName: string;
  inspectionStatus: string | null; // null = no inspection row yet
  typeLabel: string;     // pre-translated
  modeLabel: string;
  planningLabel: string;
  opsLabel: string;
};

export type Inspector = { user_id: string; full_name: string };

export type VisitsBoardStrings = {
  searchPlaceholder: string;
  searchAria: string;
  campaignLabel: string;
  planLabel: string;
  allStatuses: string;
  allTypes: string;
  allModes: string;
  fromDate: string;
  toDate: string;
  sortAria: string;
  sortWindowAsc: string;
  sortWindowDesc: string;
  sortFactory: string;
  clearFilters: string;
  statusLabels: Record<string, string>; // draft/published/returned/cancelled/expired
  kpiFilterHint: string;
  colVisit: string;
  colFactory: string;
  colTypeMode: string;
  colPlanning: string;
  colOperational: string;
  colInspector: string;
  colWindow: string;
  selectAllAria: string;
  selectRowAria: string;    // "{id}" placeholder
  selectedCount: string;    // "{n}" placeholder
  bulkHeading: string;
  bulkWindowStart: string;
  bulkWindowEnd: string;
  bulkRescheduleBtn: string;
  bulkReassignTo: string;
  bulkReassignBtn: string;
  selectOption: string;
  bulkCancelReason: string;
  bulkCancelPlaceholder: string;
  bulkCancelBtn: string;
  clearSelection: string;
  noMatch: string;
  showing: string;          // "{shown}" and "{total}" placeholders
  loadMore: string;
  expiredLabel: string;
};

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical", expired: "ax-lozenge--critical" };

type SortKey = "window_asc" | "window_desc" | "factory";

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");

export default function VisitsBoard({ rows, inspectors, typeOptions, modeOptions, total, limit, nextLimit, strings }: {
  rows: VisitRow[];
  inspectors: Inspector[];
  typeOptions: { value: string; label: string }[];
  modeOptions: { value: string; label: string }[];
  total: number;
  limit: number;
  nextLimit: number | null;
  strings: VisitsBoardStrings;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("window_asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [can, canAct, p1] = useActionState<ActionResult, FormData>(bulkCancelVisits, {});
  const [rsc, rscAct, p2] = useActionState<ActionResult, FormData>(bulkRescheduleVisits, {});
  const [rea, reaAct, p3] = useActionState<ActionResult, FormData>(bulkReassignVisits, {});
  const busy = p1 || p2 || p3;
  const msg = can.error ?? rsc.error ?? rea.error;
  const ok = can.ok ?? rsc.ok ?? rea.ok;

  // M02-016 display parity with field (M03-015): lapsed published window with a
  // not-started inspection renders 'expired'. Persistence is expire_lapsed_visits().
  const nowMs = useMemo(() => Date.now(), []);
  const effectiveStatus = (v: VisitRow) => {
    const lapsed = new Date(v.windowEnd).getTime() < nowMs;
    const started = !!v.inspectionStatus && v.inspectionStatus !== "not_started";
    return v.planningStatus === "published" && lapsed && !started ? "expired" : v.planningStatus;
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of rows) { const s = effectiveStatus(v); c[s] = (c[s] ?? 0) + 1; }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, nowMs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter(v => {
      if (status && effectiveStatus(v) !== status) return false;
      if (type && v.visitType !== type) return false;
      if (mode && v.executionMode !== mode) return false;
      if (from && v.windowStart.slice(0, 10) < from) return false;
      if (to && v.windowStart.slice(0, 10) > to) return false;
      if (!needle) return true;
      // M02-021 — Visit ID, Plan/Campaign ID, Factory Name, CR, Industrial License, Inspector.
      // Bulk plans ARE campaigns, so the plan id doubles as the campaign key: matching it
      // surfaces every visit dispatched under that campaign.
      return [v.id, v.planId, v.factoryName, v.factoryCode, v.crNumber, v.licenseNumber, v.inspectorName]
        .some(f => f && f.toLowerCase().includes(needle));
    });
    const dir = sort === "window_desc" ? -1 : 1;
    return [...list].sort((a, b) =>
      sort === "factory"
        ? a.factoryName.localeCompare(b.factoryName)
        : dir * a.windowStart.localeCompare(b.windowStart));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, status, type, mode, from, to, sort, nowMs]);

  const allSelected = filtered.length > 0 && filtered.every(v => selected.has(v.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach(v => next.delete(v.id));
      else filtered.forEach(v => next.add(v.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const hasFilter = q || status || type || mode || from || to;
  const clearFilters = () => { setQ(""); setStatus(""); setType(""); setMode(""); setFrom(""); setTo(""); };
  const hidden = [...selected].map(id => <input key={id} type="hidden" name="visit_ids" value={id} />);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      {/* M02-002 — KPI tiles double as status filters */}
      <div className="ax-kpi-row" role="group" aria-label={strings.kpiFilterHint}>
        {["draft", "published", "returned", "cancelled", "expired"].map(s => (
          <button key={s} type="button" className="ax-surface ax-kpi"
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? "" : s)}
            style={{ cursor: "pointer", textAlign: "start", boxShadow: status === s ? "var(--ax-focus-ring)" : undefined }}>
            <span className="ax-overline">{strings.statusLabels[s] ?? s}</span>
            <span className="ax-kpi__value ax-numeric">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* M02-003/004 — search + filters + sort */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-200)", display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)", alignItems: "flex-end" }}>
        <input className="ax-input" style={{ inlineSize: 260 }} value={q} onChange={e => setQ(e.target.value)}
          placeholder={strings.searchPlaceholder} aria-label={strings.searchAria} />
        <select className="ax-select" value={status} onChange={e => setStatus(e.target.value)} aria-label={strings.allStatuses}>
          <option value="">{strings.allStatuses}</option>
          {["draft", "published", "returned", "cancelled", "expired"].map(s => <option key={s} value={s}>{strings.statusLabels[s] ?? s}</option>)}
        </select>
        <select className="ax-select" value={type} onChange={e => setType(e.target.value)} aria-label={strings.allTypes}>
          <option value="">{strings.allTypes}</option>
          {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="ax-select" value={mode} onChange={e => setMode(e.target.value)} aria-label={strings.allModes}>
          <option value="">{strings.allModes}</option>
          {modeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="ax-field" style={{ maxInlineSize: 170 }}>
          <label className="ax-field__label">{strings.fromDate}</label>
          <input className="ax-input ax-numeric" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="ax-field" style={{ maxInlineSize: 170 }}>
          <label className="ax-field__label">{strings.toDate}</label>
          <input className="ax-input ax-numeric" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <select className="ax-select" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label={strings.sortAria}>
          <option value="window_asc">{strings.sortWindowAsc}</option>
          <option value="window_desc">{strings.sortWindowDesc}</option>
          <option value="factory">{strings.sortFactory}</option>
        </select>
        {hasFilter && <button type="button" className="ax-btn ax-btn--subtle" onClick={clearFilters}>{strings.clearFilters}</button>}
      </div>

      {/* M02-007/011/031-034 — bulk action bar over the selection */}
      {selected.size > 0 && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <h4 style={{ margin: 0 }}>{strings.bulkHeading} · {strings.selectedCount.replace("{n}", String(selected.size))}</h4>
            <button type="button" className="ax-btn ax-btn--subtle" onClick={() => setSelected(new Set())}>{strings.clearSelection}</button>
          </div>
          <div className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
            <form action={rscAct} className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              {hidden}
              <div className="ax-field" style={{ maxInlineSize: 210 }}><label className="ax-field__label">{strings.bulkWindowStart}</label>
                <input className="ax-input ax-numeric" type="datetime-local" name="window_start" /></div>
              <div className="ax-field" style={{ maxInlineSize: 210 }}><label className="ax-field__label">{strings.bulkWindowEnd}</label>
                <input className="ax-input ax-numeric" type="datetime-local" name="window_end" /></div>
              <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.bulkRescheduleBtn}</button>
            </form>
            <form action={reaAct} className="ax-row" style={{ alignItems: "flex-end" }}>
              {hidden}
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label">{strings.bulkReassignTo}</label>
                <select className="ax-select" name="inspector_id"><option value="">{strings.selectOption}</option>
                  {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
              <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.bulkReassignBtn}</button>
            </form>
            <form action={canAct} className="ax-row" style={{ alignItems: "flex-end" }}>
              {hidden}
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label">{strings.bulkCancelReason}</label>
                <input className="ax-input" name="reason" placeholder={strings.bulkCancelPlaceholder} /></div>
              <button className="ax-btn ax-btn--danger" disabled={busy}>{strings.bulkCancelBtn}</button>
            </form>
          </div>
        </div>
      )}
      {/* per-row outcomes come back verbatim from the server action */}
      {msg && <div className="ax-banner ax-banner--critical"><div style={{ whiteSpace: "pre-line" }}>{msg}</div></div>}
      {ok && <div className="ax-banner ax-banner--success"><div style={{ whiteSpace: "pre-line" }}>{ok}</div></div>}

      {filtered.length === 0 ? (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🔍</span>
          <p className="ax-caption">{strings.noMatch}</p>
        </div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th style={{ inlineSize: 32 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={strings.selectAllAria} /></th>
            <th>{strings.colVisit}</th><th>{strings.colFactory}</th><th>{strings.colTypeMode}</th>
            <th>{strings.colPlanning}</th><th>{strings.colOperational}</th><th>{strings.colInspector}</th>
            <th className="ax-td-num">{strings.colWindow}</th>
          </tr></thead>
          <tbody>
            {filtered.map(v => {
              const eff = effectiveStatus(v);
              return (
                <tr key={v.id}>
                  <td><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleOne(v.id)}
                    aria-label={strings.selectRowAria.replace("{id}", v.id.slice(0, 8))} /></td>
                  <td className="ax-numeric"><a className="ax-link" href={`/visits/${v.id}`}><strong>{v.id.slice(0, 8)}</strong></a>
                    {v.planId && (
                      <><br /><span className="ax-caption ax-numeric">{v.planMethod === "bulk" ? strings.campaignLabel : strings.planLabel} {v.planId.slice(0, 8)}</span></>
                    )}</td>
                  <td>{v.factoryName}{(v.crNumber || v.licenseNumber) && (
                    <><br /><span className="ax-caption ax-numeric">{[v.crNumber, v.licenseNumber].filter(Boolean).join(" · ")}</span></>
                  )}</td>
                  <td>{v.typeLabel} · {v.modeLabel}</td>
                  <td><span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[eff] ?? ""}`}>
                    {eff === "expired" && v.planningStatus === "published" ? strings.expiredLabel : v.planningLabel}
                  </span></td>
                  <td><span className="ax-lozenge ax-lozenge--ops">{v.opsLabel}</span></td>
                  <td>{v.inspectorName || "—"}</td>
                  <td className="ax-td-num ax-numeric">{fmt(v.windowStart)}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}

      {/* M02-020 — count display + load-more raises the server page cap */}
      <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="ax-caption ax-numeric">
          {strings.showing.replace("{shown}", String(Math.min(rows.length, limit))).replace("{total}", String(total))}
        </span>
        {nextLimit !== null && <a className="ax-btn ax-btn--subtle" href={`/visits?limit=${nextLimit}`}>{strings.loadMore}</a>}
      </div>
    </div>
  );
}
