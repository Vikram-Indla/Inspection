"use server";
import { revalidatePath } from "next/cache";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type L10nResult = { error?: string; ok?: boolean };
type Locale = "en" | "ar";
type AuthorizedLocalizationUser =
  | { userId: string; error?: never }
  | { userId?: never; error: string };

const LOCALIZATION_ROLES = ["admin"] as const;
const localeFrom = (formData: FormData): Locale => formData.get("locale") === "ar" ? "ar" : "en";
const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;
const neutralLoadError = (locale: Locale) => copy(
  locale,
  NEUTRAL_LOAD_ERROR,
  "تعذّر تحميل البيانات. لم يتغيّر شيء. حاول مرة أخرى.",
);
const neutralWriteError = (locale: Locale) => copy(
  locale,
  NEUTRAL_WRITE_ERROR,
  "تعذّر حفظ التغيير. لم يتغيّر شيء. حاول مرة أخرى.",
);
const conflictError = (locale: Locale) => copy(
  locale,
  "This string changed after you opened it. Refresh the registry and review the latest value before trying again.",
  "تغيّر هذا النص بعد فتحه. حدّث السجل وراجع أحدث قيمة قبل المحاولة مرة أخرى.",
);

function placeholderSet(value: string) {
  return new Set([...value.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]));
}

function missingPlaceholders(en: string, ar: string) {
  if (ar.trim() === "") return [];
  const arabic = placeholderSet(ar);
  return [...placeholderSet(en)].filter(token => !arabic.has(token));
}

async function requireLocalizationManager(locale: Locale): Promise<AuthorizedLocalizationUser> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) {
    if (authError) logProviderError("localization identity", authError);
    return {
      error: copy(locale, "Your session could not be verified. Sign in again.", "تعذّر التحقق من جلستك. سجّل الدخول مرة أخرى."),
    };
  }

  const { data: roleRows, error: roleError } = await getUserRoles(user.id);
  if (roleError) {
    logProviderError("localization role verification", roleError);
    return { error: neutralLoadError(locale) };
  }
  if (!(roleRows ?? []).some(row => LOCALIZATION_ROLES.includes(row.role_key as typeof LOCALIZATION_ROLES[number]))) {
    return {
      error: copy(
        locale,
        "You do not have permission to manage localization.",
        "ليست لديك صلاحية إدارة الترجمة.",
      ),
    };
  }
  return { userId: user.id };
}

// SCR-ADM-100 · SB19 — ui_strings is the live Arabic dictionary consumed by
// src/lib/i18n.ts (30s TTL cache). RLS is the authority: world read;
// writes = admin. Provider errors
// remain diagnostic-only; a 0-row update means RLS filtered the write silently.

export async function saveTranslation(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const locale = localeFrom(formData);
  const authorization = await requireLocalizationManager(locale);
  if (authorization.error) return { error: authorization.error };

  const sb = await supabaseServer();
  const key = String(formData.get("key") ?? "").trim();
  const expectedUpdatedAt = String(formData.get("expected_updated_at") ?? "").trim();
  if (!key || !expectedUpdatedAt) {
    return { error: copy(locale, "The key or version is missing. Refresh and try again.", "المفتاح أو الإصدار مفقود. حدّث الصفحة وحاول مرة أخرى.") };
  }
  const arRaw = String(formData.get("ar") ?? "").trim();
  const ar = arRaw === "" ? null : arRaw;

  const { data: current, error: readError } = await sb.from("ui_strings")
    .select("en, updated_at")
    .eq("key", key)
    .maybeSingle();
  if (readError) {
    logProviderError("localization save preflight", readError);
    return { error: neutralLoadError(locale) };
  }
  if (!current) {
    return { error: copy(locale, "This localization key no longer exists.", "لم يعد مفتاح الترجمة هذا موجودًا.") };
  }
  if (current.updated_at !== expectedUpdatedAt) return { error: conflictError(locale) };

  const missing = missingPlaceholders(current.en, ar ?? "");
  if (missing.length > 0) {
    return {
      error: copy(
        locale,
        `Placeholder {{${missing[0]}}} is missing from the Arabic. Nothing was saved.`,
        `العنصر النائب {{${missing[0]}}} مفقود من النص العربي. لم يتم الحفظ.`,
      ),
    };
  }

  // Any Arabic edit returns the string to draft — reviewed status only ever
  // re-applies through an explicit "Mark reviewed" pass.
  const { data, error } = await sb.from("ui_strings")
    .update({ ar, status: "draft", updated_by: authorization.userId, updated_at: new Date().toISOString() })
    .eq("key", key)
    .eq("updated_at", expectedUpdatedAt)
    .select("key, updated_at");
  if (error) { logProviderError("localization save", error); return { error: neutralWriteError(locale) }; }
  if (!data || data.length === 0) {
    return { error: conflictError(locale) };
  }
  revalidatePath("/admin/localization");
  return { ok: true };
}

export async function markReviewed(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const locale = localeFrom(formData);
  const authorization = await requireLocalizationManager(locale);
  if (authorization.error) return { error: authorization.error };

  const sb = await supabaseServer();
  const key = String(formData.get("key") ?? "").trim();
  const expectedUpdatedAt = String(formData.get("expected_updated_at") ?? "").trim();
  if (!key || !expectedUpdatedAt) {
    return { error: copy(locale, "The key or version is missing. Refresh and try again.", "المفتاح أو الإصدار مفقود. حدّث الصفحة وحاول مرة أخرى.") };
  }

  const { data: current, error: readError } = await sb.from("ui_strings")
    .select("en, ar, status, orphaned, updated_at")
    .eq("key", key)
    .maybeSingle();
  if (readError) {
    logProviderError("localization review preflight", readError);
    return { error: neutralLoadError(locale) };
  }
  if (!current) {
    return { error: copy(locale, "This localization key no longer exists.", "لم يعد مفتاح الترجمة هذا موجودًا.") };
  }
  if (current.updated_at !== expectedUpdatedAt) return { error: conflictError(locale) };
  if (current.orphaned) {
    return { error: copy(locale, "An orphaned key cannot be marked reviewed.", "لا يمكن اعتماد مراجعة مفتاح غير مستخدم.") };
  }
  if (!current.ar?.trim()) {
    return { error: copy(locale, "Add an Arabic translation before marking this key reviewed.", "أضف ترجمة عربية قبل اعتماد مراجعة هذا المفتاح.") };
  }
  const missing = missingPlaceholders(current.en, current.ar);
  if (missing.length > 0) {
    return {
      error: copy(
        locale,
        `Placeholder {{${missing[0]}}} is missing from the Arabic. Review was not recorded.`,
        `العنصر النائب {{${missing[0]}}} مفقود من النص العربي. لم يتم اعتماد المراجعة.`,
      ),
    };
  }

  // Guard: a string without Arabic cannot be reviewed (SB19 Arabic scope).
  const { data, error } = await sb.from("ui_strings")
    .update({ status: "reviewed", updated_by: authorization.userId, updated_at: new Date().toISOString() })
    .eq("key", key)
    .eq("updated_at", expectedUpdatedAt)
    .eq("status", "draft")
    .eq("orphaned", false)
    .select("key, updated_at");
  if (error) { logProviderError("localization review", error); return { error: neutralWriteError(locale) }; }
  if (!data || data.length === 0) {
    return { error: conflictError(locale) };
  }
  revalidatePath("/admin/localization");
  return { ok: true };
}

export async function addKey(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const locale = localeFrom(formData);
  const authorization = await requireLocalizationManager(locale);
  if (authorization.error) return { error: authorization.error };

  const sb = await supabaseServer();
  const key = String(formData.get("key") ?? "").trim();
  const en = String(formData.get("en") ?? "").trim();
  const arRaw = String(formData.get("ar") ?? "").trim();
  const contextRaw = String(formData.get("context") ?? "").trim();
  if (!key || !en) return { error: copy(locale, "Key and English source are required.", "المفتاح والنص الإنجليزي المصدر مطلوبان.") };
  if (/\s/.test(key)) return { error: copy(locale, "Key must be dot.case with no whitespace (e.g. nav.planning).", "يجب أن يكون المفتاح بصيغة dot.case دون مسافات (مثل nav.planning).") };

  const missing = missingPlaceholders(en, arRaw);
  if (missing.length > 0) {
    return {
      error: copy(
        locale,
        `Placeholder {{${missing[0]}}} is missing from the Arabic.`,
        `العنصر النائب {{${missing[0]}}} مفقود من النص العربي.`,
      ),
    };
  }

  const { error } = await sb.from("ui_strings").insert({
    key,
    en,
    ar: arRaw === "" ? null : arRaw,
    context: contextRaw === "" ? null : contextRaw,
    status: "draft",
    updated_by: authorization.userId,
  });
  if (error) { logProviderError("localization add", error); return { error: neutralWriteError(locale) }; }
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
  const locale = localeFrom(__);
  const authorization = await requireLocalizationManager(locale);
  if (authorization.error) return { error: authorization.error };

  const sb = await supabaseServer();

  let code;
  try { code = scanCodeForKeys(); }
  catch (e) {
    logProviderError("localization source scan", e);
    return { error: copy(locale, "Source scan is temporarily unavailable. Try again.", "فحص المصدر غير متاح مؤقتًا. حاول مرة أخرى.") };
  }

  const { data: db, error: dbErr } = await sb.from("ui_strings").select("key, en, orphaned");
  if (dbErr) { logProviderError("localization read", dbErr); return { error: neutralLoadError(locale) }; }
  const plan = planSync(code, db ?? []);

  if (plan.inserts.length) {
    const { error } = await sb.from("ui_strings").insert(
      plan.inserts.map(p => ({ key: p.key, en: p.en, status: "draft", updated_by: authorization.userId })));
    if (error) { logProviderError("localization sync insert", error); return { error: neutralWriteError(locale) }; }
  }
  for (const p of plan.enUpdates) {
    const { error } = await sb.from("ui_strings")
      .update({ en: p.en, updated_by: authorization.userId, updated_at: new Date().toISOString() }).eq("key", p.key);
    if (error) { logProviderError("localization sync English update", error); return { error: neutralWriteError(locale) }; }
  }
  if (plan.orphanKeys.length) {
    const { error } = await sb.from("ui_strings")
      .update({ orphaned: true, updated_by: authorization.userId }).in("key", plan.orphanKeys);
    if (error) { logProviderError("localization orphan", error); return { error: neutralWriteError(locale) }; }
  }
  if (plan.reviveKeys.length) {
    const { error } = await sb.from("ui_strings")
      .update({ orphaned: false, updated_by: authorization.userId }).in("key", plan.reviveKeys);
    if (error) { logProviderError("localization revive", error); return { error: neutralWriteError(locale) }; }
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
  change_source: string; changed_at: string; changed_by: string | null;
};

export async function getHistory(key: string, locale: Locale): Promise<{ error?: string; revisions?: Revision[] }> {
  const authorization = await requireLocalizationManager(locale);
  if (authorization.error) return { error: authorization.error };

  const sb = await supabaseServer();
  const { data, error } = await sb.from("ui_string_revisions")
    .select("id, en, ar, status, change_source, changed_at, changed_by")
    .eq("key", key).order("changed_at", { ascending: false }).limit(5);
  if (error) { logProviderError("localization history", error); return { error: neutralLoadError(locale) }; }
  return { revisions: data ?? [] };
}

export async function restoreRevision(_: L10nResult, formData: FormData): Promise<L10nResult> {
  const locale = localeFrom(formData);
  const authorization = await requireLocalizationManager(locale);
  if (authorization.error) return { error: authorization.error };

  const sb = await supabaseServer();
  const key = String(formData.get("key") ?? "").trim();
  const revisionId = String(formData.get("revision_id") ?? "").trim();
  const expectedUpdatedAt = String(formData.get("expected_updated_at") ?? "").trim();
  if (!key || !revisionId || !expectedUpdatedAt) {
    return { error: copy(locale, "The key, revision, or current version is missing. Refresh and try again.", "المفتاح أو المراجعة السابقة أو الإصدار الحالي مفقود. حدّث الصفحة وحاول مرة أخرى.") };
  }

  const { data: rev, error: rErr } = await sb.from("ui_string_revisions")
    .select("key, ar").eq("id", revisionId).eq("key", key).single();
  if (rErr || !rev) {
    if (rErr) logProviderError("localization revision", rErr);
    return { error: rErr ? neutralLoadError(locale) : copy(locale, "Revision not found.", "لم يتم العثور على المراجعة السابقة.") };
  }

  // Restore Arabic only (EN belongs to code); restoring re-enters review as draft.
  const { data, error } = await sb.from("ui_strings")
    .update({ ar: rev.ar, status: "draft", updated_by: authorization.userId, updated_at: new Date().toISOString() })
    .eq("key", key)
    .eq("updated_at", expectedUpdatedAt)
    .select("key, updated_at");
  if (error) { logProviderError("localization restore", error); return { error: neutralWriteError(locale) }; }
  if (!data || data.length === 0) return { error: conflictError(locale) };
  revalidatePath("/admin/localization");
  return { ok: true };
}
