import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export const dynamic = "force-dynamic";

// Role-based home routing — each persona lands on their own channel,
// not on a screen scoped to someone else's job (RBAC-001..014). The admin
// family has no single "admin" role_key — RBAC-001..006 each grant one of
// six granular role_keys (verified live against user_roles), all landing on
// the same /admin console. Matched last: an operational role always wins
// over a concurrent admin grant, matching prior behavior for multi-role
// accounts.
const ROLE_HOME: [string, string][] = [
  ["inspector", "/field"],
  ["reviewer", "/reviews"],
  ["planner", "/planning"],
  ["ops", "/dashboard"],
  ["leadership", "/dashboard"],
  ["compliance_admin", "/admin"],
  ["form_admin", "/admin"],
  ["workflow_admin", "/admin"],
  ["security_admin", "/admin"],
  ["gis_admin", "/admin"],
  ["risk_owner", "/admin"],
];

export default async function Launch() {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  // Throw into the route error boundary so an identity-provider outage is
  // never misrepresented as an unauthenticated or no-workspace outcome.
  if (authError?.name === "AuthSessionMissingError" || !user) redirect("/login");
  if (authError) {
    console.error("[CD-003 launch auth]", authError.message);
    throw new Error("launch_auth_unavailable");
  }

  const { data: roles, error: rolesError } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  if (rolesError) {
    console.error("[CD-003 launch roles]", rolesError.message);
    throw new Error("launch_roles_unavailable");
  }
  const keys = new Set((roles ?? []).map(r => r.role_key));
  for (const [role, home] of ROLE_HOME) if (keys.has(role)) redirect(home);
  // CD003-SEC-001: no matched role is not the same as an admin grant — an
  // unrecognized or absent role_key must never fall through to /admin.
  redirect("/launch/no-workspace");
}
