import type { ReactNode } from "react";
import { getUserRoles } from "@/lib/persona";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

/** Route-level visibility guard. Database RLS remains the write/read authority. */
export default async function AdminRouteBoundary({ allowedRoles, children }: { allowedRoles: readonly string[]; children: ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getServerUser();
  if (!user || authError?.name === "AuthSessionMissingError") redirect("/login");
  if (authError) throw new Error("admin_route_auth_unavailable");

  const { data, error } = await getUserRoles(user.id);
  if (error) throw new Error("admin_route_roles_unavailable");
  const roles = new Set((data ?? []).map(row => row.role_key));
  if (allowedRoles.some(role => roles.has(role))) return children;

  const { t } = await useT();
  return (
    <Shell current="/admin" title="">
      <section className="sq-access-refusal" role="alert">
        <span aria-hidden="true">🔒</span>
        <h1>{t("admin.unauthorized.heading", "You do not have access to this destination")}</h1>
        <p>{t("admin.unauthorized.body", "The destination stays visible so the platform remains legible, and access is refused here, at the boundary.")}</p>
        <div>
          <a className="sq-btn" href="/profile">{t("admin.unauthorized.request", "Request access")}</a>
          <a className="sq-btn sq-btn--secondary" href="/dashboard">{t("admin.unauthorized.return", "Back to default state")}</a>
        </div>
        <small>{t("admin.unauthorized.detail", "Administration routes are guarded by the admin role family (security_admin / compliance_admin / risk_owner / form_admin / workflow_admin). A Planner reaches the destination and is refused at the boundary.")}</small>
      </section>
    </Shell>
  );
}
