"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type DelegationResult = { ok?: boolean; error?: string };

function databaseMessage(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  const known: Array<[string, string]> = [
    ["DELEGATION_SELF_NOT_ALLOWED", "You cannot delegate to yourself."],
    ["DELEGATION_REASON_REQUIRED", "A reason is required."],
    ["DELEGATION_WINDOW_INVALID", "The end date must be after the start date."],
    ["DELEGATION_SCOPE_NOT_HELD", "You can only delegate a role you currently hold."],
    ["DELEGATION_DELEGATE_NOT_FOUND", "That delegate could not be found in your authorized scope."],
    ["DELEGATION_NOT_FOUND", "That delegation could not be found."],
    ["DELEGATION_NOT_ACTIVE", "Only an active delegation can be revoked."],
    ["DELEGATION_NOT_AUTHORIZED", "Only the delegator or an Admin can revoke this delegation."],
  ];
  return known.find(([key]) => message.includes(key))?.[1] ?? NEUTRAL_WRITE_ERROR;
}

export async function createDelegation(_: DelegationResult, formData: FormData): Promise<DelegationResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const delegateEmail = String(formData.get("delegate_email") ?? "").trim();
  const scope = String(formData.get("scope") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!delegateEmail) return { error: "The delegate's email is required." };
  if (!scope) return { error: "A scope is required." };
  if (!reason) return { error: "A reason is required." };
  if (!startsAt || !endsAt) return { error: "A start and end date are required." };

  const { error } = await sb.rpc("create_delegation_by_email", {
    p_delegate_email: delegateEmail,
    p_scope: scope,
    p_reason: reason,
    p_starts_at: new Date(startsAt).toISOString(),
    p_ends_at: new Date(endsAt).toISOString(),
  });
  if (error) { logProviderError("delegation create", error); return { error: databaseMessage(error) }; }
  revalidatePath("/admin/delegation");
  return { ok: true };
}

export async function revokeDelegation(_: DelegationResult, formData: FormData): Promise<DelegationResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const id = String(formData.get("delegation_id") ?? "");
  const reason = String(formData.get("revoke_reason") ?? "").trim();
  if (!id) return { error: "Missing delegation reference." };
  if (!reason) return { error: "A revocation reason is required." };

  const { error } = await sb.rpc("revoke_delegation", { p_delegation: id, p_reason: reason });
  if (error) { logProviderError("delegation revoke", error); return { error: databaseMessage(error) }; }
  revalidatePath("/admin/delegation");
  return { ok: true };
}
