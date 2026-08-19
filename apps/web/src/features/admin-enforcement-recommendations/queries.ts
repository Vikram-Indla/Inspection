import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getUserRoles } from "@/lib/persona";
import type { DecidedRow, EnforcementView, PendingFactory, PendingRow } from "./types";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

const EMPTY_VIEW = (roleError: boolean, isReader: boolean, isDecider: boolean, canDecide: boolean): EnforcementView => ({
  roleError, isReader, isDecider, canDecide, pending: [], decided: [], pendingError: false, decidedError: false,
});

function firstFactory(relation: unknown): PendingFactory {
  if (Array.isArray(relation)) return firstFactory(relation[0]);
  if (relation && typeof relation === "object") {
    const record = relation as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : "",
      factory_code: typeof record.factory_code === "string" ? record.factory_code : null,
      city: typeof record.city === "string" ? record.city : null,
      region: typeof record.region === "string" ? record.region : null,
    };
  }
  return null;
}

export async function loadEnforcementRecommendations(): Promise<EnforcementView> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: roleRows, error: roleError } = user
    ? await getUserRoles(user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = (roleRows ?? []).map(row => row.role_key);
  const isDecider = roles.includes("supervisor") || roles.includes("admin");
  const canDecide = roles.includes("supervisor");
  const isReader = isDecider || roles.includes("inspector") || roles.includes("planner");

  if (roleError || !isReader) return EMPTY_VIEW(Boolean(roleError), isReader, isDecider, canDecide);

  const [pendingRead, decidedRead] = await Promise.all([
    sb.from("enforcement_recommendations")
      .select("id, factory_id, visit_id, recommended_action, recommendation_notes, recommended_by, recommended_at, factories!inner(name, factory_code, city, region)")
      .eq("status", "pending")
      .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
      .order("recommended_at", { ascending: true }),
    isDecider
      ? sb.from("enforcement_recommendations")
          .select("id, factories!inner(name,factory_code), recommended_action, status, decided_at, decision_reason")
          .neq("status", "pending")
          .in("factories.factory_code", [...CLEAN_FACTORY_CODES])
          .order("decided_at", { ascending: false }).limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const pending: PendingRow[] = (pendingRead.data ?? []).map(row => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      factory_id: String(record.factory_id),
      visit_id: typeof record.visit_id === "string" ? record.visit_id : null,
      recommended_action: String(record.recommended_action),
      recommendation_notes: typeof record.recommendation_notes === "string" ? record.recommendation_notes : null,
      recommended_by: String(record.recommended_by),
      recommended_at: String(record.recommended_at),
      factory: firstFactory(record.factories),
    };
  });

  const decided: DecidedRow[] = (decidedRead.data ?? []).map(row => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      factoryName: firstFactory(record.factories)?.name ?? null,
      recommended_action: String(record.recommended_action),
      status: String(record.status),
      decided_at: typeof record.decided_at === "string" ? record.decided_at : null,
      decision_reason: typeof record.decision_reason === "string" ? record.decision_reason : null,
    };
  });

  return {
    roleError: false, isReader, isDecider, canDecide,
    pending, decided,
    pendingError: Boolean(pendingRead.error),
    decidedError: Boolean(decidedRead.error),
  };
}
