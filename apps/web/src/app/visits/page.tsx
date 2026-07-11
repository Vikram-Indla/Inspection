import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PLAN_TONE: Record<string, string> = { published: "ax-lozenge--info", returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical" };

export default async function Visits() {
  const sb = await supabaseServer();
  const { data: visits } = await sb.from("visits")
    .select("id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, factories(name, factory_code)")
    .order("window_start", { ascending: true }).limit(50);
  const counts: Record<string, number> = {};
  for (const v of visits ?? []) counts[v.planning_status] = (counts[v.planning_status] ?? 0) + 1;
  return (
    <Shell current="/visits" title="Visit management"
      context={<span className="ax-lozenge ax-lozenge--info">planning statuses only — M02-002</span>}>
      <div className="ax-kpi-row">
        {["draft", "published", "returned", "cancelled", "expired"].map(s => (
          <div key={s} className="ax-surface ax-kpi">
            <span className="ax-overline">{s}</span>
            <span className="ax-kpi__value ax-numeric">{counts[s] ?? 0}</span>
          </div>
        ))}
      </div>
      {(visits ?? []).length === 0 ? (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🗓</span><h4>No visits in your scope</h4>
          <p className="ax-caption">Only visits inside your organizational scope are shown (M02-001 · RLS-enforced, not filtered client-side).</p>
          <a className="ax-btn" href="/planning">Create a plan</a>
        </div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>Visit</th><th>Factory</th><th>Type · mode</th><th>Planning status</th><th>Operational</th><th className="ax-td-num">Window</th></tr></thead>
          <tbody>
            {(visits ?? []).map(v => (
              <tr key={v.id}>
                <td className="ax-numeric"><strong>{v.id.slice(0, 8)}</strong></td>
                <td>{(v.factories as unknown as { name: string } | null)?.name}</td>
                <td>{v.visit_type} · {v.execution_mode}</td>
                <td><span className={`ax-lozenge ax-lozenge--plan ${PLAN_TONE[v.planning_status] ?? ""}`}>{v.planning_status}</span></td>
                <td><span className="ax-lozenge ax-lozenge--ops">{v.operational_state.replace(/_/g, " ")}</span></td>
                <td className="ax-td-num ax-numeric">{new Date(v.window_start).toISOString().slice(0, 16).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </Shell>
  );
}
