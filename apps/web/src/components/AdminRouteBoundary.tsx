import type { ReactNode } from "react";
import { getUserRoles } from "@/lib/persona";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { IconShieldCheck } from "@/app/icons";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { homeForRoles } from "@/lib/role-home";

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
  const authorizedHome = homeForRoles(roles) ?? "/launch";
  return (
    <Shell current="/admin" title={t("admin.unauthorized.destinationTitle", "Administration access restricted")}>
      <h1 className="ax-sr-only">
        {t("admin.unauthorized.destinationHeading", "You do not have access to this destination")}
      </h1>
      <EmptyState icon={<IconShieldCheck size={28} />} role="alert" headingLevel={2}
        title={t("admin.unauthorized.destinationHeading", "You do not have access to this destination")}
        body={t("admin.unauthorized.destinationBody", "Administration remains visible so the system structure is clear, but your assigned role is not authorized to load administration data.")}>
        <a className="btn btn-secondary sq-link btn-touch" href={authorizedHome}>
          {t("admin.unauthorized.destinationReturn", "Back to an authorized area")}
        </a>
      </EmptyState>
    </Shell>
  );
}
