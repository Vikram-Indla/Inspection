"use client";
import { useActionState } from "react";
import { createImmediateVisit, type ImmResult } from "./actions";

type F = { id: string; name: string; factory_code: string; cr_number: string };
type P = { id: string; version_label: string; packages: { code: string } };
type I = { user_id: string; full_name: string };

export default function ImmediateForm({ factories, packages, inspectors }: { factories: F[]; packages: P[]; inspectors: I[] }) {
  const [state, formAction, pending] = useActionState<ImmResult, FormData>(createImmediateVisit, {});
  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>Identity — registered or minimum manual (M01-044/045)</h4>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">Existing factory (optional)</label>
            <select className="ax-select" name="existing_factory_id"><option value="">— none / unregistered</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name} · {f.cr_number}</option>)}</select></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">Or factory name (unregistered)</label>
            <input className="ax-input" name="manual_name" placeholder="As observed / reported — becomes a flagged temporary entity" /></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">Urgency reason *</label>
            <select className="ax-select" name="urgency_reason" required><option value="">— select</option><option>Complaint received</option><option>Incident report</option><option>Authority referral</option></select></div>
        </div>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>Location (mandatory — M01-046) & dispatch</h4>
          <div className="ax-row">
            <div className="ax-field"><label className="ax-field__label">Latitude *</label><input className="ax-input ax-numeric" name="lat" defaultValue="24.7136" required /></div>
            <div className="ax-field"><label className="ax-field__label">Longitude *</label><input className="ax-input ax-numeric" name="lng" defaultValue="46.6753" required /></div>
          </div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">Package *</label>
            <select className="ax-select" name="package_version_id">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">Inspector * (planner-created requires assignment — M01-048)</label>
            <select className="ax-select" name="inspector_id"><option value="">— select</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
        </div>
      </div>
      {state.error && <div className="ax-validation" role="alert"><strong>Cannot create — minimum controls (P01)</strong><ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? "Dispatching…" : "Create & dispatch (Visit ID directly, no plan — M01-050)"}</button>
      </div>
    </form>
  );
}
