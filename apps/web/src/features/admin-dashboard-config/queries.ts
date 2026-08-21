import type { supabaseServer } from "@/lib/supabase-server";
import { CONFIG_DOMAINS, type ActiveVersion, type DashboardConfigRead, type DraftRow, type InFlight } from "./types";

type Client = Awaited<ReturnType<typeof supabaseServer>>;

type KpiRow = { metric_key: string };
type HeadRow = { config_key: string; current_version_id: string };
type VersionRow = { id: string; config_key: string; version_number: number; effective_from: string };

const WRITE_ROLES = ["admin", "supervisor"];

export async function loadDashboardConfig(sb: Client): Promise<DashboardConfigRead> {
  const [kpiRead, headRead, versionRead, paramRead, roleRead, userRead] = await Promise.all([
    sb.from("mvp3_kpi_definitions").select("metric_key").order("metric_key"),
    sb.from("dashboard_config_heads").select("config_key,current_version_id,activated_at"),
    sb.from("dashboard_config_versions").select("id,config_key,version_number,effective_from"),
    sb.from("dashboard_config_parameters").select("id,config_key,title,status,revision,owner_id,return_reason").order("updated_at", { ascending: false }),
    sb.from("user_roles").select("role_key"),
    sb.auth.getUser(),
  ]);

  const migrationApplied = !kpiRead.error && !headRead.error && !paramRead.error;
  const heads = (headRead.data ?? []) as HeadRow[];
  const versions = (versionRead.data ?? []) as VersionRow[];
  const drafts = (paramRead.data ?? []) as DraftRow[];
  const roleKeys = new Set((roleRead.data ?? []).map((row: { role_key: string }) => row.role_key));
  const userId = userRead.data.user?.id ?? null;

  const versionById = new Map(versions.map(version => [version.id, version]));
  const headByKey = new Map(heads.map(head => [head.config_key, head]));

  const activeByDomain: Record<string, ActiveVersion | null> = {};
  const inFlightByDomain: Record<string, InFlight | null> = {};
  for (const domain of CONFIG_DOMAINS) {
    const head = headByKey.get(domain);
    const active = head ? versionById.get(head.current_version_id) : undefined;
    activeByDomain[domain] = active ? { versionNumber: active.version_number, effectiveFrom: active.effective_from } : null;
    const draft = drafts.find(row => row.config_key === domain && ["draft", "pending_review", "returned"].includes(row.status));
    inFlightByDomain[domain] = draft ? { status: draft.status, revision: draft.revision } : null;
  }

  return {
    migrationApplied,
    seededMetricKeys: (kpiRead.data ?? []).map((row: KpiRow) => row.metric_key),
    activeByDomain,
    inFlightByDomain,
    drafts,
    canWrite: WRITE_ROLES.some(role => roleKeys.has(role)),
    canReview: roleKeys.has("admin"),
    userId,
  };
}
