import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Factories() {
  const sb = await supabaseServer();
  const { data: fs } = await sb.from("factories").select("id, factory_code, name, cr_number, city, risk_band, risk_score").order("risk_score", { ascending: false });
  return (
    <Shell current="/factories" title="Factory 360" context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-400</span>}>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>Factory</th><th>CR</th><th>City</th><th className="ax-td-num">Risk</th><th></th></tr></thead>
        <tbody>{(fs ?? []).map(f => (
          <tr key={f.id}>
            <td><strong>{f.name}</strong> <span className="ax-caption">{f.factory_code}</span></td>
            <td className="ax-numeric">{f.cr_number}</td><td>{f.city}</td>
            <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{f.risk_band} · {f.risk_score}</span></td>
            <td><a className="ax-link" href={`/factories/${f.id}`}>dossier →</a></td>
          </tr>
        ))}</tbody>
      </table></div>
    </Shell>
  );
}
