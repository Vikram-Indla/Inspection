"use server";
// M9 / PLN-CON-012 — governed CRUD over planning_lookups for actors with
// planning.configure_lookups. RLS (planning_lookups_write /
// planning_lookups_update) remains the authority; this layer re-checks the
// capability, validates shape, and keeps metadata honest:
//   • known eligibility flags (manual_entry_allowed, attachment_required,
//     location_required, comments_required) ride as guided checkboxes —
//     checked sets the key true, unchecked REMOVES it (absence == false for
//     every consumer, e.g. the M8 reason validator);
//   • unknown metadata keys already on the row are preserved;
//   • the raw-JSON escape hatch REPLACES the whole metadata object after
//     validation (plain object, no arrays/scalars).
// Rows are never deleted (RLS grants no delete) — deactivation via is_active
// is the governed retirement. Every write is audited by
// trg_audit_planning_lookups (20260721030100).
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { KNOWN_METADATA_FLAGS, LOOKUP_KINDS } from "./constants";

export type LookupResult = { ok?: string; error?: string };

const KEY_RE = /^[a-z0-9_]{1,60}$/;

async function gate(sb: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return "Your session has ended. Sign in again.";
  const { data: allowed, error } = await sb.rpc("has_planning_capability", { p_capability: "planning.configure_lookups" });
  if (error) {
    logProviderError("lookups gate", error);
    return NEUTRAL_WRITE_ERROR;
  }
  if (allowed !== true) return "You do not have permission to configure planning lookups (planning.configure_lookups required).";
  return null;
}

// Builds the next metadata object: existing unknown keys survive, guided
// checkboxes set/remove the known flags, and a non-empty raw-JSON override
// replaces everything (validated as a plain object).
function buildMetadata(fd: FormData, existing: Record<string, unknown>): { metadata?: Record<string, unknown>; error?: string } {
  const raw = String(fd.get("metadata_json") ?? "").trim();
  if (raw) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      return { error: "The raw metadata override is not valid JSON. Nothing was changed." };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { error: "The raw metadata override must be a JSON object ({ … }). Nothing was changed." };
    }
    return { metadata: parsed as Record<string, unknown> };
  }
  const metadata: Record<string, unknown> = { ...existing };
  for (const flag of KNOWN_METADATA_FLAGS) {
    if (fd.get(`flag_${flag}`) === "1") metadata[flag] = true;
    else delete metadata[flag];
  }
  return { metadata };
}

export async function saveLookup(fd: FormData): Promise<LookupResult> {
  const sb = await supabaseServer();
  const denied = await gate(sb);
  if (denied) return { error: denied };

  const id = String(fd.get("lookup_id") ?? "").trim();
  const kind = String(fd.get("kind") ?? "").trim();
  const key = String(fd.get("key") ?? "").trim();
  const labelEn = String(fd.get("label_en") ?? "").trim();
  const labelAr = String(fd.get("label_ar") ?? "").trim();
  const sortOrder = Number.parseInt(String(fd.get("sort_order") ?? "0"), 10);
  if (!(LOOKUP_KINDS as readonly string[]).includes(kind)) return { error: "Choose a governed lookup kind. Nothing was changed." };
  if (!KEY_RE.test(key)) return { error: "The key must be lowercase snake_case (a–z, 0–9, _). Nothing was changed." };
  if (!labelEn) return { error: "An English label is required. Nothing was changed." };
  if (Number.isNaN(sortOrder)) return { error: "Sort order must be a number. Nothing was changed." };

  let existingMetadata: Record<string, unknown> = {};
  if (id) {
    const { data: row, error } = await sb.from("planning_lookups").select("id, metadata").eq("id", id).maybeSingle();
    if (error) { logProviderError("lookup read", error); return { error: NEUTRAL_WRITE_ERROR }; }
    if (!row) return { error: "That lookup row no longer exists. Nothing was changed." };
    existingMetadata = (row.metadata ?? {}) as Record<string, unknown>;
  }
  const built = buildMetadata(fd, existingMetadata);
  if (built.error) return { error: built.error };

  const patch = {
    kind, key, label_en: labelEn, label_ar: labelAr || null,
    sort_order: sortOrder, metadata: built.metadata ?? {},
  };
  if (id) {
    const { error } = await sb.from("planning_lookups").update(patch).eq("id", id);
    if (error) {
      if (error.code === "23505") return { error: `The key “${key}” already exists in kind “${kind}” — keys are unique per kind. Nothing was changed.` };
      logProviderError("lookup update", error);
      return { error: NEUTRAL_WRITE_ERROR };
    }
    revalidatePath("/admin/planning/lookups");
    return { ok: `Lookup “${kind}.${key}” updated — audited; consumers see it on their next read.` };
  }
  const { error } = await sb.from("planning_lookups").insert({ ...patch, is_active: true });
  if (error) {
    if (error.code === "23505") return { error: `The key “${key}” already exists in kind “${kind}” — edit that row instead. Nothing was changed.` };
    logProviderError("lookup insert", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/planning/lookups");
  return { ok: `Lookup “${kind}.${key}” added as ACTIVE — audited; it appears in governed selects on their next load.` };
}

export async function setLookupActive(fd: FormData): Promise<LookupResult> {
  const sb = await supabaseServer();
  const denied = await gate(sb);
  if (denied) return { error: denied };
  const id = String(fd.get("lookup_id") ?? "").trim();
  const active = String(fd.get("active") ?? "") === "1";
  if (!id) return { error: "Missing lookup id. Nothing was changed." };
  const { data: updated, error } = await sb.from("planning_lookups")
    .update({ is_active: active }).eq("id", id).select("kind, key");
  if (error) { logProviderError("lookup active toggle", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!updated?.length) return { error: "That lookup row no longer exists or RLS denied the update. Nothing was changed." };
  revalidatePath("/admin/planning/lookups");
  const { kind, key } = updated[0] as { kind: string; key: string };
  return {
    ok: active
      ? `“${kind}.${key}” reactivated — it appears in governed selects on their next load.`
      : `“${kind}.${key}” deactivated (never deleted) — governed selects only read active rows, so it disappears on their next load.`,
  };
}
