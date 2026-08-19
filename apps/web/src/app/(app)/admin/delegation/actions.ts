"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";

export type DelegationResult = { ok?: boolean; error?: string };

function databaseCode(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  const known: Array<[string, string]> = [
    ["DELEGATION_SELF_NOT_ALLOWED", "self_not_allowed"],
    ["DELEGATION_REASON_REQUIRED", "reason_required"],
    ["DELEGATION_WINDOW_INVALID", "window_invalid"],
    ["DELEGATION_SCOPE_NOT_HELD", "scope_not_held"],
    ["DELEGATION_DELEGATE_NOT_FOUND", "delegate_not_found"],
    ["DELEGATION_NOT_FOUND", "not_found"],
    ["DELEGATION_NOT_ACTIVE", "not_active"],
    ["DELEGATION_NOT_AUTHORIZED", "not_authorized"],
  ];
  return known.find(([key]) => message.includes(key))?.[1] ?? "write_failed";
}

export async function createDelegation(_: DelegationResult, formData: FormData): Promise<DelegationResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "session_expired" };

  const delegateEmail = String(formData.get("delegate_email") ?? "").trim();
  const scope = String(formData.get("scope") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!delegateEmail) return { error: "delegate_required" };
  if (!scope) return { error: "scope_required" };
  if (!reason) return { error: "reason_required" };
  if (!startsAt || !endsAt) return { error: "dates_required" };

  const { error } = await sb.rpc("create_delegation_by_email", {
    p_delegate_email: delegateEmail,
    p_scope: scope,
    p_reason: reason,
    p_starts_at: new Date(startsAt).toISOString(),
    p_ends_at: new Date(endsAt).toISOString(),
  });
  if (error) { logProviderError("delegation create", error); return { error: databaseCode(error) }; }
  revalidatePath("/admin/delegation");
  return { ok: true };
}

export async function revokeDelegation(_: DelegationResult, formData: FormData): Promise<DelegationResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "session_expired" };

  const id = String(formData.get("delegation_id") ?? "");
  const reason = String(formData.get("revoke_reason") ?? "").trim();
  if (!id) return { error: "missing_reference" };
  if (!reason) return { error: "revoke_reason_required" };

  const { error } = await sb.rpc("revoke_delegation", { p_delegation: id, p_reason: reason });
  if (error) { logProviderError("delegation revoke", error); return { error: databaseCode(error) }; }
  revalidatePath("/admin/delegation");
  return { ok: true };
}
