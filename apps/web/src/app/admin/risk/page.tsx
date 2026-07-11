import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { saveRiskSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function RiskStudio() {
  const sb = await supabaseServer();
  const { data } = await sb.from("engine_settings").select("settings, version_label, updated_at").eq("engine", "risk").single();
  const s = data?.settings as { factors: { key: string; weight: number }[]; bands: Record<string, number[]> };
  return (
    <Shell current="/admin" title="Risk Engine configuration"
      context={<><span className="ax-lozenge ax-lozenge--info">SCR-ADM-060 · ENG-04</span><span className="ax-version">{data?.version_label}</span></>}>
      <div className="ax-banner"><div><strong>This is the Risk Studio (MVP1 foundation scope).</strong> Weights and bands are live configuration in <code>engine_settings</code> — scores must be reproducible from stored inputs + this version (EV-004). Writes require the risk_owner role; RLS rejects everyone else. Every save lands in the immutable audit trail.</div></div>
      <form action={saveRiskSettings as unknown as (formData: FormData) => void} className="ax-surface" style={{ padding: "var(--ax-space-400)", display: "flex", flexDirection: "column", gap: "var(--ax-space-300)", maxInlineSize: 720 }}>
        <h4>Factors & weights (must sum to 1.00)</h4>
        {(s?.factors ?? []).map(f => (
          <div key={f.key} className="ax-row" style={{ justifyContent: "space-between" }}>
            <label className="ax-field__label" htmlFor={f.key}>{f.key.replace(/_/g, " ")}</label>
            <input className="ax-input ax-numeric" id={f.key} name={f.key} type="number" step="0.05" min="0" max="1" defaultValue={f.weight} style={{ maxInlineSize: 110 }} />
          </div>
        ))}
        <h4>Bands</h4>
        <div className="ax-row">
          <div className="ax-field"><label className="ax-field__label" htmlFor="low_max">Low ends at</label>
            <input className="ax-input ax-numeric" id="low_max" name="low_max" type="number" defaultValue={s?.bands?.low?.[1] ?? 39} /></div>
          <div className="ax-field"><label className="ax-field__label" htmlFor="med_max">Medium ends at</label>
            <input className="ax-input ax-numeric" id="med_max" name="med_max" type="number" defaultValue={s?.bands?.medium?.[1] ?? 69} /></div>
          <div className="ax-field"><label className="ax-field__label">High</label>
            <input className="ax-input" value={`${(s?.bands?.medium?.[1] ?? 69) + 1}–100`} readOnly /></div>
        </div>
        <div className="ax-row" style={{ justifyContent: "space-between" }}>
          <p className="ax-caption ax-numeric">last updated {data ? new Date(data.updated_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</p>
          <button className="ax-btn">Save configuration (risk_owner only)</button>
        </div>
      </form>
    </Shell>
  );
}
