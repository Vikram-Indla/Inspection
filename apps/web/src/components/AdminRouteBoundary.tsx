import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { IconShieldCheck } from "@/app/icons";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

/** Route-level visibility guard. Database RLS remains the write/read authority. */
export default async function AdminRouteBoundary({ allowedRoles, children }: { allowedRoles: readonly string[]; children: ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getServerUser();
  if (!user || authError?.name === "AuthSessionMissingError") redirect("/login");
  if (authError) throw new Error("admin_route_auth_unavailable");

  const { data, error } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  if (error) throw new Error("admin_route_roles_unavailable");
  const roles = new Set((data ?? []).map(row => row.role_key));
  if (allowedRoles.some(role => roles.has(role))) return children;

  const { t } = await useT();
  return (
    <Shell current="/admin" title={t("admin.unauthorized.title", "Authorized configuration role required")}>
      <EmptyState icon={<IconShieldCheck size={28} />} role="alert"
        title={t("admin.unauthorized.heading", "This control-plane module is outside your role")}
        body={t("admin.unauthorized.body", "No configuration data has been loaded. Return to your assigned workspace or ask an administrator for the required role.")}>
        <a className="ax-btn ax-btn--secondary ax-link" href="/launch">{t("admin.unauthorized.return", "Return to my workspace")}</a>
      </EmptyState>
    </Shell>
  );
}
