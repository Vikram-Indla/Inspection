import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type FieldSettingsData = {
  userId: string;
  appVersion: string | null;
};

export async function loadFieldSettings(): Promise<FieldSettingsData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) return null;

  return {
    userId: user.id,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
  };
}
