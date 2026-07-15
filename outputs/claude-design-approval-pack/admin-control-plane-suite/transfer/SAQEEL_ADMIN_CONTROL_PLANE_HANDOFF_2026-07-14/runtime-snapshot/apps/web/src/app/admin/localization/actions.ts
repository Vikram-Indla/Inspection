"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type L10nResult = { error?: string; ok?: boolean };

// SCR-ADM-100 · SB19 — ui_strings is the live Arabic dictionary consumed by
// src/lib/i18n.ts (30s TTL cache). RLS is the authority: world read;
// writes = compliance_admin / security_admin / workflow_admin. Errors are
// surfaced verbatim; a 0-row update means RLS filtered the write silently.

export async function saveTranslation(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const key = String(formData.get("key") ?? "").trim();
  if (!key) return { error: "Missing key." };
  const arRaw = String(formData.get("ar") ?? "").trim();
  const ar = arRaw === "" ? null : arRaw;

  // Any Arabic edit returns the string to draft — reviewed status only ever
  // re-applies through an explicit "Mark reviewed" pass.
  const { data, error } = await sb.from("ui_strings")
    .update({ ar, status: "draft", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select("key");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "No row updated — key not found or RLS denied the write (compliance_admin / security_admin / workflow_admin only)." };
  }
  revalidatePath("/admin/localization");
  return { ok: true };
}

export async function markReviewed(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const key = String(formData.get("key") ?? "").trim();
  if (!key) return { error: "Missing key." };

  // Guard: a string without Arabic cannot be reviewed (SB19 Arabic scope).
  const { data, error } = await sb.from("ui_strings")
    .update({ status: "reviewed", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("key", key)
    .not("ar", "is", null)
    .select("key");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Not marked — Arabic is empty, the key is unknown, or RLS denied the write." };
  }
  revalidatePath("/admin/localization");
  return { ok: true };
}

export async function addKey(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const key = String(formData.get("key") ?? "").trim();
  const en = String(formData.get("en") ?? "").trim();
  const arRaw = String(formData.get("ar") ?? "").trim();
  const contextRaw = String(formData.get("context") ?? "").trim();
  if (!key || !en) return { error: "Key and English source are required." };
  if (/\s/.test(key)) return { error: "Key must be dot.case with no whitespace (e.g. nav.planning)." };

  const { error } = await sb.from("ui_strings").insert({
    key,
    en,
    ar: arRaw === "" ? null : arRaw,
    context: contextRaw === "" ? null : contextRaw,
    status: "draft",
    updated_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/localization");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sync from code (self-hosted: server scans its own source tree) — new keys
// insert as draft, EN drift updates (trigger snapshots history + downgrades
// reviewed→draft), removed keys flag orphaned, reappearing keys revive.
// ---------------------------------------------------------------------------
import { scanCodeForKeys, planSync, type SyncReport } from "@/lib/i18n-sync";

export type SyncResult = { error?: string; ok?: boolean; report?: SyncReport };

export async function syncFromCode(_: SyncResult, __: FormData): Promise<SyncResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  let code;
  try { code = scanCodeForKeys(); }
  catch (e) { return { error: `Source scan unavailable on this host: ${String((e as Error).message)}` }; }

  const { data: db, error: dbErr } = await sb.from("ui_strings").select("key, en, orphaned");
  if (dbErr) return { error: dbErr.message };
  const plan = planSync(code, db ?? []);

  if (plan.inserts.length) {
    const { error } = await sb.from("ui_strings").insert(
      plan.inserts.map(p => ({ key: p.key, en: p.en, status: "draft", updated_by: user.id })));
    if (error) return { error: `insert: ${error.message}` };
  }
  for (const p of plan.enUpdates) {
    const { error } = await sb.from("ui_strings")
      .update({ en: p.en, updated_by: user.id, updated_at: new Date().toISOString() }).eq("key", p.key);
    if (error) return { error: `en-update ${p.key}: ${error.message}` };
  }
  if (plan.orphanKeys.length) {
    const { error } = await sb.from("ui_strings")
      .update({ orphaned: true, updated_by: user.id }).in("key", plan.orphanKeys);
    if (error) return { error: `orphan: ${error.message}` };
  }
  if (plan.reviveKeys.length) {
    const { error } = await sb.from("ui_strings")
      .update({ orphaned: false, updated_by: user.id }).in("key", plan.reviveKeys);
    if (error) return { error: `revive: ${error.message}` };
  }
  revalidatePath("/admin/localization");
  return { ok: true, report: plan.report };
}

// ---------------------------------------------------------------------------
// Version history (trigger-written, append-only). Panel shows the recent few;
// the full chain is preserved for audit.
// ---------------------------------------------------------------------------
export type Revision = {
  id: string; en: string; ar: string | null; status: string;
  change_source: string; changed_at: string;
};

export async function getHistory(key: string): Promise<{ error?: string; revisions?: Revision[] }> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from("ui_string_revisions")
    .select("id, en, ar, status, change_source, changed_at")
    .eq("key", key).order("changed_at", { ascending: false }).limit(5);
  if (error) return { error: error.message };
  return { revisions: data ?? [] };
}

export async function restoreRevision(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const key = String(formData.get("key") ?? "").trim();
  const revisionId = String(formData.get("revision_id") ?? "").trim();
  if (!key || !revisionId) return { error: "Missing key or revision." };

  const { data: rev, error: rErr } = await sb.from("ui_string_revisions")
    .select("key, ar").eq("id", revisionId).eq("key", key).single();
  if (rErr || !rev) return { error: rErr?.message ?? "Revision not found." };

  // Restore Arabic only (EN belongs to code); restoring re-enters review as draft.
  const { data, error } = await sb.from("ui_strings")
    .update({ ar: rev.ar, status: "draft", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("key", key).select("key");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "No row updated — RLS denied the write." };
  revalidatePath("/admin/localization");
  return { ok: true };
}
