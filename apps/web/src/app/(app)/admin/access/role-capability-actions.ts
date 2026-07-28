"use server";
// M9 / PLN-REQ-004 · PLN-CON-013 — role-level capability grant/revoke over
// `role_permissions` (the governed planning / Factory-360 permission map that
// has_planning_capability resolves through).
//
// Guards (defence in depth — RLS `f360_role_permissions_admin` remains the
// authority and requires security_admin):
//   1. has_planning_capability('admin.access.manage') re-checked on every call
//      (seeded to security_admin; explicit-grant-only, never class-defaulted).
//   2. SELF-ESCALATION BLOCK — the actor cannot grant, to a role they
//      themselves hold, a capability they lack (granting it to that role would
//      hand it to themselves), and can never grant 'admin.access.manage' to a
//      role they hold (the separation-of-duties capability stays singular).
//   3. SOLE-ADMIN PROTECTION — 'admin.access.manage' cannot be revoked from a
//      role the actor holds (they would be editing their own access, same
//      boundary as the EXE-ACCESS self guard on user grants).
// Every change is a plain role_permissions row write; audit coverage is the
// additive migration 20260722120000_planning_role_permissions_audit.sql
// (authored, pending owner apply — until then changes are RLS-guarded and
// server-logged, and this gap is honestly documented on the page).
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type RoleCapabilityResult = { ok?: string; error?: string };

const KEY_RE = /^[a-z0-9_.]+$/;

async function gate(sb: SupabaseClient): Promise<{ userId: string | null; error: string | null }> {
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { userId: null, error: "Your session has ended. Sign in again." };
  const { data: allowed, error } = await sb.rpc("has_planning_capability", { p_capability: "admin.access.manage" });
  if (error) {
    logProviderError("role-capability gate", error);
    return { userId: null, error: NEUTRAL_WRITE_ERROR };
  }
  if (allowed !== true) {
    return { userId: null, error: "You do not have permission to change role capabilities — admin.access.manage is required." };
  }
  return { userId: user.id, error: null };
}

async function actorHoldsRole(sb: SupabaseClient, userId: string, roleKey: string): Promise<boolean> {
  const { data } = await sb.from("user_roles").select("role_key").eq("user_id", userId).eq("role_key", roleKey).maybeSingle();
  return !!data;
}

export async function grantRoleCapability(fd: FormData): Promise<RoleCapabilityResult> {
  const sb = await supabaseServer();
  const g = await gate(sb);
  if (g.error || !g.userId) return { error: g.error ?? NEUTRAL_WRITE_ERROR };
  const actorId = g.userId;
  const roleKey = String(fd.get("role_key") ?? "").trim();
  const permissionKey = String(fd.get("permission_key") ?? "").trim();
  if (!KEY_RE.test(roleKey) || !KEY_RE.test(permissionKey)) {
    return { error: "The role capability change could not be read. Nothing was changed." };
  }
  const [{ data: role }, { data: permission }] = await Promise.all([
    sb.from("roles").select("role_key").eq("role_key", roleKey).maybeSingle(),
    sb.from("permissions").select("permission_key").eq("permission_key", permissionKey).maybeSingle(),
  ]);
  if (!role) return { error: "That role does not exist. Nothing was changed." };
  if (!permission) return { error: "That capability is not in the governed catalogue. Nothing was changed." };

  // Self-escalation block (PLN-CON-013): never through a role the actor holds.
  if (await actorHoldsRole(sb, actorId, roleKey)) {
    if (permissionKey === "admin.access.manage") {
      return { error: "Self-escalation guard: admin.access.manage cannot be granted to a role you hold — another security administrator must make that change." };
    }
    const { data: already } = await sb.rpc("has_planning_capability", { p_capability: permissionKey });
    if (already !== true) {
      return { error: `Self-escalation guard: you hold the role “${roleKey}” and lack “${permissionKey}” — granting it to that role would grant it to yourself (PLN-CON-013).` };
    }
  }

  const { error } = await sb.from("role_permissions").insert({ role_key: roleKey, permission_key: permissionKey });
  if (error) {
    // Idempotent grant: the (role, permission) pair already exists.
    if (error.code === "23505") {
      revalidatePath("/admin/access");
      return { ok: `“${permissionKey}” is already granted to “${roleKey}” — no change needed.` };
    }
    logProviderError("role-capability grant", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/access");
  return { ok: `Granted “${permissionKey}” to role “${roleKey}” — effective on affected users' next request; recorded by the audit trigger once migration 20260722120000 is applied.` };
}

export async function revokeRoleCapability(fd: FormData): Promise<RoleCapabilityResult> {
  const sb = await supabaseServer();
  const g = await gate(sb);
  if (g.error || !g.userId) return { error: g.error ?? NEUTRAL_WRITE_ERROR };
  const actorId = g.userId;
  const roleKey = String(fd.get("role_key") ?? "").trim();
  const permissionKey = String(fd.get("permission_key") ?? "").trim();
  if (!KEY_RE.test(roleKey) || !KEY_RE.test(permissionKey)) {
    return { error: "The role capability change could not be read. Nothing was changed." };
  }

  // Sole-admin / self protection: the actor never edits their own
  // admin.access.manage away through a role they hold.
  if (permissionKey === "admin.access.manage" && await actorHoldsRole(sb, actorId, roleKey)) {
    return { error: "Self-escalation guard: you cannot revoke admin.access.manage from a role you hold — another security administrator must make that change." };
  }

  const { data: removed, error } = await sb.from("role_permissions")
    .delete().eq("role_key", roleKey).eq("permission_key", permissionKey).select("role_key");
  if (error) {
    logProviderError("role-capability revoke", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/access");
  if (!removed?.length) return { ok: `“${permissionKey}” was not granted to “${roleKey}” — no change needed.` };
  return { ok: `Revoked “${permissionKey}” from role “${roleKey}” — effective on affected users' next request.` };
}
