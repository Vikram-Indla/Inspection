import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Violations() {
  const sb = await supabaseServer();
  const { data: codes } = await sb.from("violation_codes")
    .select("id, code, title, level, active_from, regulation_clauses(clause_ref, regulations(code)), penalty_mappings(penalty_ref, mapping_version, legal_basis, repeat_rule)")
    .order("code");
  return (
    <Shell current="/admin" title="Violation Catalogue & Penalty Mapping"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-040/041 · ENG-08</span>}>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>Code</th><th>Title</th><th>Level</th><th>Legal basis</th><th>Penalty (1:1 — M09-004)</th><th>Mapping</th></tr></thead>
        <tbody>
          {(codes ?? []).map(v => {
            const rc = v.regulation_clauses as unknown as { clause_ref: string; regulations: { code: string } } | null;
            const pm = (v.penalty_mappings as unknown as { penalty_ref: string; mapping_version: string; legal_basis: string }[] | null)?.[0];
            return (
              <tr key={v.id}>
                <td className="ax-numeric"><strong>{v.code}</strong></td>
                <td>{v.title}</td>
                <td><span className={`ax-lozenge ${v.level === "L1" ? "ax-lozenge--critical" : "ax-lozenge--warning"}`}>{v.level}</span></td>
                <td className="ax-numeric">{rc ? `${rc.regulations.code} §${rc.clause_ref}` : "—"}</td>
                <td>{pm?.penalty_ref ?? "—"} <span className="ax-caption">· {pm?.legal_basis}</span></td>
                <td><span className="ax-version">{pm?.mapping_version}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <p className="ax-caption">Violations generate automatically from configured responses; the inspector can never type or override one (M09-003/026). Inspection results reference the exact mapping version forever (FLD-PEN-001).</p>
    </Shell>
  );
}
