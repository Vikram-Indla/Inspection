"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";

export type GisResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;
const LAYER_TYPES = ["base", "overlay", "boundary", "heat", "route"];

export async function createGisLayer(_: GisResult, formData: FormData): Promise<GisResult> {
  if (resolveFeatureFlag(process.env.FEATURE_SPATIAL_CANVAS, MODES, "off") !== "on") return { error: "flag_off" };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "expired" };

  const layer_key = String(formData.get("layer_key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const layer_type = String(formData.get("layer_type") ?? "").trim();
  if (!layer_key || !label) return { error: "required" };
  if (!LAYER_TYPES.includes(layer_type)) return { error: "invalid_type" };

  const { error } = await sb.from("gis_layers").insert({ layer_key, label, layer_type, created_by: user.id });
  if (error) { logProviderError("gis layer create", error); return { error: NEUTRAL_WRITE_ERROR }; }

  revalidatePath("/admin/gis/spatial");
  return { ok: true };
}
