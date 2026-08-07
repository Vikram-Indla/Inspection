import { dashboardPersonaFor, type DashboardPersona } from "@/lib/dashboard-role";
import type { DashboardClient } from "./client-type";

export async function loadPersona(sb: DashboardClient, userId: string): Promise<DashboardPersona | null> {
  const { data, error } = await sb.from("user_roles").select("role_key").eq("user_id", userId);
  return error ? null : dashboardPersonaFor((data ?? []).map(row => row.role_key));
}
