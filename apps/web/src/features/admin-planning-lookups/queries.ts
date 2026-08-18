import { LOOKUP_KINDS } from "@/app/(app)/admin/planning/lookups/constants";
import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type LookupRow = {
  id: string;
  kind: string;
  key: string;
  label_en: string;
  label_ar: string | null;
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
};

export type PlanningLookupsData = {
  rows: readonly LookupRow[];
  kinds: readonly string[];
  canConfigure: boolean;
  readFailed: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function loadPlanningLookups(): Promise<PlanningLookupsData> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: canConfigureLookups, error: gateError } = user
    ? await sb.rpc("has_planning_capability", { p_capability: "planning.configure_lookups" })
    : { data: false, error: null };
  if (gateError) logProviderError("admin planning lookups gate", gateError);

  const { data, error } = await sb
    .from("planning_lookups")
    .select("id, kind, key, label_en, label_ar, is_active, sort_order, metadata")
    .order("kind")
    .order("sort_order")
    .order("key");
  if (error) logProviderError("admin planning lookups read", error);

  const rows = ((data ?? []) as LookupRow[]).map(row => ({
    ...row,
    metadata: isRecord(row.metadata) ? row.metadata : {},
  }));

  return {
    rows,
    kinds: [...LOOKUP_KINDS],
    canConfigure: canConfigureLookups === true,
    readFailed: Boolean(error),
  };
}
