"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { useT } from "@/lib/i18n";

export type GisResult = { error?: string; ok?: boolean };

// SB20 / ENG-08 — per-factory geofence radius override. Official coordinates
// and fences are GIS-Admin-owned (FND-007); RLS policy factories_update is
// the authority — errors are surfaced verbatim, never bypassed.
export async function updateGeofenceRadius(_: GisResult, formData: FormData): Promise<GisResult> {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: t("gis.action.expired", "Session expired — sign in again.") };

  const factory_id = String(formData.get("factory_id") ?? "");
  const raw = String(formData.get("geofence_radius_m") ?? "").trim();
  const radius = Number(raw);
  if (!factory_id) return { error: t("gis.action.noFactory", "No factory selected.") };
  if (!raw || !Number.isFinite(radius) || radius <= 0) return { error: t("gis.action.badRadius", "A positive radius in metres is required.") };

  const { data, error } = await sb.from("factories")
    .update({ geofence_radius_m: Math.round(radius) })
    .eq("id", factory_id)
    .select("id");
  if (error) { logProviderError("admin GIS", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: t("gis.action.rls", "Update blocked by RLS (factories_update) — gis_admin role required.") };

  revalidatePath("/admin/gis");
  return { ok: true };
}
