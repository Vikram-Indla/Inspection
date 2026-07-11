"use client";
import { useActionState } from "react";
import { publishBulkPlan, type BulkResult } from "./actions";

type F = { id: string; factory_code: string; name: string; cr_number: string; city: string; risk_band: string | null; risk_score: number | null; visits: { planning_status: string; visit_type: string }[] };
type P = { id: string; version_label: string; packages: { code: string } };

export default function BulkForm({ factories, packages }: { factories: F[]; packages: P[] }) {
  const [state, formAction, pending] = useActionState<BulkResult, FormData>(publishBulkPlan, {});
  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th style={{ inlineSize: 36 }}></th><th>Factory</th><th>CR</th><th>City</th><th className="ax-td-num">Risk</th><th>Eligibility</th></tr></thead>
        <tbody>
          {factories.map(f => {
            const dup = f.visits.some(v => ["draft", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");
            return (
              <tr key={f.id}>
                <td><input type="checkbox" name="factory_id" value={f.id} disabled={dup} aria-label={`select ${f.name}`} /></td>
                <td><strong>{f.name}</strong> <span className="ax-caption">{f.factory_code}</span></td>
                <td className="ax-numeric">{f.cr_number}</td><td>{f.city}</td>
                <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{f.risk_band} · {f.risk_score}</span></td>
                <td>{dup ? <span className="ax-lozenge ax-lozenge--critical">duplicate — active visit (M02-012)</span> : <span className="ax-lozenge ax-lozenge--success">eligible</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--ax-space-200)" }}>
        <div className="ax-field"><label className="ax-field__label">Visit type (shared — M01-006)</label>
          <select className="ax-select" name="visit_type"><option value="periodic">Periodic compliance</option></select></div>
        <div className="ax-field"><label className="ax-field__label">Package</label>
          <select className="ax-select" name="package_version_id">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
        <div className="ax-field"><label className="ax-field__label">Window start</label><input className="ax-input ax-numeric" name="window_start" type="datetime-local" required /></div>
        <div className="ax-field"><label className="ax-field__label">Window end</label><input className="ax-input ax-numeric" name="window_end" type="datetime-local" required /></div>
      </div>
      {state.error && <div className="ax-validation" role="alert"><strong>Publish blocked (all-or-nothing — P03)</strong><ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? "Publishing…" : "Publish plan — every visit gets its own ID sharing the plan ID (M01-002)"}</button>
      </div>
    </form>
  );
}
