import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Access() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: profiles, error }, { data: roles }] = await Promise.all([
    sb.from("profiles").select("user_id, full_name, email, region, user_roles!user_roles_user_id_fkey(role_key)").order("full_name"),
    sb.from("roles").select("role_key, title, is_admin").order("role_key"),
  ]);
  if (error) console.error("[admin access] load failed", error);
  return (
    <Shell current="/admin/access" title={t("admin.access.title", "Roles & permissions")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-090 · RBAC-001..014</span>}>
      <div className="ax-banner"><div><strong>{t("admin.access.banner.title", "Access is enforced by Row Level Security, not UI.")}</strong> {t("admin.access.banner.body", "54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render).")}</div></div>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("admin.access.error.title", "Couldn’t load roster. Nothing was changed. Try again.")}</strong></div></div>}
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
    </Shell>
  );
}
