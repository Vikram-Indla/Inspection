import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";
import type { GisFactory, GisSettings, GisView } from "./types";

export async function loadGis(): Promise<GisView> {
  const sb = await supabaseServer();
  const [{ data: { user } }, engRes, facRes] = await Promise.all([
    getVerifiedUser(sb),
    sb.from("engine_settings").select("settings, version_label").eq("engine", "gis").single(),
    sb.from("factories")
      .select("id, factory_code, name, city, region, official_lat, official_lng, risk_band, risk_score, geofence_radius_m")
      .order("name"),
  ]);

  if (engRes.error) logProviderError("admin gis settings read", engRes.error);
  if (facRes.error) logProviderError("admin gis factories read", facRes.error);

  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [], error: null };
  const canEdit = (roleRead.data ?? []).some(row => row.role_key === "gis_admin");

  return {
    factories: (facRes.data ?? []) as GisFactory[],
    settings: (engRes.data?.settings ?? {}) as GisSettings,
    versionLabel: engRes.data?.version_label ?? null,
    canEdit,
    failed: Boolean(engRes.error || facRes.error),
  };
}
