"use client";
import { useActionState, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { IconSearch } from "@/app/icons";
import {
  activateRegulation,
  deactivateRegulation,
  type RegulationLifecycleResult,
} from "./actions";

// SCR-ADM-010 (CD-005) + SCR-ADM-011 (CD-006) — client controls consume
// server-built strings only (SB19). Colour comes exclusively from legacy tokens/classes;
// no bare colour is written here. Every status cue is glyph + word, never colour alone.
export type RegStrings = {
  // create / clause / publish forms (proven actions)
  code: string;
  title: string;
  issuingAuthority: string;
  effectiveFrom: string;
  versionLabel: string;
  deactivationReason: string;
  titlePlaceholder: string;
  creating: string;
  create: string;
  created: string;
  clauseRef: string;
  legalSource: string;
  legalSourcePlaceholder: string;
  applicability: string;
  adding: string;
  addClause: string;
  added: string;
  clauseNotAudited: string;
  publishing: string;
  publish: string;
  saveDraft: string;
  savingDraft: string;
  draftSaved: string;
  deactivate: string;
  deactivating: string;
  deactivated: string;
  attachmentName: string;
  attachmentPath: string;
  attachmentType: string;
  attachmentHash: string;
  addAttachment: string;
  addingAttachment: string;
  attachmentAdded: string;
  // register / discovery (CD-005)
  searchPlaceholder: string;
  filterAll: string;
  filterPublished: string;
  filterDraft: string;
  filterDeactivated: string;
  filterLegend: string;
  statusPublished: string;
  statusDraft: string;
  statusDeactivated: string;
  openDossier: string;
  filteredEmptyTitle: string;
  filteredEmptyBody: string;
  createdAtLabel: string;
  // impact footprint rail (CD-005) — unknown ≠ zero
  railHeading: string;
  railRegulation: string;
  railClauses: string;
  railClausesUnknown: string;
  railClausesZero: string;
  railItems: string;
  railItemsUnknown: string;
  railItemsZero: string;
  railBeyond: string;
  railNotEvaluated: string;
  invalidNoClauses: string;
};

const fill = (tmpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), tmpl);

export function RegulationLifecycleControl({
  entityId,
  operationalStatus,
  labels,
}: {
  entityId: string;
  operationalStatus: string;
  labels: {
    activationReason: string;
    deactivationReason: string;
    applying: string;
    activate: string;
    deactivate: string;
    alreadyMatched: string;
    changedTo: string;
    cascaded: string;
    childrenNotReactivated: string;
    missingReference: string;
    reasonRequired: string;
    denied: string;
    notFound: string;
    providerError: string;
  };
}) {
  const activating = operationalStatus === "deactivated";
  const action = activating ? activateRegulation : deactivateRegulation;
  const [state, formAction, pending] = useActionState<RegulationLifecycleResult, FormData>(action, {});
  const cascaded = state.cascaded;
  const errorMessage = state.errorCode === "missing_reference" ? labels.missingReference
    : state.errorCode === "reason_required" ? labels.reasonRequired
      : state.errorCode === "denied" ? labels.denied
        : state.errorCode === "not_found" ? labels.notFound
          : state.errorCode === "provider" ? labels.providerError
            : state.error;
  // A draft was never activated, so deactivation is not a lifecycle transition
  // that applies to it — the affordance doesn't exist here, rather than
  // existing and being refused. Only active/deactivated regulations get the
  // control at all. Hooks above still run every render (Rules of Hooks); only
  // the render output is skipped.
  if (operationalStatus === "draft") return null;
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-2)", alignItems: "flex-start" }}>
      <input type="hidden" name="entity_id" value={entityId} />
      <label className="sq-field">
        <span className="sq-field__label">{activating ? labels.activationReason : labels.deactivationReason}</span>
        <textarea className="sq-input" name="reason" required />
      </label>
      <button className={activating ? "btn btn-primary btn-touch" : "btn btn-secondary btn-touch"} disabled={pending}>
        {pending ? labels.applying : activating ? labels.activate : labels.deactivate}
      </button>
      {errorMessage ? <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{errorMessage}</span> : null}
      {state.ok ? (
        <span className="badge badge-compliant" role="status">
          <span aria-hidden="true">✓ </span>
          {state.idempotent ? labels.alreadyMatched : fill(labels.changedTo, { status: state.operationalStatus ?? "" })}
          {cascaded && !activating
            ? ` ${fill(labels.cascaded, { items: cascaded.inspection_items, violations: cascaded.violations, penalties: cascaded.penalties })}`
            : ""}
          {activating ? ` ${labels.childrenNotReactivated}` : ""}
        </span>
      ) : null}
    </form>
  );
}

// ---------------------------------------------------------------------------
// CD-005 Impact Footprint Rail row-lite: counts are null when the embedded read
// could not be resolved (unknown ≠ zero), a number when the read verified.
export type RegRowLite = {
  id: string;
  code: string;
  title: string;
  issuing_authority: string | null;
  status: string;
  version_label: string;
  created_at: string | null;
  clauseCount: number | null; // null => unknown (read anomaly), never rendered as zero
  itemCount: number | null;   // null => unknown, never rendered as zero
};

function StatusChip({ status, s }: { status: string; s: RegStrings }) {
  const active = status === "active";
  const scheduled = status === "scheduled";
  const deactivated = status === "deactivated";
  return (
    <span className={`sq-lozenge ${active ? "sq-lozenge--success" : deactivated ? "sq-lozenge--critical" : "sq-lozenge--warning"}`}>
      <span aria-hidden="true">{active ? "●" : deactivated ? "✕" : "◷"}</span> {active ? s.statusPublished : deactivated ? s.statusDeactivated : scheduled ? s.statusDraft : status}
    </span>
  );
}

function ImpactRail({ r, s }: { r: RegRowLite; s: RegStrings }) {
  const clausesUnknown = r.clauseCount === null;
  const noClauses = r.clauseCount === 0;
  const itemsUnknown = r.itemCount === null;
  const noItems = r.itemCount === 0;
  return (
    <div className="panel" style={{ padding: "var(--space-4)", background: "var(--surface-sunken)", marginBlockStart: "var(--space-3)" }}>
      <p className="sq-overline" style={{ margin: 0 }}>{s.railHeading}</p>
      <div className="row" style={{ gap: "var(--space-6)", flexWrap: "wrap", marginBlockStart: "var(--space-2)" }}>
        {/* Regulation */}
        <div className="stack" style={{ gap: "2px", minInlineSize: 140 }}>
          <span className="sq-overline">{s.railRegulation}</span>
          <span className="numeric"><bdi dir="ltr">{r.code}</bdi></span>
        </div>
        {/* Clauses — read verified / unknown / zero (draft with no clause is flagged) */}
        <div className="stack" style={{ gap: "2px", minInlineSize: 180 }}>
          <span className="sq-overline">{s.railClauses}</span>
          {clausesUnknown ? (
            <span className="badge badge-warning"><span aria-hidden="true">⚠</span> {s.railClausesUnknown}</span>
          ) : noClauses ? (
            <span className="t-caption"><span aria-hidden="true">○</span> {s.railClausesZero}</span>
          ) : (
            <span className="t-caption"><span aria-hidden="true">✓</span> <span className="numeric"><bdi dir="ltr">{r.clauseCount}</bdi></span></span>
          )}
          {r.status !== "deactivated" && noClauses ? (
            <span className="t-caption" style={{ color: "var(--status-warning-text)" }}><span aria-hidden="true">⚠</span> {s.invalidNoClauses}</span>
          ) : null}
        </div>
        {/* Mapped items — read verified / unknown / verified-zero */}
        <div className="stack" style={{ gap: "2px", minInlineSize: 180 }}>
          <span className="sq-overline">{s.railItems}</span>
          {itemsUnknown ? (
            <span className="badge badge-warning"><span aria-hidden="true">⚠</span> {s.railItemsUnknown}</span>
          ) : noItems ? (
            <span className="t-caption"><span aria-hidden="true">○</span> {s.railItemsZero}</span>
          ) : (
            <span className="t-caption"><span aria-hidden="true">✓</span> <span className="numeric"><bdi dir="ltr">{r.itemCount}</bdi></span></span>
          )}
        </div>
        {/* Beyond items — list disclosure stays conservative; dossier publication evaluates mappings. */}
        <div className="stack" style={{ gap: "2px", minInlineSize: 180 }}>
          <span className="sq-overline">{s.railBeyond}</span>
          <span className="t-caption"><span aria-hidden="true">⋯</span> {s.railNotEvaluated}</span>
        </div>
      </div>
    </div>
  );
}

// CD-005 register: client-side discovery over the already-loaded set (W01 payload).
// Search + lifecycle filtering never touch the backend — no new read leg is invented.
export function RegulationRegister({ rows, strings: s }: { rows: RegRowLite[]; strings: RegStrings }) {
  const [q, setQ] = useState("");
  const [life, setLife] = useState<"all" | "active" | "scheduled" | "deactivated">("all");

  const counts = useMemo(() => ({
    all: rows.length,
    active: rows.filter(r => r.status === "active").length,
    scheduled: rows.filter(r => r.status === "scheduled").length,
    deactivated: rows.filter(r => r.status === "deactivated").length,
  }), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (life !== "all" && r.status !== life) return false;
      if (!needle) return true;
      return `${r.code} ${r.title} ${r.issuing_authority ?? ""}`.toLowerCase().includes(needle);
    });
  }, [rows, q, life]);

  const chip = (key: "all" | "active" | "scheduled" | "deactivated", label: string, n: number) => (
    <button
      type="button"
      className={`sq-filterchip ${life === key ? "is-active" : ""}`}
      aria-pressed={life === key}
      onClick={() => setLife(key)}
    >
      {fill(label, { n })}
    </button>
  );

  return (
    <div className="stack" style={{ gap: "var(--space-4)" }}>
      <div className="sq-commandbar" role="search">
        <div className="sq-search" style={{ flex: 1, minInlineSize: 220 }}>
          <input
            className="sq-input"
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={s.searchPlaceholder}
            aria-label={s.searchPlaceholder}
          />
        </div>
        <div className="row" role="group" aria-label={s.filterLegend} style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
          {chip("all", s.filterAll, counts.all)}
          {chip("active", s.filterPublished, counts.active)}
          {chip("scheduled", s.filterDraft, counts.scheduled)}
          {chip("deactivated", s.filterDeactivated, counts.deactivated)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<IconSearch size={28} />} title={s.filteredEmptyTitle} body={s.filteredEmptyBody} inline role="status" />
      ) : (
        // Sujatha (INSP): the list read as "too many hyperlinks and arrow
        // elements" — a stack of whole-panel cards, each carrying its own
        // status chip and a separate action link. A table with one Status
        // cell, one Version cell and one View action per row is the target
        // shape (same pattern already used on /compliance). Also fixes a
        // broken link: the old href built /admin/regulations/{id}, a path
        // this file's own routing comment says is never implemented — the
        // real detail mode is this same route with ?id= (CD-006).
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Regulations register</caption>
            <thead><tr>
              <th scope="col">{s.railRegulation}</th>
              <th scope="col">{s.issuingAuthority}</th>
              <th scope="col">Status</th>
              <th scope="col">{s.versionLabel}</th>
              <th scope="col">{s.openDossier}</th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <th scope="row">
                    <strong>{r.title}</strong>
                    <div className="t-caption"><span className="numeric"><bdi dir="ltr">{r.code}</bdi></span></div>
                  </th>
                  <td>{r.issuing_authority || "—"}</td>
                  <td><StatusChip status={r.status} s={s} /></td>
                  <td><span className="badge"><bdi dir="ltr">{r.version_label}</bdi></span></td>
                  <td><a className="sq-link" href={`/admin/regulations?id=${encodeURIComponent(r.id)}`}>{s.openDossier}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
