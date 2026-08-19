"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fill, getMessages, type Messages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { KNOWN_METADATA_FLAGS, LOOKUP_KINDS } from "./constants";

export type LookupResult = { ok?: string; error?: string };

type LookupMessages = Messages["adminPlanningLookups"]["actions"];

const KEY_RE = /^[a-z0-9_]{1,60}$/;

async function copy(): Promise<LookupMessages> {
  return getMessages(await getLocale()).adminPlanningLookups.actions;
}

async function gate(sb: SupabaseClient, m: LookupMessages): Promise<string | null> {
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return m.sessionEnded;
  const { data: allowed, error } = await sb.rpc("has_planning_capability", { p_capability: "planning.configure_lookups" });
  if (error) {
    logProviderError("lookups gate", error);
    return NEUTRAL_WRITE_ERROR;
  }
  if (allowed !== true) return m.noPermission;
  return null;
}

function buildMetadata(fd: FormData, existing: Record<string, unknown>, m: LookupMessages): { metadata?: Record<string, unknown>; error?: string } {
  const raw = String(fd.get("metadata_json") ?? "").trim();
  if (raw) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      return { error: m.jsonInvalid };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { error: m.jsonNotObject };
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
  const m = await copy();
  const denied = await gate(sb, m);
  if (denied) return { error: denied };

  const id = String(fd.get("lookup_id") ?? "").trim();
  const kind = String(fd.get("kind") ?? "").trim();
  const key = String(fd.get("key") ?? "").trim();
  const labelEn = String(fd.get("label_en") ?? "").trim();
  const labelAr = String(fd.get("label_ar") ?? "").trim();
  const sortOrder = Number.parseInt(String(fd.get("sort_order") ?? "0"), 10);
  if (!(LOOKUP_KINDS as readonly string[]).includes(kind)) return { error: m.invalidKind };
  if (!KEY_RE.test(key)) return { error: m.invalidKey };
  if (!labelEn) return { error: m.labelRequired };
  if (Number.isNaN(sortOrder)) return { error: m.sortNaN };

  let existingMetadata: Record<string, unknown> = {};
  if (id) {
    const { data: row, error } = await sb.from("planning_lookups").select("id, metadata").eq("id", id).maybeSingle();
    if (error) { logProviderError("lookup read", error); return { error: NEUTRAL_WRITE_ERROR }; }
    if (!row) return { error: m.rowGone };
    existingMetadata = (row.metadata ?? {}) as Record<string, unknown>;
  }
  const built = buildMetadata(fd, existingMetadata, m);
  if (built.error) return { error: built.error };

  const patch = {
    kind, key, label_en: labelEn, label_ar: labelAr || null,
    sort_order: sortOrder, metadata: built.metadata ?? {},
  };
  if (id) {
    const { error } = await sb.from("planning_lookups").update(patch).eq("id", id);
    if (error) {
      if (error.code === "23505") return { error: fill(m.keyExistsUpdate, { key, kind }) };
      logProviderError("lookup update", error);
      return { error: NEUTRAL_WRITE_ERROR };
    }
    revalidatePath("/admin/planning/lookups");
    return { ok: fill(m.updated, { kind, key }) };
  }
  const { error } = await sb.from("planning_lookups").insert({ ...patch, is_active: true });
  if (error) {
    if (error.code === "23505") return { error: fill(m.keyExistsInsert, { key, kind }) };
    logProviderError("lookup insert", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/planning/lookups");
  return { ok: fill(m.added, { kind, key }) };
}

export async function setLookupActive(fd: FormData): Promise<LookupResult> {
  const sb = await supabaseServer();
  const m = await copy();
  const denied = await gate(sb, m);
  if (denied) return { error: denied };
  const id = String(fd.get("lookup_id") ?? "").trim();
  const active = String(fd.get("active") ?? "") === "1";
  if (!id) return { error: m.missingId };
  const { data: updated, error } = await sb.from("planning_lookups")
    .update({ is_active: active }).eq("id", id).select("kind, key");
  if (error) { logProviderError("lookup active toggle", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!updated?.length) return { error: m.rowGoneOrRls };
  revalidatePath("/admin/planning/lookups");
  const { kind, key } = updated[0] as { kind: string; key: string };
  return {
    ok: active ? fill(m.reactivated, { kind, key }) : fill(m.deactivated, { kind, key }),
  };
}
