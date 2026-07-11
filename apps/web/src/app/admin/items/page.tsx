import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Items() {
  const sb = await supabaseServer();
  const { data: items } = await sb.from("inspection_items")
    .select("id, code, title, active, score_weight, response_model, evidence_rule, regulation_clauses(clause_ref, regulations(code))")
    .order("code");
  return (
    <Shell current="/admin" title="Inspection Item Catalogue"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-020 · ENG-01</span>}>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>Code</th><th>Title</th><th>Clause</th><th>Runtime semantics</th><th className="ax-td-num">Weight</th><th>Status</th></tr></thead>
        <tbody>
          {(items ?? []).map(i => {
            const rc = i.regulation_clauses as unknown as { clause_ref: string; regulations: { code: string } } | null;
            const rm = i.response_model as { responses?: string[]; mapping?: Record<string, { violation?: string }>; conditional?: object };
            return (
              <tr key={i.id}>
                <td className="ax-numeric"><strong>{i.code}</strong></td>
                <td>{i.title}</td>
                <td className="ax-numeric">{rc ? `${rc.regulations.code} §${rc.clause_ref}` : "—"}</td>
                <td className="ax-caption">
                  {(rm.responses ?? []).join(" / ")}
                  {rm.mapping?.non_compliant?.violation && ` · NC→${rm.mapping.non_compliant.violation}`}
                  {rm.conditional && " · conditional"}
                  {i.evidence_rule != null && " · evidence rule"}
                </td>
                <td className="ax-td-num ax-numeric">{i.score_weight ?? "—"}</td>
                <td><span className={`ax-lozenge ${i.active ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{i.active ? "active" : "deactivated"}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <p className="ax-caption">Items belong to regulations and are reused across packages (M09-002/007); deactivation preserves history (M09-014).</p>
    </Shell>
  );
}
