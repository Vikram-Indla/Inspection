"use server";
// TASK-EXECUTION-MODULE-001 · Phase 2B — governed role/capability grants.
// SAQEEL-EXE-CANONICAL-PLAN v1.0 §5/§27: role grants and direct capability
// overrides change ONLY through the four guarded RPCs from migration
// 20260721110000_execution_access_grants.sql. These actions never write
// user_roles or user_capability_grants directly — the RPC is the single
// write path and re-checks security_admin, the self-escalation guard, the
// sole-security_admin guard and catalogue validity, then appends the
// EXE-ACCESS audit row itself. This layer only verifies the session, validates
// payload shape and maps the stable RPC error tokens to neutral UI copy.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type AccessActionResult = { ok?: boolean; error?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Stable tokens raised by the access RPCs (see the migration header). Anything
// else stays server-side and surfaces as the neutral write error.
function mapRpcError(scope: string, error: { message?: string; code?: string }): string {
  logProviderError(scope, error);
  const message = String(error?.message ?? "");
  if (message.includes("EXE-ACCESS-SELF")) {
    return "You cannot change your own access. Another security administrator must make this change for you.";
  }
  if (message.includes("EXE-ACCESS-LAST-SECURITY-ADMIN")) {
    return "This was refused: it would remove the last remaining security administrator. Grant the role to another user first.";
  }
  if (message.includes("EXE-ACCESS-UNKNOWN-ROLE")) {
    return "That role does not exist. Nothing was changed.";
  }
  if (message.includes("EXE-ACCESS-UNKNOWN-CAPABILITY")) {
    return "That capability is not in the governed catalogue. Nothing was changed.";
  }
  if (message.includes("EXE-ACCESS-UNKNOWN-USER")) {
    return "That user no longer exists. Nothing was changed.";
  }
  if (message.includes("EXE-ACCESS-DENIED") || error?.code === "42501") {
    return "You do not have permission to change access. Only a security administrator can grant or revoke.";
  }
  return NEUTRAL_WRITE_ERROR;
}

type AccessRpc = "admin_grant_role" | "admin_revoke_role" | "admin_grant_capability" | "admin_revoke_capability";

async function callAccessRpc(
  rpc: AccessRpc,
  formData: FormData,
  keyField: "p_role" | "p_capability",
): Promise<AccessActionResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError || !user) {
    return { error: "Your session has ended. Sign in again." };
  }

  const targetUser = String(formData.get("user_id") ?? "").trim();
  const key = String(formData.get(keyField === "p_role" ? "role_key" : "capability_key") ?? "").trim();
  if (!UUID_RE.test(targetUser) || key === "") {
    return { error: "The access change could not be read. Nothing was changed." };
  }

  const { error } = await sb.rpc(rpc, { p_user: targetUser, [keyField]: key });
  if (error) return { error: mapRpcError(`access ${rpc}`, error) };

  revalidatePath("/admin/access");
  return { ok: true };
}

export async function grantRole(formData: FormData): Promise<AccessActionResult> {
  return callAccessRpc("admin_grant_role", formData, "p_role");
}

export async function revokeRole(formData: FormData): Promise<AccessActionResult> {
  return callAccessRpc("admin_revoke_role", formData, "p_role");
}

export async function grantCapability(formData: FormData): Promise<AccessActionResult> {
  return callAccessRpc("admin_grant_capability", formData, "p_capability");
}

export async function revokeCapability(formData: FormData): Promise<AccessActionResult> {
  return callAccessRpc("admin_revoke_capability", formData, "p_capability");
}
