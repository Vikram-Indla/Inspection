import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sb = await supabaseServer();
  const [{ data: engines }, regs, items, pkgs, vios, audits] = await Promise.all([
    sb.from("engine_settings").select("engine, version_label, updated_at").order("engine"),
    sb.from("regulations").select("id", { count: "exact", head: true }),
    sb.from("inspection_items").select("id", { count: "exact", head: true }),
    sb.from("package_versions").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("violation_codes").select("id", { count: "exact", head: true }),
    sb.from("audit_events").select("id", { count: "exact", head: true }),
  ]);
  const kpis: [string, number | null, string][] = [
    ["Regulations", regs.count, "SCR-ADM-010"], ["Inspection items", items.count, "SCR-ADM-020"],
    ["Published packages", pkgs.count, "SCR-ADM-030"], ["Violation codes", vios.count, "SCR-ADM-040"],
    ["Audit events", audits.count, "ENG-12 · append-only"],
  ];
  return (
    <Shell current="/admin" title="Configuration overview"
      context={<span className="ax-lozenge ax-lozenge--success">live database</span>}>
      <div className="ax-kpi-row">
        {kpis.map(([label, count, refid]) => (
          <div key={label} className="ax-surface ax-kpi">
            <span className="ax-overline">{label}</span>
            <span className="ax-kpi__value ax-numeric">{count ?? 0}</span>
            <span className="ax-kpi__delta">{refid}</span>
          </div>
        ))}
      </div>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Engine settings — accepted configuration (not code)</h4>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>Engine</th><th>Version</th><th className="ax-td-num">Updated</th></tr></thead>
          <tbody>
            {(engines ?? []).map(e => (
              <tr key={e.engine}>
                <td><strong>{e.engine}</strong></td>
                <td><span className="ax-version">{e.version_label}</span></td>
                <td className="ax-td-num ax-numeric">{new Date(e.updated_at).toISOString().slice(0, 16).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>
          Values from DECISIONS_ACCEPTED_2026-07-11.yaml, stored in <code>engine_settings</code>. Owners revise via governed publish (maker-checker enforced by DB constraint).
        </p>
      </div>
      <div className="ax-row">
        <a className="ax-btn ax-btn--secondary" href="/admin/regulations">Regulation library →</a>
      </div>
    </Shell>
  );
}
