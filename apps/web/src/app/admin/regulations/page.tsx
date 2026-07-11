import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Regulations() {
  const sb = await supabaseServer();
  const { data: regs } = await sb.from("regulations")
    .select("id, code, title, issuing_authority, status, regulation_clauses(id, clause_ref, title, inspection_items(id, code))")
    .order("code");
  return (
    <Shell current="/admin" title="Regulation library"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-010/011</span>}>
      {(regs ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">📜</span><h4>No regulations configured</h4>
          <p className="ax-caption">Regulations are the parents of inspection items (MVP1-M09-001).</p>
        </div></div>
      )}
      {(regs ?? []).map(r => (
        <div key={r.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>{r.code} — {r.title}</h3>
            <span className={`ax-lozenge ${r.status === "published" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{r.status}</span>
          </div>
          <p className="ax-caption">{r.issuing_authority}</p>
          <div className="ax-tablewrap" style={{ marginBlockStart: "var(--ax-space-200)" }}><table className="ax-table">
            <thead><tr><th>Clause</th><th>Title</th><th>Mapped items</th></tr></thead>
            <tbody>
              {(r.regulation_clauses ?? []).map(c => (
                <tr key={c.id}>
                  <td className="ax-numeric"><strong>§{c.clause_ref}</strong></td>
                  <td>{c.title}</td>
                  <td>{(c.inspection_items ?? []).map(i => <span key={i.id} className="ax-lozenge ax-lozenge--info" style={{ marginInlineEnd: 6 }}>{i.code}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ))}
    </Shell>
  );
}
