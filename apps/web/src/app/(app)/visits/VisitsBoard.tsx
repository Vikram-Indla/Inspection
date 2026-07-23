"use client";
import EmptyState from "@/components/EmptyState";
import type { ReasonOption } from "@/lib/planning/lifecycle";
// W2/P2 — Visit Management board (SCR-WEB-200/210).
// M02-003/021: search by Visit ID / Factory / CR / Industrial License / Inspector
//              — client filter over the loaded server page (RLS-scoped rows).
// M02-002/004/022: KPI tiles filter the list on click; status/type/mode/date-range filters.
// M02-023: user sorting (window asc/desc, factory) + row selection.
// M02-007/011/031/032/033/034: multi-select rows → bulk reschedule / reassign /
//              cancel / edit via server actions that report per-item outcomes.
// M02-016 display parity with field: lapsed published windows render 'expired'.
// All strings arrive pre-translated from the server page (strings-prop canon).
//
// CD-026 / SCR-WEB-200 Track 1:
//   - Selected Visit Continuity Spine (signature pattern): one stable selected
//     identity + state + allowed-action context, carried in-session. Cross-route
//     persistence is HANDOFF_BLOCKED_CONTINUITY (not synthesised here).
//   - Bulk eligibility preview: per-verb "n of N eligible", verified-now vs
//     re-checked-at-submit; the cross-Plan bulk-edit control is shown UNAVAILABLE
//     (HANDOFF_BLOCKED_GUARD — no server enforcement), never faked as safe.
//   - Per-item outcome ledger replaces the single mixed banner: Applied /
//     Blocked before change / Change applied — notification not queued. A mixed
//     result is NEVER a green success banner. Focus moves to the summary; a
//     failing/partial submit is a single role=alert, progress is role=status.
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useActionState } from "react";
import {
  bulkCancelVisits, bulkRescheduleVisits, bulkReassignVisits, bulkEditVisits,
  type ActionResult, type BulkVerb, type OutcomeCode,
} from "./actions";

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
  region: string;
  city: string;
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
  allRegions: string;
  allCities: string;
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
  bulkCancelComments: string;
  bulkCancelPlaceholder: string;
  bulkCancelBtn: string;
  bulkEditType: string; bulkEditNotes: string; bulkEditNotesPlaceholder: string; bulkEditSetNotes: string; bulkEditBtn: string;
  typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  clearSelection: string;
  noMatch: string;
  showing: string;          // "{shown}" and "{total}" placeholders
  loadMore: string;
  expiredLabel: string;
  // CD-026 — continuity spine
  spineHeading: string;
  spineEmpty: string;
  spineOpenDetail: string;
  spineWindow: string;
  spineInspector: string;
  spineAllowed: string;
  previewAria: string;      // "{id}"
  openDetailAria: string;   // "{id}"
  allowedEditable: string;
  allowedLocked: string;
  allowedFinal: string;
  allowedExpired: string;
  // CD-026 — eligibility preview
  eligHeading: string;
  eligVerified: string;
  eligCount: string;        // "{n}" and "{total}"
  eligSamePlanBlocked: string;
  eligReschedule: string;
  eligReassign: string;
  eligCancel: string;
  eligEdit: string;
  // CD-026 — outcome ledger
  ledgerColVisit: string;
  ledgerColOutcome: string;
  ledgerColReason: string;
  ledgerOpen: string;
  ledgerSummaryApplied: string;   // "{n}"
  ledgerSummaryBlocked: string;   // "{n}"
  ledgerSummaryNoNotif: string;   // "{n}"
  ledgerRetrySafe: string;
  progressBusy: string;           // "{n}"
  verbReschedule: string; verbReassign: string; verbCancel: string; verbEdit: string;
  outcomeApplied: string;
  outcomeNoNotif: string;
  ledgerShortNoNotif: string;
  ledgerShortBlocked: string;
  ledgerShortError: string;
  outcomeBlockedNotPub: string;
  outcomeBlockedStarted: string;
  outcomeBlockedNoAssign: string;
  outcomeError: string;
  // CD-026 — neutral pre-flight validation
  errSelectOne: string;
  errReasonRequired: string;
  errReasonsUnavailable: string;
  errSession: string;
  errWindowRequired: string;
  errWindowInvalid: string;
  errWindowOrder: string;
  errInspectorRequired: string;
  errTypeOrNotes: string;
};

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical", expired: "ax-lozenge--critical" };

// Outcome → lozenge tone. "Applied" is success; everything else that means
// "nothing changed / partial" is warning, never a green success signal.
const OUTCOME_TONE: Record<OutcomeCode, string> = {
  applied: "ax-lozenge--success",
  applied_no_notification: "ax-lozenge--warning",
  blocked_not_publishable: "ax-lozenge--warning",
  blocked_started: "ax-lozenge--warning",
  blocked_no_assignment: "ax-lozenge--warning",
  error: "ax-lozenge--critical",
};

type SortKey = "window_asc" | "window_desc" | "factory";
type AllowedKey = "editable" | "locked" | "final" | "expired";

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");
const EMPTY: ActionResult = {};

export default function VisitsBoard({ rows, inspectors, typeOptions, modeOptions, regionOptions, cityOptions, cancelReasons, total, limit, nextLimit, strings, locale, targetMode = false }: {
  rows: VisitRow[];
  inspectors: Inspector[];
  typeOptions: { value: string; label: string }[];
  modeOptions: { value: string; label: string }[];
  regionOptions: { value: string; label: string }[];
  cityOptions: { value: string; label: string }[];
  /** M8 — governed cancellation reason options (planning_lookups). */
  cancelReasons: ReasonOption[];
  total: number;
  limit: number;
  nextLimit: number | null;
  strings: VisitsBoardStrings;
  locale: "ar" | "en";
  targetMode?: boolean;
}) {
  void locale;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("window_asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null); // continuity spine
  const [lastVerb, setLastVerb] = useState<BulkVerb | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [can, canAct, p1] = useActionState<ActionResult, FormData>(bulkCancelVisits, EMPTY);
  const [rsc, rscAct, p2] = useActionState<ActionResult, FormData>(bulkRescheduleVisits, EMPTY);
  const [rea, reaAct, p3] = useActionState<ActionResult, FormData>(bulkReassignVisits, EMPTY);
  const [edt, edtAct, p4] = useActionState<ActionResult, FormData>(bulkEditVisits, EMPTY);
  const busy = p1 || p2 || p3 || p4;

  // Only the last-submitted verb's result is rendered (one form submits at a
  // time). This avoids showing stale ledgers from an earlier verb.
  const resultByVerb: Record<BulkVerb, ActionResult> = { cancel: can, reschedule: rsc, reassign: rea, edit: edt };
  const pendingByVerb: Record<BulkVerb, boolean> = { cancel: p1, reschedule: p2, reassign: p3, edit: p4 };
  const result = lastVerb ? resultByVerb[lastVerb] : null;
  const pending = lastVerb ? pendingByVerb[lastVerb] : false;
  const hasLedger = !!result?.items && result.items.length > 0;
  const hasFormError = !!result?.formErrorCode;

  // M02-016 display parity with field (M03-015): lapsed published window with a
  // not-started inspection renders 'expired'. Persistence is expire_lapsed_visits().
  const nowMs = useMemo(() => Date.now(), []);
  const effectiveStatus = (v: VisitRow) => {
    const lapsed = new Date(v.windowEnd).getTime() < nowMs;
    const started = !!v.inspectionStatus && v.inspectionStatus !== "not_started";
    return v.planningStatus === "published" && lapsed && !started ? "expired" : v.planningStatus;
  };
  // published + not-started + not-lapsed → the reschedule/cancel/edit guard set.
  const isPublishNew = (v: VisitRow) => effectiveStatus(v) === "published" && v.operationalState === "new";
  const isNotStarted = (v: VisitRow) => !v.inspectionStatus || v.inspectionStatus === "not_started";
  const allowedKey = (v: VisitRow): AllowedKey => {
    if (effectiveStatus(v) === "expired") return "expired";
    if (v.planningStatus === "cancelled") return "final";
    if (!isNotStarted(v)) return "locked";
    if (isPublishNew(v)) return "editable";
    return "final";
  };
  const allowedLabel: Record<AllowedKey, string> = {
    editable: strings.allowedEditable, locked: strings.allowedLocked,
    final: strings.allowedFinal, expired: strings.allowedExpired,
  };
  const allowedTone: Record<AllowedKey, string> = {
    editable: "ax-lozenge--success", locked: "ax-lozenge--warning",
    final: "ax-lozenge--critical", expired: "ax-lozenge--critical",
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
      if (region && v.region !== region) return false;
      if (city && v.city !== city) return false;
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
  }, [rows, q, status, type, mode, region, city, from, to, sort, nowMs]);

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
  const hasFilter = q || status || type || mode || region || city || from || to;
  const clearFilters = () => { setQ(""); setStatus(""); setType(""); setMode(""); setRegion(""); setCity(""); setFrom(""); setTo(""); };
  const hidden = [...selected].map(id => <input key={id} type="hidden" name="visit_ids" value={id} />);

  const rowById = useMemo(() => new Map(rows.map(v => [v.id, v])), [rows]);
  const activeVisit = activeId ? rowById.get(activeId) ?? null : null;

  // Bulk eligibility preview — computed from the loaded rows (verified now);
  // the server re-checks every item per its guard at submit (rechecked-at-submit).
  const selectedRows = useMemo(
    () => [...selected].map(id => rowById.get(id)).filter((v): v is VisitRow => !!v),
    [selected, rowById],
  );
  const elig = useMemo(() => {
    const publishNew = selectedRows.filter(isPublishNew).length;
    const notStarted = selectedRows.filter(isNotStarted).length;
    const plans = new Set(selectedRows.map(v => v.planId));
    const samePlan = plans.size === 1 && [...plans][0] !== ""; // one non-immediate Plan
    return { n: selectedRows.length, publishNew, notStarted, samePlan };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRows, nowMs]);

  const eligLine = (n: number) => strings.eligCount.replace("{n}", String(n)).replace("{total}", String(elig.n));

  // Focus the outcome summary after a completed submit (success, partial, or
  // failure) so keyboard / screen-reader users land on the result (S38).
  useEffect(() => {
    if (!pending && (hasLedger || hasFormError)) summaryRef.current?.focus();
  }, [pending, hasLedger, hasFormError, result]);

  const formErrorText = (): string => {
    switch (result?.formErrorCode) {
      case "select_one": return strings.errSelectOne;
      case "reason_required": return strings.errReasonRequired;
      case "reasons_unavailable": return strings.errReasonsUnavailable;
      case "session": return strings.errSession;
      case "window_required": return strings.errWindowRequired;
      case "window_invalid": return strings.errWindowInvalid;
      case "window_order": return strings.errWindowOrder;
      case "inspector_required": return strings.errInspectorRequired;
      case "type_or_notes_required": return strings.errTypeOrNotes;
      default: return "";
    }
  };
  const outcomeText: Record<OutcomeCode, string> = {
    applied: strings.outcomeApplied,
    applied_no_notification: strings.outcomeNoNotif,
    blocked_not_publishable: strings.outcomeBlockedNotPub,
    blocked_started: strings.outcomeBlockedStarted,
    blocked_no_assignment: strings.outcomeBlockedNoAssign,
    error: strings.outcomeError,
  };
  const verbLabel: Record<BulkVerb, string> = {
    reschedule: strings.verbReschedule, reassign: strings.verbReassign,
    cancel: strings.verbCancel, edit: strings.verbEdit,
  };

  const ledger = result?.items ?? [];
  const nApplied = ledger.filter(i => i.outcome === "applied").length;
  const nNoNotif = ledger.filter(i => i.outcome === "applied_no_notification").length;
  const nBlocked = ledger.filter(i => i.outcome.startsWith("blocked") || i.outcome === "error").length;
  const anyProblem = nBlocked > 0 || nNoNotif > 0; // partial/failed → role=alert

  return (
    <div data-saqeel-design={targetMode ? "WA-DES-045" : undefined}
      style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)", ...(targetMode ? { "--text-muted": "var(--text-secondary)" } : {}) } as CSSProperties}>
      {targetMode && <h1 className="ax-sr-only">Visit management</h1>}
      {/* CD-026 — Selected Visit Continuity Spine (signature pattern). One stable
          selected identity + state + allowed-action context, carried in-session. */}
      {!targetMode && <section className="panel" aria-label={strings.spineHeading}
        style={{ padding: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
          <span className="ax-overline">{strings.spineHeading}</span>
          {activeVisit && (
            <span className={`ax-lozenge ${allowedTone[allowedKey(activeVisit)]}`}>{allowedLabel[allowedKey(activeVisit)]}</span>
          )}
        </div>
        {!activeVisit ? (
          <p className="t-caption" style={{ margin: 0 }}>{strings.spineEmpty}</p>
        ) : (
          <div className="row" style={{ flexWrap: "wrap", gap: "var(--ax-space-300)", alignItems: "flex-start" }}>
            <div style={{ minInlineSize: 200 }}>
              <div className="numeric"><strong>{activeVisit.id.slice(0, 8)}</strong>
                {activeVisit.planId && <span className="t-caption numeric">{"  "}· {activeVisit.planMethod === "bulk" ? strings.campaignLabel : strings.planLabel} {activeVisit.planId.slice(0, 8)}</span>}
              </div>
              <div className="t-caption">{activeVisit.factoryName}{(activeVisit.crNumber || activeVisit.licenseNumber) && <> · <span className="numeric">{[activeVisit.crNumber, activeVisit.licenseNumber].filter(Boolean).join(" · ")}</span></>}</div>
              <div className="t-caption">{activeVisit.typeLabel} · {activeVisit.modeLabel}</div>
            </div>
            <div style={{ minInlineSize: 180 }}>
              <div className="row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
                <span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[effectiveStatus(activeVisit)] ?? ""}`}>
                  {effectiveStatus(activeVisit) === "expired" && activeVisit.planningStatus === "published" ? strings.expiredLabel : activeVisit.planningLabel}
                </span>
                <span className="ax-lozenge ax-lozenge--ops">{activeVisit.opsLabel}</span>
              </div>
              <div className="t-caption">{strings.spineWindow}: <span className="numeric">{fmt(activeVisit.windowStart)}</span></div>
              <div className="t-caption">{strings.spineInspector}: {activeVisit.inspectorName || "—"}</div>
            </div>
            <a className="btn btn-ghost btn-touch" href={`/visits/${activeVisit.id}`}
              aria-label={strings.openDetailAria.replace("{id}", activeVisit.id.slice(0, 8))}>{strings.spineOpenDetail}</a>
          </div>
        )}
      </section>}

      {/* M02-002 — KPI tiles double as status filters */}
      <div className="ax-kpi-row" role="group" aria-label={strings.kpiFilterHint}>
        {["draft", "published", "returned", "cancelled", "expired"].map(s => (
          <button key={s} type="button" className="panel ax-kpi"
            aria-pressed={status === s}
            onClick={() => setStatus(status === s ? "" : s)}
            style={{ cursor: "pointer", textAlign: "start", boxShadow: status === s ? "var(--ax-focus-ring)" : undefined }}>
            <span className="ax-overline">{strings.statusLabels[s] ?? s}</span>
            <span className="ax-kpi__value numeric">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* M02-003/004 — search + filters + sort */}
      <div className="panel" style={{ padding: "var(--ax-space-200)", display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)", alignItems: "flex-end" }}>
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
        <select className="ax-select" value={region} onChange={e => setRegion(e.target.value)} aria-label={strings.allRegions}>
          <option value="">{strings.allRegions}</option>
          {regionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="ax-select" value={city} onChange={e => setCity(e.target.value)} aria-label={strings.allCities}>
          <option value="">{strings.allCities}</option>
          {cityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="ax-field" style={{ maxInlineSize: 170 }}>
          <label className="ax-field__label" htmlFor="visit-filter-from">{strings.fromDate}</label>
          <input id="visit-filter-from" className="ax-input numeric" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="ax-field" style={{ maxInlineSize: 170 }}>
          <label className="ax-field__label" htmlFor="visit-filter-to">{strings.toDate}</label>
          <input id="visit-filter-to" className="ax-input numeric" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <select className="ax-select" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label={strings.sortAria}>
          <option value="window_asc">{strings.sortWindowAsc}</option>
          <option value="window_desc">{strings.sortWindowDesc}</option>
          <option value="factory">{strings.sortFactory}</option>
        </select>
        {hasFilter && <button type="button" className="btn btn-ghost btn-touch" onClick={clearFilters}>{strings.clearFilters}</button>}
      </div>

      {/* M02-007/011/031-034 — bulk action bar over the selection */}
      {selected.size > 0 && (
        <div className="panel" style={{ padding: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <h4 style={{ margin: 0 }}>{strings.bulkHeading} · {strings.selectedCount.replace("{n}", String(selected.size))}</h4>
            <button type="button" className="btn btn-ghost btn-touch" onClick={() => setSelected(new Set())}>{strings.clearSelection}</button>
          </div>

          {/* CD-026 — eligibility preview: verified now, re-checked at submit */}
          <div className="ax-state ax-state--inline" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-050)", alignItems: "flex-start" }}>
            <span className="ax-overline">{strings.eligHeading}</span>
            <div className="row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap" }}>
              <span className="t-caption">{strings.eligReschedule}: <strong>{eligLine(elig.publishNew)}</strong></span>
              <span className="t-caption">{strings.eligCancel}: <strong>{eligLine(elig.publishNew)}</strong></span>
              <span className="t-caption">{strings.eligReassign}: <strong>{eligLine(elig.notStarted)}</strong></span>
              <span className="t-caption">{strings.eligEdit}: <strong>{elig.samePlan ? eligLine(elig.publishNew) : "—"}</strong></span>
            </div>
            <span className="t-caption">{strings.eligVerified}</span>
            {!elig.samePlan && <span className="badge badge-warning">{strings.eligSamePlanBlocked}</span>}
          </div>

          <div className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
            <form action={rscAct} onSubmit={() => setLastVerb("reschedule")} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              {hidden}
              <div className="ax-field" style={{ maxInlineSize: 210 }}><label className="ax-field__label" htmlFor="bulk-window-start">{strings.bulkWindowStart}</label>
                <input id="bulk-window-start" className="ax-input numeric" type="datetime-local" name="window_start" /></div>
              <div className="ax-field" style={{ maxInlineSize: 210 }}><label className="ax-field__label" htmlFor="bulk-window-end">{strings.bulkWindowEnd}</label>
                <input id="bulk-window-end" className="ax-input numeric" type="datetime-local" name="window_end" /></div>
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.bulkRescheduleBtn}</button>
            </form>
            <form action={reaAct} onSubmit={() => setLastVerb("reassign")} className="row" style={{ alignItems: "flex-end" }}>
              {hidden}
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="bulk-inspector">{strings.bulkReassignTo}</label>
                <select id="bulk-inspector" className="ax-select" name="inspector_id"><option value="">{strings.selectOption}</option>
                  {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.bulkReassignBtn}</button>
            </form>
            <form action={canAct} onSubmit={() => setLastVerb("cancel")} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              {hidden}
              {/* M8 / PLN-CON-011 — governed cancellation reason (active lookup
                  keys only); comments mandatory when the reason is Other
                  (server-enforced). */}
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="bulk-cancel-reason">{strings.bulkCancelReason}</label>
                <select id="bulk-cancel-reason" className="ax-select" name="reason_key" required>
                  <option value="">{strings.selectOption}</option>
                  {cancelReasons.map(o => <option key={o.key} value={o.key}>{o.label_en}</option>)}
                </select></div>
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="bulk-cancel-comments">{strings.bulkCancelComments}</label>
                <input id="bulk-cancel-comments" className="ax-input" name="comments" placeholder={strings.bulkCancelPlaceholder} /></div>
              <button className="btn btn-danger btn-touch" disabled={busy}>{strings.bulkCancelBtn}</button>
            </form>
            <form action={edtAct} onSubmit={() => setLastVerb("edit")} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              {hidden}
              <div className="ax-field" style={{ maxInlineSize: 180 }}><label className="ax-field__label" htmlFor="bulk-visit-type">{strings.bulkEditType}</label>
                <select id="bulk-visit-type" className="ax-select" name="visit_type"><option value="">{strings.selectOption}</option>
                  <option value="periodic">{strings.typePeriodic}</option>
                  <option value="follow_up">{strings.typeFollowUp}</option>
                  <option value="complaint">{strings.typeComplaint}</option></select></div>
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="bulk-edit-notes">{strings.bulkEditNotes}</label>
                <input id="bulk-edit-notes" className="ax-input" name="notes" placeholder={strings.bulkEditNotesPlaceholder} /></div>
              <label className="ax-choice" style={{ display: "flex" }}>
                <input type="checkbox" name="set_notes" value="1" />
                <span>{strings.bulkEditSetNotes}</span>
              </label>
              {/* HANDOFF_BLOCKED_GUARD — cross-Plan bulk edit has no server enforcement,
                  so it is disabled (not faked as safe) when the selection spans Plans. */}
              <button className="btn btn-secondary btn-touch" disabled={busy || !elig.samePlan}
                title={!elig.samePlan ? strings.eligSamePlanBlocked : undefined}>{strings.bulkEditBtn}</button>
            </form>
          </div>
        </div>
      )}

      {/* CD-026 — busy progress: role=status, no optimistic success (S25/S39) */}
      {pending && (
        <div className="ax-banner" role="status" aria-live="polite">
          <div>{strings.progressBusy.replace("{n}", String(selected.size))}</div>
        </div>
      )}

      {/* CD-026 — neutral pre-flight validation (single role=alert) */}
      {!pending && hasFormError && (
        <div ref={summaryRef} tabIndex={-1} className="ax-banner ax-banner--critical" role="alert">
          <div>{formErrorText()}</div>
        </div>
      )}

      {/* CD-026 — per-item outcome ledger. Never a single green banner for a
          mixed result. Partial/failed → role=alert; all-applied → role=status. */}
      {!pending && hasLedger && (
        <div ref={summaryRef} tabIndex={-1}
          className={`panel ${anyProblem ? "ax-banner--critical" : ""}`}
          role={anyProblem ? "alert" : "status"} aria-live="polite"
          style={{ padding: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
          <div className="row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap", alignItems: "baseline" }}>
            <strong>{verbLabel[result!.verb as BulkVerb] ?? ""}</strong>
            {nApplied > 0 && <span className="badge badge-compliant">{strings.ledgerSummaryApplied.replace("{n}", String(nApplied))}</span>}
            {nBlocked > 0 && <span className="badge badge-warning">{strings.ledgerSummaryBlocked.replace("{n}", String(nBlocked))}</span>}
            {nNoNotif > 0 && <span className="badge badge-warning">{strings.ledgerSummaryNoNotif.replace("{n}", String(nNoNotif))}</span>}
          </div>
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr>
              <th scope="col">{strings.ledgerColVisit}</th>
              <th scope="col">{strings.ledgerColOutcome}</th>
              <th scope="col">{strings.ledgerColReason}</th>
              <th scope="col" />
            </tr></thead>
            <tbody>
              {ledger.map(item => (
                <tr key={item.id}>
                  <td className="numeric"><strong>{item.id.slice(0, 8)}</strong></td>
                  <td><span className={`ax-lozenge ${OUTCOME_TONE[item.outcome]}`}>
                    {item.outcome === "applied" ? strings.outcomeApplied
                      : item.outcome === "applied_no_notification" ? strings.ledgerShortNoNotif
                      : item.outcome === "error" ? strings.ledgerShortError
                      : strings.ledgerShortBlocked}
                  </span></td>
                  <td className="t-caption">{outcomeText[item.outcome]}</td>
                  <td><a className="ax-link t-caption" href={`/visits/${item.id}`}>{strings.ledgerOpen}</a></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {nBlocked > 0 && <span className="t-caption">{strings.ledgerRetrySafe}</span>}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState glyph="🔍" title={strings.noMatch} />
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th scope="col" style={{ inlineSize: 32 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={strings.selectAllAria} /></th>
            <th scope="col">{strings.colVisit}</th><th scope="col">{strings.colFactory}</th><th scope="col">{strings.colTypeMode}</th>
            <th scope="col">{strings.colPlanning}</th><th scope="col">{strings.colOperational}</th><th scope="col">{strings.colInspector}</th>
            <th scope="col" className="ax-td-num">{strings.colWindow}</th>
          </tr></thead>
          <tbody>
            {filtered.map(v => {
              const eff = effectiveStatus(v);
              const isActive = v.id === activeId;
              return (
                <tr key={v.id} aria-selected={isActive}
                  style={isActive ? { outline: "var(--ax-focus-ring)", outlineOffset: "-2px" } : undefined}>
                  <td><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleOne(v.id)}
                    aria-label={strings.selectRowAria.replace("{id}", v.id.slice(0, 8))} /></td>
                  <td className="numeric">
                    {/* Button drives the continuity spine (keyboard-accessible);
                        the adjacent link preserves direct navigation to detail. */}
                    <button type="button" className="ax-link ax-inline-target" onClick={() => setActiveId(v.id)} aria-pressed={isActive}
                      aria-label={strings.previewAria.replace("{id}", v.id.slice(0, 8))}>
                      <strong>{v.id.slice(0, 8)}</strong>
                    </button>
                    {" "}<a className="ax-link t-caption ax-inline-target" href={`/visits/${v.id}${targetMode ? "?wa_preview=1" : ""}`}
                      aria-label={strings.openDetailAria.replace("{id}", v.id.slice(0, 8))}>↗</a>
                    {v.planId && (
                      <><br /><span className="t-caption numeric">{v.planMethod === "bulk" ? strings.campaignLabel : strings.planLabel} {v.planId.slice(0, 8)}</span></>
                    )}
                  </td>
                  <td>{v.factoryName}{(v.crNumber || v.licenseNumber) && (
                    <><br /><span className="t-caption numeric">{[v.crNumber, v.licenseNumber].filter(Boolean).join(" · ")}</span></>
                  )}</td>
                  <td>{v.typeLabel} · {v.modeLabel}</td>
                  <td><span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[eff] ?? ""}`}>
                    {eff === "expired" && v.planningStatus === "published" ? strings.expiredLabel : v.planningLabel}
                  </span></td>
                  <td><span className="ax-lozenge ax-lozenge--ops">{v.opsLabel}</span></td>
                  <td>{v.inspectorName || "—"}</td>
                  <td className="ax-td-num numeric">{fmt(v.windowStart)}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}

      {/* M02-020 — count display + load-more raises the server page cap */}
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="t-caption numeric">
          {strings.showing.replace("{shown}", String(Math.min(rows.length, limit))).replace("{total}", String(total))}
        </span>
        {nextLimit !== null && <a className="btn btn-ghost btn-touch" href={`/visits?limit=${nextLimit}`}>{strings.loadMore}</a>}
      </div>
    </div>
  );
}
