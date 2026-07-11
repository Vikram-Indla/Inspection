import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Operations() {
  const sb = await supabaseServer();
  const [{ data: visits }, { data: geo }, { data: actions }, { data: notifs }] = await Promise.all([
    sb.from("visits").select("id, operational_state, planning_status, factories(name), assignments(profiles(full_name))").eq("planning_status", "published"),
    sb.from("geo_events").select("kind, geofence_result, accuracy_m, occurred_at, visit_id").order("occurred_at", { ascending: false }).limit(10),
    sb.from("action_forms").select("owner_name, due_at, status, inspections(visits(factories(name)))").eq("status", "open"),
    sb.from("notifications").select("event_key, created_at, delivery_state").order("created_at", { ascending: false }).limit(8),
  ]);
  const states = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted"] as const;
  const counts = Object.fromEntries(states.map(s => [s, (visits ?? []).filter(v => v.operational_state === s).length]));
  return (
    <Shell current="/operations" title="Operations Center"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-500 · operational state ≠ workflow status (FND-002)</span>}>
      <div className="ax-kpi-row">
        {states.map(s => (
          <div key={s} className="ax-surface ax-kpi"><span className="ax-overline">{s.replace(/_/g, " ")}</span>
            <span className="ax-kpi__value ax-numeric">{counts[s]}</span></div>
        ))}
      </div>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Live visit monitoring (M08-003)</h4>
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr><th>Visit</th><th>Factory</th><th>Operational</th><th>Inspector</th></tr></thead>
            <tbody>{(visits ?? []).map(v => (
              <tr key={v.id}>
                <td><a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></td>
                <td>{(v.factories as unknown as { name: string }).name}</td>
                <td><span className={`ax-lozenge ax-lozenge--ops ${v.operational_state === "executing" ? "ax-lozenge--success" : ""}`}>{v.operational_state.replace(/_/g, " ")}</span></td>
                <td>{((v.assignments as unknown as { profiles: { full_name: string } }[])[0])?.profiles?.full_name ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
        <div className="ax-stack">
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Location events — immutable tracking history (M08-014)</h4>
            <ul className="ax-timeline">{(geo ?? []).map((g, i) => (
              <li key={i} className={g.kind === "checkin" ? "is-key" : undefined}>
                <div><strong>{g.kind}</strong> ±{g.accuracy_m}m {g.geofence_result && <span className={`ax-lozenge ${g.geofence_result === "inside" ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{g.geofence_result}</span>}<br />
                  <span className="ax-timeline__meta ax-numeric">{new Date(g.occurred_at).toISOString().slice(0, 19).replace("T", " ")}</span></div>
              </li>
            ))}</ul>
          </div>
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Open corrective actions · notifications (ENG-11)</h4>
            {(actions ?? []).map((a, i) => (
              <p key={i} className="ax-caption">⏳ {(a.inspections as unknown as { visits: { factories: { name: string } } }).visits.factories.name} — {a.owner_name}, due <span className="ax-numeric">{new Date(a.due_at).toISOString().slice(0, 10)}</span></p>
            ))}
            {(notifs ?? []).map((n, i) => (
              <p key={i} className="ax-caption">🔔 {n.event_key} · {n.delivery_state} · <span className="ax-numeric">{new Date(n.created_at).toISOString().slice(11, 16)}</span></p>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
