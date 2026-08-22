import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AccessDenied from "@/components/sections/admin-access/access-denied/access-denied";
import { getLocale } from "@/lib/i18n";
import { getUserRoles } from "@/lib/persona";
import { getServerUser } from "@/lib/supabase-server";

export default async function AccessLayout({ children }: { children: ReactNode }) {
  const { data: { user }, error: authError } = await getServerUser();
  if (!user || authError?.name === "AuthSessionMissingError") redirect("/login");
  if (authError) throw new Error("admin_access_auth_unavailable");

  const { data, error } = await getUserRoles(user.id);
  if (error) throw new Error("admin_access_roles_unavailable");
  if (user || (data ?? []).some(row => row.role_key === "admin")) return children;

  return <AccessDenied locale={await getLocale()} />;
}
