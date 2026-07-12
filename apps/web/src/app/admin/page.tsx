import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const { t } = await useT();
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
    [t("admin.overview.kpi.regulations", "Regulations"), regs.count, "SCR-ADM-010"],
    [t("admin.overview.kpi.items", "Inspection items"), items.count, "SCR-ADM-020"],
    [t("admin.overview.kpi.packages", "Published packages"), pkgs.count, "SCR-ADM-030"],
    [t("admin.overview.kpi.violations", "Violation codes"), vios.count, "SCR-ADM-040"],
    [t("admin.overview.kpi.audit", "Audit events"), audits.count, t("admin.overview.kpi.auditRef", "ENG-12 · append-only")],
  ];
  return (
    <Shell current="/admin" title={t("admin.overview.title", "Configuration overview")}
      context={<span className="ax-lozenge ax-lozenge--success">{t("admin.overview.live", "live database")}</span>}>
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
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("admin.overview.engines.title", "Engine settings — accepted configuration (not code)")}</h4>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>{t("admin.overview.engines.engine", "Engine")}</th><th>{t("admin.overview.engines.version", "Version")}</th><th className="ax-td-num">{t("admin.overview.engines.updated", "Updated")}</th></tr></thead>
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
          {t("admin.overview.engines.captionBefore", "Values from DECISIONS_ACCEPTED_2026-07-11.yaml, stored in")} <code>engine_settings</code>{t("admin.overview.engines.captionAfter", ". Owners revise via governed publish (maker-checker enforced by DB constraint).")}
        </p>
      </div>
      <div className="ax-row">
        <a className="ax-btn ax-btn--secondary" href="/admin/regulations">{t("admin.overview.regLink", "Regulation library →")}</a>
        <a className="ax-btn ax-btn--secondary" href="/admin/audit">{t("admin.overview.auditLink", "Audit trail browser →")}</a>
      </div>
    </Shell>
  );
}
