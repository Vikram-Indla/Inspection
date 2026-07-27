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
const SHELL_REGION_TAG = "shell-regions";

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
  // Distinct region labels for the shell scope control. On a live project
  // `factories` exceeds 1000 rows (1290+ on staging), so a single
  // `.limit(1000)` page silently drops every region whose rows sort past that
  // first page — e.g. the high-UUID "Verification Fixtures" seed. Page through
  // all non-null region rows (region column only) and dedupe so the scope
  // dropdown is complete regardless of table size.
  return unstable_cache(
    async () => {
      const pageSize = 1000;
      const seen = new Set<string>();
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await sb.from("factories").select("region").not("region", "is", null).range(from, from + pageSize - 1);
        if (error) return { data: null, error };
        for (const row of data ?? []) if (row.region) seen.add(row.region);
        if (!data || data.length < pageSize) break;
      }
      return { data: [...seen].map(region => ({ region })), error: null };
    },
    ["shell-regions"],
    // Reuse the already-governed shell/persona cache window above rather than
    // introducing a second staleness threshold for shared navigation data.
    { revalidate: ROLE_CACHE_SECONDS, tags: [SHELL_REGION_TAG] },
  )();
});

export async function invalidateShellRegions() {
  revalidateTag(SHELL_REGION_TAG);
}
