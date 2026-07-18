"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";

// TASK-MVP2-M2-06-SPATIAL-GIS-001 · MVP2-REQ-0087..0108 · CD-045.
// Create an additive GIS layer (RLS: gis_admin). The authoritative factory pin is
// never touched here (FND-007). No geofence/accuracy VALUE is invented.
export type GisResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;
const LAYER_TYPES = ["base", "overlay", "boundary", "heat", "route"];

export async function createGisLayer(_: GisResult, formData: FormData): Promise<GisResult> {
  if (resolveFeatureFlag(process.env.FEATURE_SPATIAL_CANVAS, MODES, "off") !== "on")
    return { error: "Spatial canvas is feature-flagged off (FEATURE_SPATIAL_CANVAS)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const layer_key = String(formData.get("layer_key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const layer_type = String(formData.get("layer_type") ?? "").trim();
  if (!layer_key || !label) return { error: "A layer key and label are required." };
  if (!LAYER_TYPES.includes(layer_type)) return { error: "Invalid layer type." };
  const { error } = await sb.from("gis_layers").insert({ layer_key, label, layer_type, created_by: user.id });
  if (error) { logProviderError("gis layer create", error); return { error: `${NEUTRAL_WRITE_ERROR} (gis_admin scope required).` }; }
  return { ok: true };
}
