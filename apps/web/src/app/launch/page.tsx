import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Role-based home routing — each persona lands on their own channel,
// not on a screen scoped to someone else's job (RBAC-001..014).
const ROLE_HOME: [string, string][] = [
  ["inspector", "/field"],
  ["reviewer", "/reviews"],
  ["planner", "/planning"],
  ["ops", "/operations"],
  ["leadership", "/operations"],
];

export default async function Launch() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  const keys = new Set((roles ?? []).map(r => r.role_key));
  for (const [role, home] of ROLE_HOME) if (keys.has(role)) redirect(home);
  redirect("/admin"); // admin family (compliance/form/workflow/security/gis/risk) and fallback
}
