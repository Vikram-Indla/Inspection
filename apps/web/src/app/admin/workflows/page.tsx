import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Transition = { id: string; from: string; to: string; actor: string; guard: string; side_effects?: string[]; terminal?: boolean };

export default async function Workflows() {
  const sb = await supabaseServer();
  const { data: wfs } = await sb.from("config_versions")
    .select("id, version_label, status, payload, effective_from, created_by, approved_by")
    .eq("engine", "workflow").order("effective_from", { ascending: false });
  return (
    <Shell current="/admin" title="Workflow configuration"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-050/051 · ENG-03</span>}>
      {(wfs ?? []).map(w => {
        const p = w.payload as { object: string; states: string[]; transitions: Transition[] };
        return (
          <div key={w.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <h3>Object: {p.object} <span className="ax-version">{w.version_label}</span></h3>
              <span className={`ax-lozenge ${w.status === "published" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{w.status}</span>
            </div>
            <p className="ax-caption">States: {p.states.join(" · ")} — runtime evaluates transitions against this published version; no status bypass (RBAC-003; maker-checker on config_versions enforced by DB constraint).</p>
            <div className="ax-tablewrap"><table className="ax-table">
              <thead><tr><th>Transition</th><th>From → To</th><th>Actor</th><th>Guard</th><th>Side effects</th></tr></thead>
              <tbody>
                {p.transitions.map(t => (
                  <tr key={t.id}>
                    <td className="ax-numeric"><strong>{t.id}</strong></td>
                    <td>{t.from} → {t.to}{t.terminal && <span className="ax-lozenge ax-lozenge--critical" style={{ marginInlineStart: 6 }}>terminal</span>}</td>
                    <td>{t.actor}</td><td className="ax-caption">{t.guard}</td>
                    <td className="ax-caption">{(t.side_effects ?? []).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        );
      })}
    </Shell>
  );
}
