import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import type { SlaCalendar, WorkflowsView, WorkflowVersion } from "./types";

type VersionRow = {
  id: string;
  version_label: string;
  status: string;
  payload: unknown;
  created_at: string | null;
  created_by: string | null;
  approved_by: string | null;
};

function payloadObject(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "object" in payload) {
    const value = (payload as { object: unknown }).object;
    return typeof value === "string" ? value : null;
  }
  return null;
}

export async function loadWorkflows(): Promise<WorkflowsView> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const [versionsRead, calendarsRead] = await Promise.all([
    sb.from("config_versions")
      .select("id, version_label, status, payload, effective_from, created_at, created_by, approved_by")
      .eq("engine", "workflow").order("effective_from", { ascending: false }),
    sb.from("sla_calendars")
      .select("id, name, version_label, timezone, working_days, working_start, working_end, activation_authorized")
      .order("name"),
  ]);

  const rows = (versionsRead.data ?? []) as VersionRow[];
  const chainIds = [...new Set(rows.flatMap(row => [row.created_by, row.approved_by]).filter((id): id is string => Boolean(id)))];
  const profiles = chainIds.length
    ? (await sb.from("profiles").select("user_id, full_name").in("user_id", chainIds)).data ?? []
    : [];
  const nameOf = (uid: string | null): string | null =>
    uid ? (profiles.find(p => p.user_id === uid)?.full_name ?? `${uid.slice(0, 8)}…`) : null;

  const versions: WorkflowVersion[] = rows.map(row => ({
    id: row.id,
    version_label: row.version_label,
    status: row.status,
    payload: row.payload,
    object: payloadObject(row.payload),
    created_at: row.created_at,
    proposedByName: nameOf(row.created_by),
    approvedByName: nameOf(row.approved_by),
    isOwnDraft: row.status === "draft" && Boolean(user) && row.created_by === user?.id,
  }));

  return {
    versions,
    calendars: (calendarsRead.data ?? []) as SlaCalendar[],
    loadError: Boolean(versionsRead.error),
    calError: Boolean(calendarsRead.error),
  };
}
