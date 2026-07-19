"use client";
import { useActionState } from "react";
import { createGisLayer, type GisResult } from "./actions";

export function CreateLayer({ strings: s }: { strings: { key: string; label: string; type: string; create: string; creating: string; created: string } }) {
  const [state, action, pending] = useActionState<GisResult, FormData>(createGisLayer, {});
  return (
    <form action={action} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor="gis-layer-key">{s.key}</label><input className="ax-input ax-numeric" name="layer_key" id="gis-layer-key" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="gis-layer-label">{s.label}</label><input className="ax-input" name="label" id="gis-layer-label" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="gis-layer-type">{s.type}</label>
        <select className="ax-input" name="layer_type" id="gis-layer-type"><option>overlay</option><option>base</option><option>boundary</option><option>heat</option><option>route</option></select></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
    </form>
  );
}
