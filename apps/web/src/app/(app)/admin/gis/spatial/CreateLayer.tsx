"use client";
import { useActionState } from "react";
import { createGisLayer, type GisResult } from "./actions";

export function CreateLayer({ strings: s }: { strings: { key: string; label: string; type: string; create: string; creating: string; created: string } }) {
  const [state, action, pending] = useActionState<GisResult, FormData>(createGisLayer, {});
  return (
    <form action={action} className="panel" style={{ padding: "var(--space-6)", display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor="gis-layer-key">{s.key}</label><input className="ax-input numeric" name="layer_key" id="gis-layer-key" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="gis-layer-label">{s.label}</label><input className="ax-input" name="label" id="gis-layer-label" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="gis-layer-type">{s.type}</label>
        <select className="ax-input" name="layer_type" id="gis-layer-type"><option>overlay</option><option>base</option><option>boundary</option><option>heat</option><option>route</option></select></div>
      <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant">{s.created}</span>}
    </form>
  );
}
