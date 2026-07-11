import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function GisStudio() {
  const sb = await supabaseServer();
  const { data } = await sb.from("engine_settings").select("settings, version_label").eq("engine", "gis").single();
  const s = data?.settings as Record<string, unknown>;
  const rows: [string, string, string][] = [
    ["GPS accuracy for check-in", `≤ ${String(s?.gps_accuracy_checkin_max_m)} m`, "ERR-GEO-001 threshold"],
    ["Arrival detection radius", `${String(s?.arrival_detection_radius_m)} m`, "STM-JRN-002"],
    ["Geofence default radius", `${String(s?.geofence_default_radius_m)} m (per-factory polygon override)`, "STM-JRN-003"],
    ["Telemetry interval", `${String(s?.telemetry_interval_s)} s`, "ENG-06"],
    ["Route deviation alert", JSON.stringify(s?.route_deviation), "SB14 step 5"],
    ["Retention", JSON.stringify(s?.retention), "FND-009 policy"],
  ];
  return (
    <Shell current="/admin" title="GIS & Geofence configuration"
      context={<><span className="ax-lozenge ax-lozenge--info">SCR-ADM-070 · ENG-06</span><span className="ax-version">{data?.version_label}</span></>}>
      <div className="ax-banner"><div><strong>GIS Studio.</strong> These governed values stamp every geo event (config version recorded with each check-in — EV-005). Official coordinates remain GIS-Admin-owned; field observation never overwrites them (FND-007).</div></div>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>Setting</th><th>Value</th><th>Contract</th></tr></thead>
        <tbody>{rows.map(([k, v, c]) => <tr key={k}><td><strong>{k}</strong></td><td className="ax-numeric">{v}</td><td className="ax-caption">{c}</td></tr>)}</tbody>
      </table></div>
    </Shell>
  );
}
