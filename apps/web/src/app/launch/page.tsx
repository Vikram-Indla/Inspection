import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { homeForRoles } from "@/lib/role-home";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export const dynamic = "force-dynamic";


export default async function Launch() {
  const locale = await getLocale();
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  // Throw into the route error boundary so an identity-provider outage is
  // never misrepresented as an unauthenticated or no-workspace outcome.
  if (authError?.name === "AuthSessionMissingError" || !user) redirect(localeHref(locale, "/login"));
  if (authError) {
    console.error("[ launch auth]", authError.message);
    throw new Error("launch_auth_unavailable");
  }

  const { data: roles, error: rolesError } = await getUserRoles(user.id);
  if (rolesError) {
    console.error("[ launch roles]", rolesError.message);
    throw new Error("launch_roles_unavailable");
  }
  const home = homeForRoles((roles ?? []).map(r => r.role_key));
  if (home) redirect(localeHref(locale, home));
  // CD003-SEC-001: no matched role is not the same as an admin grant — an
  // unrecognized or absent role_key must never fall through to /admin.
  redirect(localeHref(locale, "/launch/no-workspace"));
}
