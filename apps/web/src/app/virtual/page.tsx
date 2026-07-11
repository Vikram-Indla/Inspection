import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function VirtualList() {
  const sb = await supabaseServer();
  const { data: sessions } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, visits(id, factories(name, factory_code), inspections(id, status))")
    .order("appointment_at");
  const { data: vvisits } = await sb.from("visits")
    .select("id, window_start, factories(name), virtual_sessions(id)")
    .eq("execution_mode", "virtual").eq("planning_status", "published");
  return (
    <Shell current="/virtual" title="Virtual inspections"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-VIR-700 · confirmed sessions only</span>}>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>Session</th><th>Factory</th><th className="ax-td-num">Appointment</th><th>State</th><th></th></tr></thead>
        <tbody>
          {(sessions ?? []).map(s => {
            const v = s.visits as unknown as { id: string; factories: { name: string; factory_code: string } };
            return (
              <tr key={s.id}>
                <td className="ax-numeric"><strong>{s.id.slice(0, 8)}</strong></td>
                <td>{v.factories.name} <span className="ax-caption">{v.factories.factory_code}</span></td>
                <td className="ax-td-num ax-numeric">{new Date(s.appointment_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td><span className={`ax-lozenge ax-lozenge--virtual ${s.state === "verified" ? "ax-lozenge--success" : "ax-lozenge--info"}`}>{s.state}</span></td>
                <td><a className="ax-link" href={`/virtual/${s.id}`}>open room →</a></td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      {(vvisits ?? []).filter(v => !(v.virtual_sessions as unknown[])?.length).length > 0 && (
        <p className="ax-caption">Virtual visits without a session start their room from the field home (inspector-owned).</p>
      )}
    </Shell>
  );
}
