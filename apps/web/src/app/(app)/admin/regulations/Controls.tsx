"use client";
import { useActionState, useMemo, useState } from "react";
import {
  addClause,
  addRegulationAttachment,
  createRegulation,
  deactivateRegulation,
  publishRegulation,
  updateRegulationDraft,
  type RegResult,
} from "./actions";
import EmptyState from "@/components/EmptyState";
import { IconSearch } from "@/app/icons";

// SCR-ADM-010 (CD-005) + SCR-ADM-011 (CD-006) — client controls consume
// server-built strings only (SB19). Colour comes exclusively from ax tokens/classes;
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

// ---------------------------------------------------------------------------
// Proven action W06/create — create draft regulation (regulations insert, audited)
export function NewRegulationForm({ strings: s }: { strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(createRegulation, {});
  return (
    <form action={formAction} className="panel" style={{ padding: "var(--space-6)", display: "flex", gap: "var(--space-4)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="sq-field"><label className="sq-field__label" htmlFor="reg-code">{s.code}</label>
        <input id="reg-code" className="sq-input numeric" name="code" placeholder="SBC-501" required /></div>
      <div className="sq-field" style={{ flex: 1, minInlineSize: 220 }}><label className="sq-field__label" htmlFor="reg-title">{s.title}</label>
        <input id="reg-title" className="sq-input" name="title" placeholder={s.titlePlaceholder} required /></div>
      <div className="sq-field" style={{ flex: 1, minInlineSize: 220 }}><label className="sq-field__label" htmlFor="reg-auth">{s.issuingAuthority}</label>
        <input id="reg-auth" className="sq-input" name="issuing_authority" /></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="reg-effective">{s.effectiveFrom}</label>
        <input id="reg-effective" className="sq-input numeric" type="date" name="effective_from" required /></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="reg-version">{s.versionLabel}</label>
        <input id="reg-version" className="sq-input numeric" name="version_label" defaultValue="v1" required /></div>
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓</span> {s.created}</span>}
    </form>
  );
}

// Proven action W02/add-clause — clause insert (accepts legal_source). Audit-tracked
// at the DB (trg_audit_regulation_clauses → audit_events).
export function AddClauseForm({ regulationId, strings: s }: { regulationId: string; strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(addClause, {});
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-4)" }}>
      <div className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <input type="hidden" name="regulation_id" value={regulationId} />
        <div className="sq-field"><label className="sq-field__label" htmlFor={`cl-ref-${regulationId}`}>{s.clauseRef}</label>
          <input id={`cl-ref-${regulationId}`} className="sq-input numeric" name="clause_ref" placeholder="4.2" required style={{ maxInlineSize: 100 }} /></div>
        <div className="sq-field" style={{ flex: 1, minInlineSize: 200 }}><label className="sq-field__label" htmlFor={`cl-title-${regulationId}`}>{s.title}</label>
          <input id={`cl-title-${regulationId}`} className="sq-input" name="title" required /></div>
        <div className="sq-field" style={{ flex: 1, minInlineSize: 180 }}><label className="sq-field__label" htmlFor={`cl-src-${regulationId}`}>{s.legalSource}</label>
          <input id={`cl-src-${regulationId}`} className="sq-input" name="legal_source" placeholder={s.legalSourcePlaceholder} /></div>
        <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.adding : s.addClause}</button>
        {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
        {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓</span> {s.added}</span>}
      </div>
      <p className="t-caption" style={{ margin: 0 }}><span aria-hidden="true">ⓘ</span> {s.clauseNotAudited}</p>
    </form>
  );
}

// Governed publish validates clause mappings in the server action, records the checker,
// and relies on the DB for maker-checker and post-publication immutability.
export function PublishRegulation({ regulationId, strings: s }: { regulationId: string; strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(publishRegulation, {});
  return (
    <form action={formAction} className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
      <input type="hidden" name="regulation_id" value={regulationId} />
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? s.publishing : s.publish}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
    </form>
  );
}

export function EditRegulationDraft({ regulation, strings: s }: {
  regulation: { id: string; title: string; issuingAuthority: string | null; effectiveFrom: string | null };
  strings: RegStrings;
}) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(updateRegulationDraft, {});
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-3)" }} aria-label={s.saveDraft}>
      <input type="hidden" name="regulation_id" value={regulation.id} />
      <div className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="sq-field" style={{ flex: 1, minInlineSize: 220 }}><label className="sq-field__label" htmlFor={`reg-edit-title-${regulation.id}`}>{s.title}</label>
          <input id={`reg-edit-title-${regulation.id}`} className="sq-input" name="title" defaultValue={regulation.title} required /></div>
        <div className="sq-field" style={{ flex: 1, minInlineSize: 220 }}><label className="sq-field__label" htmlFor={`reg-edit-auth-${regulation.id}`}>{s.issuingAuthority}</label>
          <input id={`reg-edit-auth-${regulation.id}`} className="sq-input" name="issuing_authority" defaultValue={regulation.issuingAuthority ?? ""} /></div>
        <div className="sq-field"><label className="sq-field__label" htmlFor={`reg-edit-effective-${regulation.id}`}>{s.effectiveFrom}</label>
          <input id={`reg-edit-effective-${regulation.id}`} className="sq-input numeric" type="date" name="effective_from" defaultValue={regulation.effectiveFrom?.slice(0, 10) ?? ""} /></div>
        <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.savingDraft : s.saveDraft}</button>
      </div>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert"><span aria-hidden="true">✕ </span>{state.error}</span>}
      {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓ </span>{s.draftSaved}</span>}
    </form>
  );
}

export function AddRegulationAttachment({ regulationId, strings: s }: { regulationId: string; strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(addRegulationAttachment, {});
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-3)" }} aria-label={s.addAttachment}>
      <input type="hidden" name="regulation_id" value={regulationId} />
      <div className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="sq-field" style={{ flex: 1, minInlineSize: 260 }}><label className="sq-field__label" htmlFor={`att-file-${regulationId}`}>{s.attachmentName}</label><input id={`att-file-${regulationId}`} className="sq-input" type="file" name="file" required /></div>
        <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.addingAttachment : s.addAttachment}</button>
      </div>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert"><span aria-hidden="true">✕ </span>{state.error}</span>}
      {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓ </span>{s.attachmentAdded}</span>}
    </form>
  );
}

export function DeactivateRegulation({ regulationId, strings: s }: { regulationId: string; strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(deactivateRegulation, {});
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-2)", alignItems: "flex-start" }}>
      <input type="hidden" name="regulation_id" value={regulationId} />
      <label className="sq-field"><span className="sq-field__label">{s.deactivationReason}</span><textarea className="sq-input" name="deactivation_reason" required /></label>
      <button className="btn btn-ghost btn-touch" disabled={pending}>{pending ? s.deactivating : s.deactivate}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert"><span aria-hidden="true">✕ </span>{state.error}</span>}
      {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓ </span>{s.deactivated}</span>}
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
  created_at: string | null;
  clauseCount: number | null; // null => unknown (read anomaly), never rendered as zero
  itemCount: number | null;   // null => unknown, never rendered as zero
};

function StatusChip({ status, s }: { status: string; s: RegStrings }) {
  const published = status === "published";
  const deactivated = status === "deactivated";
  return (
    <span className={`sq-lozenge ${published ? "sq-lozenge--success" : deactivated ? "sq-lozenge--critical" : "sq-lozenge--warning"}`}>
      <span aria-hidden="true">{published ? "●" : deactivated ? "✕" : "◌"}</span> {published ? s.statusPublished : deactivated ? s.statusDeactivated : s.statusDraft}
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
          {r.status === "draft" && noClauses ? (
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
  const [life, setLife] = useState<"all" | "published" | "draft" | "deactivated">("all");

  const counts = useMemo(() => ({
    all: rows.length,
    published: rows.filter(r => r.status === "published").length,
    draft: rows.filter(r => r.status === "draft").length,
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

  const chip = (key: "all" | "published" | "draft" | "deactivated", label: string, n: number) => (
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
          {chip("published", s.filterPublished, counts.published)}
          {chip("draft", s.filterDraft, counts.draft)}
          {chip("deactivated", s.filterDeactivated, counts.deactivated)}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<IconSearch size={28} />} title={s.filteredEmptyTitle} body={s.filteredEmptyBody} inline role="status" />
      ) : (
        <ul className="stack" style={{ gap: "var(--space-4)", listStyle: "none", margin: 0, padding: 0 }}>
          {filtered.map(r => (
            <li key={r.id} className="panel" style={{ padding: "var(--space-6)" }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: "var(--space-1)" }}>
                  <h3 style={{ margin: 0 }}><span className="numeric"><bdi dir="ltr">{r.code}</bdi></span> — {r.title}</h3>
                  <p className="t-caption" style={{ margin: 0 }}>
                    {r.issuing_authority || "—"}
                    {r.created_at ? <> · {s.createdAtLabel} <bdi dir="ltr" className="numeric">{r.created_at.slice(0, 10)}</bdi></> : null}
                  </p>
                </div>
                <div className="row" style={{ gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <StatusChip status={r.status} s={s} />
                  {/* Logical detail mode — same route, ?id= query param (CD-006). */}
                  <a className="btn btn-secondary sq-link btn-touch" href={`/admin/regulations/${encodeURIComponent(r.id)}`}>
                    {s.openDossier}
                  </a>
                </div>
              </div>
              <ImpactRail r={r} s={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
