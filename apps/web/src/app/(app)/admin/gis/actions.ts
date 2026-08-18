"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type GisResult = { error?: string; ok?: boolean };

export async function updateGeofenceRadius(_: GisResult, formData: FormData): Promise<GisResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "expired" };

  const factory_id = String(formData.get("factory_id") ?? "");
  const raw = String(formData.get("geofence_radius_m") ?? "").trim();
  const radius = Number(raw);
  if (!factory_id) return { error: "no_factory" };
  if (!raw || !Number.isFinite(radius) || radius <= 0) return { error: "bad_radius" };

  const { data, error } = await sb.from("factories")
    .update({ geofence_radius_m: Math.round(radius) })
    .eq("id", factory_id)
    .select("id");
  if (error) { logProviderError("admin GIS", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "rls" };

  revalidatePath("/admin/gis");
  return { ok: true };
}
