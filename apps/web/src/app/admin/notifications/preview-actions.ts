"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";
import { safeTestPreview, resolveLanguage, type Language, type TestPreview } from "@/lib/workflow/notifications";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0034.
// Safe notification test preview — renders the bilingual template with a sample
// payload and NEVER sends anything (sent:false). Reused by the studio's NTF-02
// test action. No provider I/O, no notifications row written.

export type PreviewResult = { error?: string; preview?: TestPreview };

export async function previewNotificationTemplate(
  ruleId: string,
  language: string,
  samplePayload: Record<string, unknown>,
): Promise<PreviewResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const { data: rule, error } = await sb.from("notification_rules")
    .select("template, template_ar").eq("id", ruleId).maybeSingle();
  if (error) { logProviderError("notification preview read", error); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!rule) return { error: "Notification rule not found." };

  const lang: Language = resolveLanguage(language);
  return { preview: safeTestPreview(rule, lang, samplePayload ?? {}) };
}
