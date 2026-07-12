"use client";
import { useActionState, useState } from "react";
import { createImmediateVisit, type ImmResult } from "./actions";

type F = { id: string; name: string; factory_code: string; cr_number: string; license_number: string | null };
type P = { id: string; version_label: string; packages: { code: string } };
type I = { user_id: string; full_name: string };

// SB19 — strings built server-side with t() and passed as props.
export type ImmediateStrings = {
  identity: string; searchLabel: string; searchPlaceholder: string; searchNoMatch: string;
  existingFactory: string; noneUnregistered: string; manualName: string; manualPlaceholder: string;
  manualCr: string; manualLicense: string; manualActivity: string; manualActivityPlaceholder: string;
  urgencyReason: string; selectOption: string;
  reasonComplaint: string; reasonIncident: string; reasonReferral: string;
  locationDispatch: string; latitude: string; longitude: string; packageLabel: string; inspector: string;
  autoAssign: string;
  visitType: string; typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  windowStart: string; windowEnd: string; windowHint: string;
  priority: string; priorityPlaceholder: string; notes: string; notesPlaceholder: string;
  blockedTitle: string; create: string; creating: string;
};

export default function ImmediateForm({ factories, packages, inspectors, strings }: { factories: F[]; packages: P[]; inspectors: I[]; strings: ImmediateStrings }) {
  const [state, formAction, pending] = useActionState<ImmResult, FormData>(createImmediateVisit, {});
  const [query, setQuery] = useState("");
  // CR / Industrial License search over registered factories (M01-044)
  const ql = query.trim().toLowerCase();
  const shown = ql.length >= 2
    ? factories.filter(f => f.cr_number?.toLowerCase().includes(ql) || (f.license_number ?? "").toLowerCase().includes(ql) || f.name.toLowerCase().includes(ql))
    : factories;
  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>{strings.identity}</h4>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.searchLabel}</label>
            <span className="ax-search"><input className="ax-input" placeholder={strings.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} /></span></div>
          {ql.length >= 2 && shown.length === 0 && (
            <div className="ax-banner ax-banner--warning"><div>{strings.searchNoMatch}</div></div>
          )}
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.existingFactory}</label>
            <select className="ax-select" name="existing_factory_id"><option value="">{strings.noneUnregistered}</option>
              {shown.map(f => <option key={f.id} value={f.id}>{f.name} · {f.cr_number}{f.license_number ? ` · ${f.license_number}` : ""}</option>)}</select></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.manualName}</label>
            <input className="ax-input" name="manual_name" placeholder={strings.manualPlaceholder} /></div>
          <div className="ax-row">
            <div className="ax-field"><label className="ax-field__label">{strings.manualCr}</label>
              <input className="ax-input ax-numeric" name="manual_cr" /></div>
            <div className="ax-field"><label className="ax-field__label">{strings.manualLicense}</label>
              <input className="ax-input ax-numeric" name="manual_license" /></div>
          </div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.manualActivity}</label>
            <input className="ax-input" name="manual_activity" placeholder={strings.manualActivityPlaceholder} /></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.urgencyReason}</label>
            <select className="ax-select" name="urgency_reason" required><option value="">{strings.selectOption}</option><option value="Complaint received">{strings.reasonComplaint}</option><option value="Incident report">{strings.reasonIncident}</option><option value="Authority referral">{strings.reasonReferral}</option></select></div>
          {/* M01-047 — visit type is selectable, not hardcoded */}
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.visitType}</label>
            <select className="ax-select" name="visit_type" defaultValue="complaint">
              <option value="complaint">{strings.typeComplaint}</option>
              <option value="follow_up">{strings.typeFollowUp}</option>
              <option value="periodic">{strings.typePeriodic}</option>
            </select></div>
        </div>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>{strings.locationDispatch}</h4>
          <div className="ax-row">
            <div className="ax-field"><label className="ax-field__label">{strings.latitude}</label><input className="ax-input ax-numeric" name="lat" defaultValue="24.7136" required /></div>
            <div className="ax-field"><label className="ax-field__label">{strings.longitude}</label><input className="ax-input ax-numeric" name="lng" defaultValue="46.6753" required /></div>
          </div>
          {/* M01-047 — visit window is enterable; blank keeps the urgent default (now → +8h) */}
          <div className="ax-row">
            <div className="ax-field"><label className="ax-field__label">{strings.windowStart}</label>
              <input className="ax-input ax-numeric" name="window_start" type="datetime-local" /></div>
            <div className="ax-field"><label className="ax-field__label">{strings.windowEnd}</label>
              <input className="ax-input ax-numeric" name="window_end" type="datetime-local" /></div>
          </div>
          <span className="ax-caption">{strings.windowHint}</span>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.priority}</label>
            <input className="ax-input" name="priority" placeholder={strings.priorityPlaceholder} /></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.packageLabel}</label>
            <select className="ax-select" name="package_version_id">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
          {/* M01-048 — auto-assign option (availability-checked) alongside manual pick */}
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.inspector}</label>
            <select className="ax-select" name="inspector_id" defaultValue="auto">
              <option value="auto">{strings.autoAssign}</option>
              {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.notes}</label>
            <textarea className="ax-input" name="notes" rows={2} placeholder={strings.notesPlaceholder} /></div>
        </div>
      </div>
      {state.error && <div className="ax-validation" role="alert"><strong>{strings.blockedTitle}</strong><ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.creating : strings.create}</button>
      </div>
    </form>
  );
}
