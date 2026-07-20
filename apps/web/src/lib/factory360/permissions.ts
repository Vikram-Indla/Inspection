import type { SupabaseClient } from "@supabase/supabase-js";

export const FACTORY_360_PERMISSIONS = [
  "view_factory_360",
  "view_factory_documents",
  "download_factory_documents",
  "view_risk_details",
  "export_factory",
  "create_inspection",
] as const;

export type Factory360Permission = typeof FACTORY_360_PERMISSIONS[number];

export async function hasFactory360Permission(sb: SupabaseClient, permission: Factory360Permission) {
  const { data, error } = await sb.rpc("has_permission", { p_permission_key: permission });
  return { allowed: !error && data === true, error };
}
