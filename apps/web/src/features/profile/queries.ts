import { getUserRoles } from "@/lib/persona";
import type { supabaseServer } from "@/lib/supabase-server";

type Client = Awaited<ReturnType<typeof supabaseServer>>;

export type ProfileData = {
  fullName: string | null;
  email: string | null;
  region: string | null;
  roles: readonly string[];
  prefs: { push: boolean; sms: boolean; email: boolean };
  issuedAtMs: number | null;
  expiresAtMs: number | null;
};

export async function loadProfile(sb: Client, userId: string, fallbackEmail: string | null): Promise<ProfileData> {
  const [{ data: profile }, { data: roleRows }, { data: pref }, { data: claimsData }] = await Promise.all([
    sb.from("profiles").select("full_name, email, region").eq("user_id", userId).maybeSingle(),
    getUserRoles(userId),
    sb.from("notification_preferences").select("push_enabled, sms_enabled, email_enabled").eq("user_id", userId).maybeSingle(),
    sb.auth.getClaims(),
  ]);
  const claims = claimsData?.claims;
  const iat = typeof claims?.iat === "number" ? claims.iat : null;
  const exp = typeof claims?.exp === "number" ? claims.exp : null;

  return {
    fullName: profile?.full_name ?? null,
    email: profile?.email ?? fallbackEmail,
    region: profile?.region ?? null,
    roles: (roleRows ?? []).map((row: { role_key: string }) => row.role_key),
    prefs: {
      push: pref?.push_enabled ?? true,
      sms: pref?.sms_enabled ?? true,
      email: pref?.email_enabled ?? true,
    },
    issuedAtMs: iat != null ? iat * 1000 : null,
    expiresAtMs: exp != null ? exp * 1000 : null,
  };
}
