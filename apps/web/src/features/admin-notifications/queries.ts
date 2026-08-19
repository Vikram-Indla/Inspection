import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { getUserRoles } from "@/lib/persona";
import type { NotificationRuleRow, NotificationsView, RoleOption } from "./types";

export async function loadNotifications(): Promise<NotificationsView> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const [roleRead, rulesRead, roleTableRead] = await Promise.all([
    user ? getUserRoles(user.id) : Promise.resolve({ data: [] as { role_key: string }[], error: null }),
    sb.from("notification_rules")
      .select("id, event_key, channel, recipient_role, template, sla_minutes, escalation_role, status, version_label, created_at, deactivation_reason")
      .order("event_key").order("channel"),
    sb.from("roles").select("role_key, title").order("role_key"),
  ]);

  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));

  return {
    rules: (rulesRead.data ?? []) as NotificationRuleRow[],
    roles: (roleTableRead.data ?? []) as RoleOption[],
    isWriter: roles.has("admin"),
    rolesAvailable: !roleTableRead.error,
    permissionsFailed: Boolean(roleRead.error),
    rulesFailed: Boolean(rulesRead.error),
  };
}
