import type { SupabaseClient } from "@supabase/supabase-js";

// Canonical Planning access resolver (SAQEEL Planning convergence).
//
// planning_access_class() classifies the session into exactly one of
// admin / inspector / business_staff / anonymous, where business_staff is the
// DEFAULT class for any authenticated user holding neither an admin
// (roles.is_admin) nor the inspector role. has_planning_capability(text)
// resolves explicit role grants plus the class default set. Both are
// SECURITY DEFINER, STABLE RPCs granted to authenticated.
//
// Fail-closed contract: any RPC error returns error != null and can() ===
// false for everything. Callers must treat that as denial, never as a
// permissive default, and must not degrade into a role-select fallback.

export type PlanningAccessClass = "admin" | "inspector" | "business_staff" | "anonymous";

export type PlanningAccess = {
  accessClass: PlanningAccessClass;
  can: (capability: string) => boolean;
  error: string | null;
};

export async function getPlanningAccess(sb: SupabaseClient, capabilities: string[] = []): Promise<PlanningAccess> {
  const deny = (): PlanningAccess => ({ accessClass: "anonymous", can: () => false, error: "planning access resolution failed" });
  const { data: accessClass, error: classError } = await sb.rpc("planning_access_class");
  if (classError || typeof accessClass !== "string") {
    console.error("[planning.access] planning_access_class failed:", classError?.message ?? "unexpected result shape");
    return deny();
  }
  const granted = new Set<string>();
  const results = await Promise.all(
    capabilities.map(capability => sb.rpc("has_planning_capability", { p_capability: capability })),
  );
  for (let i = 0; i < capabilities.length; i++) {
    const res = results[i];
    if (res.error) {
      console.error(`[planning.access] has_planning_capability(${capabilities[i]}) failed:`, res.error.message);
      return deny();
    }
    if (res.data === true) granted.add(capabilities[i]);
  }
  return { accessClass: accessClass as PlanningAccessClass, can: capability => granted.has(capability), error: null };
}
