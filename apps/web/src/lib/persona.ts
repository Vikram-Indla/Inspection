import { cache } from "react";
import { supabaseServer } from "@/lib/supabase-server";

// K-004 — per-render persona dedupe.
// Within one server render the page's own role guard, the shared Shell, and
// (on admin routes) AdminRouteBoundary all need the same user_roles rows.
// React cache() collapses those call sites into ONE PostgREST round trip per
// render. Deliberately NOT cached across requests: a role grant/revocation
// takes effect on the very next navigation, and RLS stays the enforcement
// boundary for all data reads.
export const getUserRoles = cache(async (userId: string) => {
  const sb = await supabaseServer();
  return sb.from("user_roles").select("role_key").eq("user_id", userId);
});

// Shell region dropdown values. factories_read grants every authenticated
// user the same visibility (0002: auth.uid() is not null), so the deduped
// result is identical for all callers in the render. A failed/empty read
// disables the shared region control; it never invents regions
// (CMP-REQ-SHELL-002).
export const getShellRegions = cache(async () => {
  const sb = await supabaseServer();
  return sb.from("factories").select("region").not("region", "is", null).limit(1000);
});
