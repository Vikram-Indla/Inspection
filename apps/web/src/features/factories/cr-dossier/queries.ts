import { supabaseServer } from "@/lib/supabase-server";
import {
  loadFactory360Dossier, resolveFactory360Permissions,
  type CommercialRegistration, type Factory360Dossier,
} from "@/lib/factory360/dossier";
import { geminiProviderState } from "@/lib/providers/ai-gemini";

export type CrVisitRow = {
  id: string;
  window_start: string;
  visit_type: string;
  planning_status: string;
  operational_state: string;
  planner_lat: number | null;
  planner_lng: number | null;
  visit_location_source: string | null;
};

export type CrTimelineRow = {
  event_key: string;
  occurred_at: string;
  object_type: string;
  object_id: string;
  source: string;
  payload: Record<string, unknown> | null;
};

export type Factory360CrData = {
  dossier: Factory360Dossier;
  cr: CommercialRegistration;
  permissions: Factory360Dossier["permissions"];
  aiProviderState: ReturnType<typeof geminiProviderState>;
  visits: CrVisitRow[];
  visitsFailed: boolean;
  timeline: CrTimelineRow[];
  timelineFailed: boolean;
};

export type Factory360CrResult =
  | { kind: "denied" }
  | { kind: "not-found"; degraded: boolean }
  | { kind: "ready"; data: Factory360CrData };

export async function loadFactory360Cr(id: string, requestedLicense: string | undefined): Promise<Factory360CrResult> {
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);
  if (!permissions["view_factory_360"]) return { kind: "denied" };

  const dossier = await loadFactory360Dossier(sb, id, requestedLicense, permissions);
  if (!dossier.found || !dossier.cr) {
    return { kind: "not-found", degraded: Boolean(dossier.crError) };
  }
  const cr = dossier.cr;

  const { factoryId } = dossier;
  const [timelineResult, visitsResult] = factoryId
    ? await Promise.all([
      sb.rpc("factory_timeline" as never, { p_factory_id: factoryId } as never),
      sb.from("visits")
        .select("id, window_start, visit_type, planning_status, operational_state, planner_lat, planner_lng, visit_location_source")
        .eq("factory_id", factoryId)
        .order("window_start", { ascending: false })
        .limit(100),
    ])
    : [{ data: [], error: null }, { data: [], error: null }];

  const rawVisits: unknown = visitsResult.data ?? [];
  const rawTimeline: unknown = timelineResult.data ?? [];

  return {
    kind: "ready",
    data: {
      dossier,
      cr,
      permissions,
      aiProviderState: geminiProviderState(),
      visits: (Array.isArray(rawVisits) ? rawVisits : []) as CrVisitRow[],
      visitsFailed: Boolean(visitsResult.error),
      timeline: (Array.isArray(rawTimeline) ? rawTimeline : []) as CrTimelineRow[],
      timelineFailed: Boolean(timelineResult.error),
    },
  };
}
