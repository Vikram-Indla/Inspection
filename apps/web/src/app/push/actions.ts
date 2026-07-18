"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

// TASK-MVP2-M2-02 notification delivery, push channel.
// A user registers their OWN subscription (RLS: push_subscriptions_own_insert
// requires auth.uid() = user_id — self-registration only, never on behalf of
// another user). Re-subscribing with a changed endpoint is upsert-safe via the
// unique endpoint constraint.
export type PushResult = { error?: string; ok?: boolean };

export async function subscribeToPush(sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<PushResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { error: "Invalid push subscription." };
  const { error } = await sb.from("push_subscriptions").upsert({
    user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth,
    last_used_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) { logProviderError("push subscribe", error); return { error: NEUTRAL_WRITE_ERROR }; }
  return { ok: true };
}

export async function unsubscribeFromPush(endpoint: string): Promise<PushResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const { error } = await sb.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  if (error) { logProviderError("push unsubscribe", error); return { error: NEUTRAL_WRITE_ERROR }; }
  return { ok: true };
}
