import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Factory360({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: f } = await sb.from("factories")
    .select(`id, factory_code, name, cr_number, license_number, region, city, activity_class,
      official_lat, official_lng, source, source_synced_at, risk_score, risk_band, risk_version,
      visits(id, visit_type, planning_status, operational_state, window_start,
        inspections(id, status, submission_versions(version_number),
          violations(mapping_version, violation_codes(code, title, level)),
          action_forms(status, owner_name, due_at),
          reviews(decision, status)))`)
    .eq("id", id).single();
  if (!f) return <Shell current="/factories" title="Factory not found"><div /></Shell>;
  const visits = f.visits as unknown as {
    id: string; visit_type: string; planning_status: string; operational_state: string; window_start: string;
    inspections: { id: string; status: string; submission_versions: { version_number: number }[];
      violations: { mapping_version: string; violation_codes: { code: string; title: string; level: string } }[];
      action_forms: { status: string; owner_name: string; due_at: string }[];
      reviews: { decision: string | null; status: string }[] }[];
  }[];
  const bandTone = f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success";
  return (
    <Shell current="/factories" title={`${f.name} — ${f.factory_code}`}
      context={<>
        <span className={`ax-lozenge ${bandTone}`}>{f.risk_band} · {f.risk_score}</span>
        <span className="ax-freshness">source {f.source} · synced {f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</span>
      </>}>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Identity — read-only from source (M07-002)</h4>
          <p>CR <span className="ax-numeric">{f.cr_number}</span> · license <span className="ax-numeric">{f.license_number}</span> · {f.activity_class}</p>
          <p>{f.region} · {f.city} · official <span className="ax-numeric">{f.official_lat}, {f.official_lng}</span> (GIS-Admin-owned, FND-007)</p>
        </div>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Risk — reproducible (EV-004)</h4>
          <p>Score <strong className="ax-numeric">{f.risk_score}</strong> · band <strong>{f.risk_band}</strong> · <span className="ax-version">{f.risk_version}</span></p>
          <p className="ax-caption">Recomputable from stored inputs + this version; drivers per engine_settings.risk.</p>
        </div>
      </div>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Inspection history — official records only (M07-011/012)</h4>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>Visit</th><th className="ax-td-num">Window</th><th>Status</th><th>Versions</th><th>Violations</th><th>Actions</th><th>Outcome</th></tr></thead>
          <tbody>
            {visits.map(v => {
              const ins = v.inspections[0];
              return (
                <tr key={v.id}>
                  <td><a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a> <span className="ax-caption">{v.visit_type}</span></td>
                  <td className="ax-td-num ax-numeric">{new Date(v.window_start).toISOString().slice(0, 10)}</td>
                  <td><span className="ax-lozenge ax-lozenge--review ax-lozenge--info">{ins?.status ?? v.planning_status}</span></td>
                  <td>{ins?.submission_versions.map(s => <span key={s.version_number} className="ax-version" style={{ marginInlineEnd: 4 }}>v{s.version_number}</span>)}</td>
                  <td>{ins?.violations.map(x => <span key={x.violation_codes.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.violation_codes.code}</span>)}</td>
                  <td className="ax-caption">{ins?.action_forms.map(a => `${a.status} · ${a.owner_name} · due ${new Date(a.due_at).toISOString().slice(0, 10)}`).join("; ")}</td>
                  <td>{ins?.reviews.filter(r => r.decision).map((r, i) => <span key={i} className={`ax-lozenge ${r.decision === "approve" ? "ax-lozenge--success" : "ax-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>{r.decision}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </Shell>
  );
}
