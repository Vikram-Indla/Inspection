"use server";
import { supabaseServer } from "@/lib/supabase-server";

// CD-030 / SCR-WEB-320 S08-stale (STATE_MATRIX_CD-030.csv) — a lightweight,
// separately-owned server action so VersionCompare can poll for a version
// submitted after the compare surface first rendered, without needing a new
// API route or touching the page/actions files another slice is mid-editing.
// RLS-scoped like every other read in this directory; returns only the max
// version number on record, nothing else.
export async function latestVersionNumber(inspectionId: string): Promise<number | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from("submission_versions")
    .select("version_number")
    .eq("inspection_id", inspectionId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.version_number ?? null;
}
