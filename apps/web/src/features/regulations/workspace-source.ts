import { supabaseServer } from "@/lib/supabase-server";

export type WorkspaceResponseModel = {
  responses?: string[];
  mapping?: Record<string, { result?: string; violation?: string; action_form?: string }>;
  requirement?: string;
};

export type WorkspaceEvidenceRule = { on?: string; type?: string; min?: number; mandatory?: boolean } | null;

export type WorkspaceItem = {
  id: string;
  code: string;
  title: string;
  clauseRef: string | null;
  active: boolean;
  response_model: WorkspaceResponseModel | null;
  evidence_rule: WorkspaceEvidenceRule;
};

export type WorkspaceViolation = {
  id: string;
  code: string;
  title: string;
  level: string;
  status: string;
  category: string | null;
  applicability: string | null;
  corrective_action: string | null;
  grace_period_days: number | null;
};

export type WorkspacePenalty = {
  id: string;
  violation_code_id: string;
  penalty_ref: string;
  penalty_type: string | null;
  amount: number | null;
  grace_period_days: number | null;
  due_period_days: number | null;
  legal_basis: string | null;
  mapping_version: string;
  status: string;
};

export type WorkspaceVersion = {
  id: string;
  version_number: number;
  published_at: string | null;
  request_id: string | null;
};

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
  clauses: Array<{ id: string; clause_ref: string | null; legal_source: string | null }> | null;
};

export type WorkspaceTable<T> =
  | { readonly kind: "rows"; readonly rows: readonly T[] }
  | { readonly kind: "unavailable" };

export type RegulationWorkspace = {
  readonly regulation: WorkspaceRegulation;
  readonly clauseCount: number | null;
  readonly legalSources: readonly string[];
  readonly items: WorkspaceTable<WorkspaceItem>;
  readonly violations: WorkspaceTable<WorkspaceViolation>;
  readonly penalties: WorkspaceTable<WorkspacePenalty>;
  readonly versions: WorkspaceTable<WorkspaceVersion>;
  readonly auditEvents: WorkspaceTable<WorkspaceAuditEvent>;
};

const REGULATION_COLUMNS =
  "entity_id,current_version_id,version_number,request_id,code,title,issuing_authority,operational_status,version_label,release_date,published_at,clauses,clauses_status";

const VIOLATION_COLUMNS =
  "id,code,title,level,status,category,applicability,corrective_action,grace_period_days,clause_id";

const PENALTY_COLUMNS =
  "id,violation_code_id,penalty_ref,penalty_type,amount,grace_period_days,due_period_days,legal_basis,mapping_version,status";

const unavailable = { kind: "unavailable" } as const;
const table = <T>(rows: readonly T[]): WorkspaceTable<T> => ({ kind: "rows", rows });

/**
 * Everything the workspace renders for one regulation.
 *
 * Each read reports its own failure as `unavailable` rather than an empty row
 * set, so a tab can say the records could not be read instead of claiming there
 * are none. That distinction is the whole contract of this screen.
 *
 * The clause payload comes from the library view, but the **items** are read
 * directly: the view embeds only `id`/`code`/`title`, and the response model,
 * evidence rule and active flag are the columns that make an item legible.
 */
export async function readRegulationWorkspace(selectedId: string): Promise<RegulationWorkspace | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from("compliance_regulation_library")
    .select(REGULATION_COLUMNS).eq("entity_id", selectedId).maybeSingle();
  const regulation = data as unknown as WorkspaceRegulation | null;
  if (!regulation) return null;

  const clausesVerified = regulation.clauses_status === "verified" && Array.isArray(regulation.clauses);
  const clauses = clausesVerified ? regulation.clauses ?? [] : [];
  const clauseRefById = new Map(clauses.map(clause => [clause.id, clause.clause_ref]));
  const clauseIds = clauses.map(clause => clause.id);

  if (!clauseIds.length) {
    return {
      regulation,
      clauseCount: clausesVerified ? 0 : null,
      legalSources: [],
      items: clausesVerified ? table([]) : unavailable,
      violations: clausesVerified ? table([]) : unavailable,
      penalties: clausesVerified ? table([]) : unavailable,
      versions: await readVersions(sb, regulation),
      auditEvents: await readAudit(sb, regulation.entity_id),
    };
  }

  const [itemRead, violationRead, versions, auditEvents] = await Promise.all([
    sb.from("inspection_items")
      .select("id,code,title,clause_id,active,response_model,evidence_rule").in("clause_id", clauseIds).order("code"),
    sb.from("violation_codes").select(VIOLATION_COLUMNS).in("clause_id", clauseIds).order("code"),
    readVersions(sb, regulation),
    readAudit(sb, regulation.entity_id),
  ]);

  const violations = (violationRead.data ?? []) as unknown as WorkspaceViolation[];
  const penaltyRead = violationRead.error || !violations.length
    ? { data: [], error: violationRead.error }
    : await sb.from("penalty_mappings").select(PENALTY_COLUMNS)
        .in("violation_code_id", violations.map(violation => violation.id));

  const items = ((itemRead.data ?? []) as unknown as Array<WorkspaceItem & { clause_id: string }>)
    .map(item => ({ ...item, clauseRef: clauseRefById.get(item.clause_id) ?? null }));

  return {
    regulation,
    clauseCount: clauses.length,
    legalSources: [...new Set(clauses.map(clause => clause.legal_source).filter((source): source is string => Boolean(source)))],
    items: itemRead.error ? unavailable : table(items),
    violations: violationRead.error ? unavailable : table(violations),
    penalties: penaltyRead.error ? unavailable : table((penaltyRead.data ?? []) as unknown as WorkspacePenalty[]),
    versions,
    auditEvents,
  };
}

type Client = Awaited<ReturnType<typeof supabaseServer>>;

async function readVersions(sb: Client, regulation: WorkspaceRegulation): Promise<WorkspaceTable<WorkspaceVersion>> {
  const { data, error } = await sb.from("compliance_entity_versions")
    .select("id,version_number,published_at,request_id")
    .eq("entity_kind", "regulation").eq("entity_id", regulation.entity_id)
    .order("version_number", { ascending: false });
  if (error) return unavailable;

  const recorded = (data ?? []) as unknown as WorkspaceVersion[];
  if (recorded.length || !regulation.version_number) return table(recorded);
  return table([{
    id: regulation.current_version_id ?? regulation.entity_id,
    version_number: regulation.version_number,
    published_at: regulation.published_at,
    request_id: regulation.request_id,
  }]);
}

async function readAudit(sb: Client, entityId: string): Promise<WorkspaceTable<WorkspaceAuditEvent>> {
  const { data, error } = await sb.rpc("compliance_regulation_audit", { p_entity_id: entityId });
  if (error) return unavailable;
  return table((Array.isArray(data) ? data : []) as WorkspaceAuditEvent[]);
}
