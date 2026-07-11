"use client";
import { useActionState, useState } from "react";
import { publishSingleVisit, type PublishResult } from "./actions";

type Factory = { id: string; factory_code: string; name: string; cr_number: string; region: string; city: string; risk_band: string | null; risk_score: number | null };
type Pkg = { id: string; version_label: string; packages: { code: string; title: string } };
type Insp = { user_id: string; full_name: string };

export default function Wizard({ factories, packages, inspectors }: { factories: Factory[]; packages: Pkg[]; inspectors: Insp[] }) {
  const [state, formAction, pending] = useActionState<PublishResult, FormData>(publishSingleVisit, {});
  const [query, setQuery] = useState("");
  const [factory, setFactory] = useState<Factory | null>(null);
  const matches = query.length >= 3 ? factories.filter(f => f.cr_number?.includes(query) || f.factory_code.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>1 · Find factory — CR or code only (M01-035)</h4>
        <span className="ax-search"><input className="ax-input" placeholder="CR number or factory code" value={query} onChange={e => setQuery(e.target.value)} /></span>
        {query.length >= 3 && matches.length === 0 && (
          <div className="ax-banner ax-banner--warning" style={{ marginBlockStart: "var(--ax-space-150)" }}><div>No factory matches — check the number, or create an Immediate Visit (M01-045).</div></div>
        )}
        {matches.map(f => (
          <label key={f.id} className="ax-choice" style={{ display: "flex", marginBlockStart: "var(--ax-space-100)" }}>
            <input type="radio" name="factory_id" value={f.id} checked={factory?.id === f.id} onChange={() => setFactory(f)} />
            <span><strong>{f.name}</strong> · {f.factory_code} · CR {f.cr_number} · {f.city}
              {f.risk_band && <span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`} style={{ marginInlineStart: 8 }}>{f.risk_band} · {f.risk_score}</span>}
            </span>
          </label>
        ))}
      </div>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--ax-space-200)" }}>
        <div className="ax-field"><label className="ax-field__label">Visit type</label>
          <select className="ax-select" name="visit_type"><option value="periodic">Periodic compliance</option><option value="follow_up">Follow-up</option><option value="complaint">Complaint-triggered</option></select></div>
        <div className="ax-field"><label className="ax-field__label">Package (published only)</label>
          <select className="ax-select" name="package_version_id">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
        <div className="ax-field"><label className="ax-field__label">Mode</label>
          <select className="ax-select" name="execution_mode"><option value="physical">Physical</option><option value="virtual">Virtual</option></select></div>
        <div className="ax-field"><label className="ax-field__label">Window start</label><input className="ax-input ax-numeric" name="window_start" type="datetime-local" required /></div>
        <div className="ax-field"><label className="ax-field__label">Window end</label><input className="ax-input ax-numeric" name="window_end" type="datetime-local" required /></div>
        <div className="ax-field"><label className="ax-field__label">Inspector (M01-040)</label>
          <select className="ax-select" name="inspector_id"><option value="">— select</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
      </div>
      {state.error && (
        <div className="ax-validation" role="alert"><strong>Publishing blocked — work preserved (M01-041)</strong>
          <ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>
      )}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? "Publishing…" : "Publish visit (one plan · one visit — M01-042)"}</button>
      </div>
    </form>
  );
}
