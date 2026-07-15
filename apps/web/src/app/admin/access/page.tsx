import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NotYetBoundary } from "@/components/NotYetBoundary";

export const dynamic = "force-dynamic";

export default async function Access() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: profiles, error }, { data: roles }] = await Promise.all([
    sb.from("profiles").select("user_id, full_name, email, region, user_roles!user_roles_user_id_fkey(role_key)").order("full_name"),
    sb.from("roles").select("role_key, title, is_admin").order("role_key"),
  ]);
  return (
    <Shell current="/admin" title={t("admin.access.title", "Roles & permissions")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-090 · RBAC-001..014</span>}>
      <div className="ax-banner"><div><strong>{t("admin.access.banner.title", "Access is enforced by Row Level Security, not UI.")}</strong> {t("admin.access.banner.body", "54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render).")}</div></div>
      {error && <div className="ax-banner ax-banner--critical"><div><strong>{t("admin.access.error.title", "Couldn’t load roster.")}</strong> {error.message} {t("admin.access.error.retry", "— retry.")}</div></div>}
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>{t("admin.access.table.user", "User")}</th><th>{t("admin.access.table.email", "Email")}</th><th>{t("admin.access.table.region", "Region")}</th><th>{t("admin.access.table.roles", "Roles")}</th></tr></thead>
        <tbody>
          {(profiles ?? []).map(p => (
            <tr key={p.user_id}>
              <td><strong>{p.full_name}</strong></td>
              <td className="ax-caption">{p.email}</td>
              <td>{p.region}</td>
              <td>{(p.user_roles as { role_key: string }[]).map(r =>
                <span key={r.role_key} className={`ax-lozenge ${(roles ?? []).find(x => x.role_key === r.role_key)?.is_admin ? "ax-lozenge--warning" : "ax-lozenge--info"}`} style={{ marginInlineEnd: 6 }}>{r.role_key}</span>)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>
        {t("admin.access.rlsNote", "This roster is itself RLS-scoped: users outside your visibility are absent, not hidden rows. This screen is read-only.")}
      </p>

      {/* R2: effective-access explanation and role changes are deliberately not
          actionable here — both need approved contracts, so they are honest
          boundaries rather than non-conclusive explainers or fake controls. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--ax-space-200)", marginBlockStart: "var(--ax-space-200)" }}>
        <NotYetBoundary
          title={t("admin.access.explainer.title", "Effective-access explainer")}
          consequence={t("admin.access.explainer.desc", "This view shows role holdings, not a conclusive “why can this user do X” proof.")}
          seam="NEEDS_APPROVED_CONTRACT — effective-access explainer"
          prerequisites={[
            t("admin.access.explainer.pre1", "Per-grant RLS policy citations available as data"),
            t("admin.access.explainer.pre2", "A derived effective-permission model"),
          ]}
          notAvailableLabel={t("admin.access.notYet", "Not available yet")}
          detailLabel={t("common.whyPrereq", "Why / prerequisites")}
        />
        <NotYetBoundary
          title={t("admin.access.change.title", "Role change workflow")}
          consequence={t("admin.access.change.desc", "Granting or revoking roles is not possible on this read-only screen today.")}
          seam="NEEDS_APPROVED_CONTRACT — role change workflow"
          prerequisites={[
            t("admin.access.change.pre1", "A grant/revoke workflow with separation-of-duties"),
            t("admin.access.change.pre2", "A self-escalation guard"),
            t("admin.access.change.pre3", "An approval + audit path"),
          ]}
          notAvailableLabel={t("admin.access.notYet", "Not available yet")}
          detailLabel={t("common.whyPrereq", "Why / prerequisites")}
        />
      </div>
    </Shell>
  );
}
