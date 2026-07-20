import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

// K-004 — per-render persona dedupe.
// Within one server render the page's own role guard, the shared Shell, and
// (on admin routes) AdminRouteBoundary all need the same user_roles rows.
// React cache() collapses call sites inside one render. The short Next cache
// also lets the persistent layout reuse the same user's navigation persona
// across route requests. RLS remains authoritative: stale navigation can at
// most show a destination that the database still denies.
//
// Revocation staleness decision (TASK-G11-REMEDIATION-PERFORMANCE-001 / K-004):
// 30 seconds maximum if an out-of-band writer cannot call invalidateUserRoles;
// zero after an in-app writer calls the exported invalidator. The current
// Access screen is read-only, so there is no role mutation path to wire today.
const ROLE_CACHE_SECONDS = 30;
const roleTag = (userId: string) => `user-roles:${userId}`;

export const getUserRoles = cache(async (userId: string) => {
  const sb = await supabaseServer();
  return unstable_cache(
    async () => sb.from("user_roles").select("role_key").eq("user_id", userId),
    ["user-roles", userId],
    { revalidate: ROLE_CACHE_SECONDS, tags: [roleTag(userId)] },
  )();
});

export async function invalidateUserRoles(userId: string) {
  revalidateTag(roleTag(userId));
}

// Shell region dropdown values. factories_read grants every authenticated
// user the same visibility (0002: auth.uid() is not null), so the deduped
// result is identical for all callers in the render. A failed/empty read
// disables the shared region control; it never invents regions
// (CMP-REQ-SHELL-002).
export const getShellRegions = cache(async () => {
  const sb = await supabaseServer();
  return sb.from("factories").select("region").not("region", "is", null).limit(1000);
});
