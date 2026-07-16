"use server";
// DEF-PRF-003 — Profile Settings, approved extent only: personal details
// (read-only), language (existing /locale cookie route), light/dark
// (existing ThemeToggle), notification channel preferences, session info.
// Never role self-grant or unrestricted identity editing — this file writes
// notification_preferences only, nothing on profiles/user_roles.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type ProfileResult = { error?: string; ok?: boolean };

export async function saveNotificationPreferences(_: ProfileResult, formData: FormData): Promise<ProfileResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const push_enabled = formData.get("push_enabled") === "on";
  const sms_enabled = formData.get("sms_enabled") === "on";
  const email_enabled = formData.get("email_enabled") === "on";

  const { error } = await sb.from("notification_preferences").upsert({
    user_id: user.id, push_enabled, sms_enabled, email_enabled, updated_at: new Date().toISOString(),
  });
  if (error) { logProviderError("profile notification preferences", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/profile");
  return { ok: true };
}
