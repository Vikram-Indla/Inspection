"use client";
import { useActionState, useId, useState } from "react";
import { createItem, toggleItemActive, type ItemResult } from "./actions";

export type ClauseOption = { id: string; label: string };

// SCR-ADM-020 · ENG-01 — client controls consume server-built strings only (SB19),
// so every user-facing word is resolved through the server t() dictionary (EN+AR).
export type ItemStrings = {
  code: string;
  title: string;
  titlePlaceholder: string;
  clause: string;
  selectClause: string;
  clauseUnavailable: string;
  weight: string;
  responseModel: string;
  responseTriState: string;
  responseBinary: string;
  responseValueDate: string;
  evidenceRule: string;
  evidenceNone: string;
  evidencePhotoNc: string;
  evidenceVideoNc: string;
  evidenceDocumentNc: string;
  evidenceCommentNc: string;
  evidenceSource: string;
  requirementMode: string;
  requirementRequired: string;
  requirementOptional: string;
  requirementConditional: string;
  visibleWhen: string;
  visibleWhenHint: string;
  mandatoryWhenVisible: string;
  scoringEnabled: string;
  scoringDisabled: string;
  guidance: string;
  guidancePlaceholder: string;
  creating: string;
  create: string;
  created: string;
  duplicate: string;
  saving: string;
  deactivate: string;
  reactivate: string;
  reasonNote: string;
  deactivationReason: string;
};

// SCR-ADM-020 · ENG-01 — create item against a clause with governed presets.
// Evidence policy is a governed preset ("configured policy"), never a free per-item
// toggle. When the clause list read is degraded (S08) the clause control renders
// "unavailable" and create is disabled — the catalogue below still renders.
export function NewItemForm({
  clauses,
  clauseUnavailable,
  strings: s,
}: {
  clauses: ClauseOption[];
  clauseUnavailable: boolean;
  strings: ItemStrings;
}) {
  const [state, formAction, pending] = useActionState<ItemResult, FormData>(createItem, {});
  const [requirement, setRequirement] = useState("required");
  const [scoring, setScoring] = useState(true);
  return (
    <form
      action={formAction}
      className="ax-surface"
      style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}
    >
      <div className="ax-field">
        <label className="ax-field__label" htmlFor="item-code">{s.code}</label>
        <input id="item-code" className="ax-input ax-numeric" name="code" placeholder="FS-110" required style={{ maxInlineSize: 120 }} />
      </div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}>
        <label className="ax-field__label" htmlFor="item-title">{s.title}</label>
        <input id="item-title" className="ax-input" name="title" placeholder={s.titlePlaceholder} required />
      </div>
      <div className="ax-field" style={{ minInlineSize: 200 }}>
        <label className="ax-field__label" htmlFor="item-clause">{s.clause}</label>
        <select id="item-clause" className="ax-select" name="clause_id" required defaultValue="" disabled={clauseUnavailable}>
          <option value="" disabled>{clauseUnavailable ? s.clauseUnavailable : s.selectClause}</option>
          {clauses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div className="ax-field">
        <label className="ax-field__label" htmlFor="item-weight">{s.weight}</label>
        <input id="item-weight" className="ax-input ax-numeric" name="score_weight" inputMode="decimal" placeholder="5" style={{ maxInlineSize: 80 }} disabled={!scoring} />
      </div>
      <div className="ax-field" style={{ minInlineSize: 240 }}>
        <label className="ax-field__label" htmlFor="item-response">{s.responseModel}</label>
        <select id="item-response" className="ax-select" name="response_preset" required defaultValue="tri_state">
          <option value="tri_state">{s.responseTriState}</option>
          <option value="binary">{s.responseBinary}</option>
          <option value="value_date">{s.responseValueDate}</option>
        </select>
      </div>
      <div className="ax-field" style={{ minInlineSize: 240 }}>
        <label className="ax-field__label" htmlFor="item-evidence">{s.evidenceRule}</label>
        <select id="item-evidence" className="ax-select" name="evidence_preset" required defaultValue="none">
          <option value="none">{s.evidenceNone}</option>
          <option value="photo_nc_mandatory">{s.evidencePhotoNc}</option>
          <option value="video_nc_mandatory">{s.evidenceVideoNc}</option>
          <option value="document_nc_mandatory">{s.evidenceDocumentNc}</option>
          <option value="comment_nc_mandatory">{s.evidenceCommentNc}</option>
        </select>
        <span className="ax-caption">{s.evidenceSource}</span>
      </div>
      <div className="ax-field" style={{ minInlineSize: 200 }}>
        <label className="ax-field__label" htmlFor="item-requirement">{s.requirementMode}</label>
        <select id="item-requirement" className="ax-select" name="requirement_mode" value={requirement} onChange={e => setRequirement(e.target.value)}>
          <option value="required">{s.requirementRequired}</option>
          <option value="optional">{s.requirementOptional}</option>
          <option value="conditional">{s.requirementConditional}</option>
        </select>
      </div>
      {requirement === "conditional" && <>
        <div className="ax-field" style={{ minInlineSize: 220 }}>
          <label className="ax-field__label" htmlFor="item-visible-when">{s.visibleWhen}</label>
          <input id="item-visible-when" className="ax-input ax-numeric" name="visible_when" placeholder="ITEM-001=compliant" pattern="[A-Za-z0-9_.-]+=[A-Za-z0-9_.-]+" required aria-describedby="item-visible-when-hint" />
          <span id="item-visible-when-hint" className="ax-caption">{s.visibleWhenHint}</span>
        </div>
        <label className="ax-row" style={{ minBlockSize: 44, gap: "var(--ax-space-100)", alignItems: "center" }}>
          <input type="checkbox" name="mandatory_when_visible" value="true" /> {s.mandatoryWhenVisible}
        </label>
      </>}
      <label className="ax-row" style={{ minBlockSize: 44, gap: "var(--ax-space-100)", alignItems: "center" }}>
        <input type="hidden" name="scoring_enabled" value={scoring ? "true" : "false"} />
        <input type="checkbox" checked={scoring} onChange={e => setScoring(e.target.checked)} /> {scoring ? s.scoringEnabled : s.scoringDisabled}
      </label>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}>
        <label className="ax-field__label" htmlFor="item-guidance">{s.guidance}</label>
        <input id="item-guidance" className="ax-input" name="guidance_en" placeholder={s.guidancePlaceholder} />
      </div>
      <button className="ax-btn ax-btn--prominent" disabled={pending || clauseUnavailable}>
        {pending ? s.creating : s.create}
      </button>
      {/* role=alert so screen readers move to the rejection; role=status for success. */}
      {state.error && (
        <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">
          <span aria-hidden="true">✕ </span>{state.error}
        </span>
      )}
      {state.ok && (
        <span className="ax-lozenge ax-lozenge--success" role="status">
          <span aria-hidden="true">✓ </span>{s.created}
        </span>
      )}
    </form>
  );
}

// M09-014 — deactivate/reactivate; history is preserved, never deleted. There is
// NO stored deactivation reason, but the row change IS audited at the DB
// (trg_audit_inspection_items) — the caption states this so the toggle is read as
// an audited, but not reason-captured, mutation.
export function ToggleActive({ itemId, active, strings: s }: { itemId: string; active: boolean; strings: ItemStrings }) {
  const [state, formAction, pending] = useActionState<ItemResult, FormData>(toggleItemActive, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="next_active" value={active ? "false" : "true"} />
      {active ? <label className="ax-field"><span className="ax-field__label">{s.deactivationReason}</span><input className="ax-input" name="deactivation_reason" required /></label> : null}
      <button className="ax-btn" disabled={pending} title={s.reasonNote}>
        {pending ? s.saving : active ? s.deactivate : s.reactivate}
      </button>
      {state.error && (
        <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">
          <span aria-hidden="true">✕ </span>{state.error}
        </span>
      )}
    </form>
  );
}

// SCR-ADM-020 — read-only runtime-preview strip. A pure projection of stored
// configuration: it renders what an inspector will see (response choices, evidence
// policy, guidance, scoring) and authors NOTHING. Conditional logic is display-only.
export type PreviewItem = {
  id: string;
  code: string;
  title: string;
  active: boolean;
  responses: string[];
  ncTarget: string | null;
  evidence: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  requirement: string;
  conditionalRule: string | null;
  mandatoryWhenVisible: boolean;
  scoringEnabled: boolean;
  guidance: string | null;
  scoreWeight: number | null;
  scoreExcludedOn: string[];
};

export type PreviewStrings = {
  select: string;
  empty: string;
  responsesLabel: string;
  evidenceLabel: string;
  evidenceNone: string;
  evidenceRequired: string; // carries {type} and {min}
  evidenceSource: string;
  guidanceLabel: string;
  guidanceNone: string;
  scoringLabel: string;
  weight: string; // carries {weight}
  noWeight: string;
  scoreExcluded: string; // carries {responses}
  ncMaps: string; // carries {target}
  conditional: string;
  required: string;
  optional: string;
  mandatoryVisible: string;
  scoringOff: string;
  readonly: string;
  deactivated: string;
  active: string;
  deactivatedWord: string;
  responseLabels: Record<string, string>;
};

const fill = (tmpl: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), tmpl);

export function ItemPreview({ items, strings: s }: { items: PreviewItem[]; strings: PreviewStrings }) {
  const selectId = useId();
  const [selected, setSelected] = useState(items[0]?.id ?? "");
  if (items.length === 0) {
    return (
      <div className="ax-surface"><div className="ax-state ax-state--inline">
        <span className="ax-state__glyph" aria-hidden="true">👁</span>
        <p className="ax-caption">{s.empty}</p>
      </div></div>
    );
  }
  const item = items.find(i => i.id === selected) ?? items[0];
  const label = (r: string) => s.responseLabels[r] ?? r.replace(/_/g, " ");
  return (
    <div className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-200)" }}>
      <div className="ax-field" style={{ maxInlineSize: 360 }}>
        <label className="ax-field__label" htmlFor={selectId}>{s.select}</label>
        <select id={selectId} className="ax-select" value={item.id} onChange={e => setSelected(e.target.value)}>
          {items.map(i => (
            <option key={i.id} value={i.id}>
              {i.code} — {i.title}{i.active ? "" : ` (${s.deactivatedWord})`}
            </option>
          ))}
        </select>
      </div>

      {/* Read-only runtime projection — disabled controls signal "not an authoring surface". */}
      <div className="ax-panel ax-surface" style={{ padding: "var(--ax-space-250)", background: "var(--ax-color-surface-sunken)" }}>
        <div className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center", flexWrap: "wrap" }}>
          <strong className="ax-numeric"><bdi dir="ltr">{item.code}</bdi></strong>
          <span>{item.title}</span>
          <span className={`ax-lozenge ${item.active ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
            <span aria-hidden="true">{item.active ? "●" : "✕"} </span>{item.active ? s.active : s.deactivatedWord}
          </span>
        </div>
        {!item.active && <p className="ax-caption">{s.deactivated}</p>}

        <div className="ax-stack" style={{ gap: "var(--ax-space-150)", marginBlockStart: "var(--ax-space-150)" }}>
          <div>
            <p className="ax-overline">{s.responsesLabel}</p>
            <div className="ax-row" role="group" aria-label={s.responsesLabel} style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
              {item.responses.map(r => (
                <button key={r} type="button" className="ax-btn ax-btn--secondary" disabled aria-disabled="true">{label(r)}</button>
              ))}
            </div>
            {item.ncTarget && <p className="ax-caption">{fill(s.ncMaps, { target: item.ncTarget })}</p>}
            <p className="ax-caption"><span aria-hidden="true">◇ </span>{item.requirement === "optional" ? s.optional : item.requirement === "conditional" ? s.conditional : s.required}</p>
            {item.conditionalRule && <p className="ax-caption"><bdi dir="ltr" className="ax-numeric">{item.conditionalRule}</bdi>{item.mandatoryWhenVisible ? ` · ${s.mandatoryVisible}` : ""}</p>}
          </div>

          <div>
            <p className="ax-overline">{s.evidenceLabel}</p>
            <p className="ax-caption">
              {item.evidence?.mandatory
                ? fill(s.evidenceRequired, { type: item.evidence.type ?? "evidence", min: item.evidence.min ?? 1 })
                : s.evidenceNone}
            </p>
            <p className="ax-caption"><em>{s.evidenceSource}</em></p>
          </div>

          <div>
            <p className="ax-overline">{s.scoringLabel}</p>
            <p className="ax-caption">
              {!item.scoringEnabled ? s.scoringOff : item.scoreWeight != null ? fill(s.weight, { weight: item.scoreWeight }) : s.noWeight}
              {item.scoreExcludedOn.length > 0 &&
                ` · ${fill(s.scoreExcluded, { responses: item.scoreExcludedOn.map(label).join(", ") })}`}
            </p>
          </div>

          <div>
            <p className="ax-overline">{s.guidanceLabel}</p>
            <p className="ax-caption">{item.guidance || s.guidanceNone}</p>
          </div>
        </div>
      </div>
      <p className="ax-caption"><span aria-hidden="true">🔒 </span>{s.readonly}</p>
    </div>
  );
}
