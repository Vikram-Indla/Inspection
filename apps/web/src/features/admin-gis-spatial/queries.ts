import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import type { GisLayer, SpatialLocation, SpatialView } from "./types";

const MODES = ["off", "on"] as const;

export async function loadSpatial(): Promise<SpatialView> {
  if (resolveFeatureFlag(process.env.FEATURE_SPATIAL_CANVAS, MODES, "off") !== "on") {
    return { enabled: false, layers: [], locations: [], canCreate: false, failed: false };
  }

  const sb = await supabaseServer();
  const [{ data: { user } }, layersRead, locationsRead] = await Promise.all([
    getVerifiedUser(sb),
    sb.from("gis_layers").select("id, layer_key, label, layer_type, active").order("created_at", { ascending: false }),
    sb.from("factory_locations").select("id, factory_id, source, geofence_radius_m").order("created_at", { ascending: false }).limit(50),
  ]);

  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [], error: null };
  const canCreate = (roleRead.data ?? []).some(row => row.role_key === "gis_admin");

  return {
    enabled: true,
    layers: (layersRead.data ?? []) as GisLayer[],
    locations: (locationsRead.data ?? []) as SpatialLocation[],
    canCreate,
    failed: Boolean(layersRead.error || locationsRead.error),
  };
}
