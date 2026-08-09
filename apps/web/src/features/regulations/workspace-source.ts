import { supabaseServer } from "@/lib/supabase-server";

export type WorkspaceItem = { id: string; code: string; title: string; clauseRef: string | null };
export type WorkspaceViolation = { id: string; code: string; title: string; level: string };
export type WorkspacePenalty = { id: string; penalty_ref: string; mapping_version: string };
export type WorkspaceVersion = { id: string; version_number: number; published_at: string | null };
export type WorkspaceAuditEvent = { id: number; action: string; occurred_at: string; actor: string | null };

export type WorkspaceRegulation = {
  entity_id: string;
  current_version_id: string | null;
  version_number: number | null;
  request_id: string | null;
  code: string | null;
  title: string | null;
  issuing_authority: string | null;
  operational_status: string;
  version_label: string | null;
  release_date: string | null;
  published_at: string | null;
  clauses_status: "verified" | "verified_unknown";
  clauses: Array<{ id: string; clause_ref: string | null; inspection_items: Array<{ id: string; code: string; title: string }> | null }> | null;
};

export type RegulationWorkspace = {
  readonly regulation: WorkspaceRegulation;
  readonly clauseCount: number | null;
  readonly itemCount: number | null;
  readonly items: readonly WorkspaceItem[];
  readonly violations: readonly WorkspaceViolation[];
  readonly penalties: readonly WorkspacePenalty[];
  readonly versions: readonly WorkspaceVersion[];
  readonly auditEvents: readonly WorkspaceAuditEvent[];
  readonly violationsUnavailable: boolean;
  readonly penaltiesUnavailable: boolean;
  readonly versionsUnavailable: boolean;
  readonly auditUnavailable: boolean;
};

const COLUMNS =
  "entity_id,current_version_id,version_number,request_id,code,title,issuing_authority,operational_status,version_label,release_date,published_at,clauses,clauses_status";

/**
 * Everything the six-tab workspace renders for one regulation. Each read
 * reports its own failure so a tab can say "unavailable" instead of "no
 * records" — an unreadable tab is not an empty one.
 */
export async function readRegulationWorkspace(selectedId: string): Promise<RegulationWorkspace | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from("compliance_regulation_library").select(COLUMNS).eq("entity_id", selectedId).maybeSingle();
  const regulation = data as unknown as WorkspaceRegulation | null;
  if (!regulation) return null;

  const clausesVerified = regulation.clauses_status === "verified" && Array.isArray(regulation.clauses);
  const clauses = clausesVerified ? regulation.clauses ?? [] : [];
  const itemsVerified = clausesVerified && clauses.every(clause => Array.isArray(clause.inspection_items));
  const items = clauses.flatMap(clause =>
    (clause.inspection_items ?? []).map(item => ({ ...item, clauseRef: clause.clause_ref })));
  const clauseIds = clauses.map(clause => clause.id);

  const [violationRead, auditRead, versionRead] = await Promise.all([
    clauseIds.length
      ? sb.from("violation_codes").select("id,code,title,level").in("clause_id", clauseIds)
      : Promise.resolve({ data: [], error: clausesVerified ? null : { message: "CLAUSES_UNAVAILABLE" } }),
    sb.rpc("compliance_regulation_audit", { p_entity_id: regulation.entity_id }),
    sb.from("compliance_entity_versions")
      .select("id,version_number,published_at")
      .eq("entity_kind", "regulation")
      .eq("entity_id", regulation.entity_id)
      .order("version_number", { ascending: false }),
  ]);

  const violations = (violationRead.data ?? []) as unknown as WorkspaceViolation[];
  const penaltyRead = violations.length
    ? await sb.from("penalty_mappings").select("id,violation_code_id,penalty_ref,mapping_version")
        .in("violation_code_id", violations.map(violation => violation.id))
    : { data: [], error: null };

  const recorded = (versionRead.data ?? []) as unknown as WorkspaceVersion[];
  const versions = !versionRead.error && recorded.length === 0 && regulation.version_number
    ? [{
        id: regulation.current_version_id ?? regulation.entity_id,
        version_number: regulation.version_number,
        published_at: regulation.published_at,
      }]
    : recorded;

  return {
    regulation,
    clauseCount: clausesVerified ? clauses.length : null,
    itemCount: itemsVerified ? items.length : null,
    items,
    violations,
    penalties: (penaltyRead.data ?? []) as unknown as WorkspacePenalty[],
    versions,
    auditEvents: (Array.isArray(auditRead.data) ? auditRead.data : []) as WorkspaceAuditEvent[],
    violationsUnavailable: Boolean(violationRead.error),
    penaltiesUnavailable: Boolean(violationRead.error || penaltyRead.error),
    versionsUnavailable: Boolean(versionRead.error),
    auditUnavailable: Boolean(auditRead.error),
  };
}
