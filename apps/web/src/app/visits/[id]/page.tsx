import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import ActionBar from "./ActionBar";

export const dynamic = "force-dynamic";

export default async function VisitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: inspRows } = await sb.from("user_roles").select("user_id, profiles(full_name)").eq("role_key", "inspector");
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const { data: v } = await sb.from("visits")
    .select(`id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, cancellation_reason,
      factories(id, factory_code, name, cr_number, official_lat, official_lng, risk_band),
      package_versions(version_label, packages(code)),
      assignments(method, status, profiles(full_name)),
      journey_sessions(id, started_at, geo_events(kind, accuracy_m, geofence_result, gis_version, occurred_at)),
      inspections(id, status, submission_versions(version_number, submitted_at), reviews(decision, status, returned_sections))`)
    .eq("id", id).single();
  if (!v) return <Shell current="/visits" title="Visit not found"><div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">∅</span><h4>Not in your scope or does not exist</h4><p className="ax-caption">IDs are immutable, never reused (FLD-VIS-001).</p></div></div></Shell>;
  const f = v.factories as unknown as { id: string; factory_code: string; name: string; cr_number: string; risk_band: string };
  const pkg = v.package_versions as unknown as { version_label: string; packages: { code: string } } | null;
  const asg = (v.assignments as unknown as { method: string; status: string; profiles: { full_name: string } }[])[0];
  const journeys = v.journey_sessions as unknown as { id: string; started_at: string; geo_events: { kind: string; accuracy_m: number; geofence_result: string | null; gis_version: string; occurred_at: string }[] }[];
  const insp = (v.inspections as unknown as { id: string; status: string; submission_versions: { version_number: number; submitted_at: string }[]; reviews: { decision: string | null; status: string; returned_sections: string[] | null }[] }[])[0];
  return (
    <Shell current="/visits" title={`Visit ${v.id.slice(0, 8)} — ${f.name}`}
      context={<>
        <span className="ax-lozenge ax-lozenge--plan ax-lozenge--info">{v.planning_status}</span>
        <span className="ax-lozenge ax-lozenge--ops">{v.operational_state.replace(/_/g, " ")}</span>
        {pkg && <span className="ax-version">{pkg.packages.code} · {pkg.version_label}</span>}
      </>}>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Configuration</h4>
          <p>{v.visit_type} · {v.execution_mode} · window <span className="ax-numeric">{new Date(v.window_start).toISOString().slice(0, 16).replace("T", " ")} → {new Date(v.window_end).toISOString().slice(5, 16).replace("T", " ")}</span></p>
          <p style={{ marginBlockStart: 8 }}>Assignment: <strong>{asg?.profiles?.full_name ?? "—"}</strong> ({asg?.method}) · <a className="ax-link" href={`/factories/${f.id}`}>Factory 360 →</a></p>
        </div>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Inspection & versions</h4>
          {insp ? (
            <div className="ax-stack" style={{ gap: 8 }}>
              <span className="ax-lozenge ax-lozenge--review ax-lozenge--info">{insp.status}</span>
              {insp.submission_versions.sort((a, b) => a.version_number - b.version_number).map(s => (
                <p key={s.version_number} className="ax-numeric"><span className="ax-version">v{s.version_number}</span> {new Date(s.submitted_at).toISOString().slice(0, 16).replace("T", " ")} · immutable</p>
              ))}
              {insp.reviews.map((r, i) => (
                <p key={i} className="ax-caption">review: {r.decision ?? r.status}{r.returned_sections ? ` · returned ${r.returned_sections.join(",")}` : ""}</p>
              ))}
            </div>
          ) : <p className="ax-caption">Not started.</p>}
        </div>
      </div>
      <ActionBar visitId={v.id} status={v.planning_status} inspectors={inspectors} />
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Journey & location events — immutable (EV-005)</h4>
        <ul className="ax-timeline">
          {journeys.flatMap(j => j.geo_events.map(g => (
            <li key={g.occurred_at} className={g.kind === "checkin" ? "is-key" : undefined}>
              <div><strong>{g.kind}</strong> · ±{g.accuracy_m} m {g.geofence_result && <span className="ax-lozenge ax-lozenge--success">{g.geofence_result}</span>}<br />
                <span className="ax-timeline__meta ax-numeric">{new Date(g.occurred_at).toISOString().slice(0, 19).replace("T", " ")} · gis {g.gis_version}</span></div>
            </li>
          )))}
          {journeys.length === 0 && <p className="ax-caption">No journey yet.</p>}
        </ul>
      </div>
    </Shell>
  );
}
