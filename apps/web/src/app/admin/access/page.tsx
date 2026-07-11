import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Access() {
  const sb = await supabaseServer();
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    sb.from("profiles").select("user_id, full_name, email, region, user_roles(role_key)").order("full_name"),
    sb.from("roles").select("role_key, title, is_admin").order("role_key"),
  ]);
  return (
    <Shell current="/admin" title="Roles & permissions"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-090 · RBAC-001..014</span>}>
      <div className="ax-banner"><div><strong>Access is enforced by Row Level Security, not UI.</strong> 54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render).</div></div>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>User</th><th>Email</th><th>Region</th><th>Roles</th></tr></thead>
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
