import Shell from "@/components/Shell";
import { supabaseServer, getServerUser } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { type ExpectedAuditEvent, type ReplayEvent, neutralAuditError } from "@/lib/audit-replay";
import AuditReplayWorkspace from "./AuditReplayWorkspace";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 250;
const AUDIT_READ_ROLES = new Set(["auditor","ops","security_admin","leadership","reviewer","planner","compliance_admin"]);

type GenericRow = {
  id: number; actor: string | null; object_type: string; object_id: string | null;
  action: string; before_state: unknown; after_state: unknown; occurred_at: string;
};

type SemanticRow = {
  id: string; event_type: string; occurred_at: string; recorded_at: string;
  actor_id: string | null; aggregate_type: string; aggregate_id: string | null;
  correlation_id: string; causation_id: string | null; before_state: unknown;
  after_state: unknown; semantic_payload: unknown; integrity_status: string;
  chain_status: string; ingestion_status: string; case_ref: string;
};

const genericType = (row: GenericRow) => `GENERIC:${row.object_type}.${row.action}`;

export default async function AuditReplayPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => typeof sp[key] === "string" ? sp[key] as string : "";
  const caseRef = one("case").trim();
  const caseRefUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseRef) ? caseRef : null;
  const query = one("q").trim().toLowerCase();
  const mode = ["recorder","reconstruct","compare","ledger","custody","print"].includes(one("view")) ? one("view") : "recorder";
  const at = one("at") || null;
  const vs = one("vs") || null;

  const { locale, t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const { data: roleRows } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[] };
  const roles = (roleRows ?? []).map(row => row.role_key);
  const authorized = roles.some(role => AUDIT_READ_ROLES.has(role));

  let genericQuery = sb.from("audit_events")
    .select("id,actor,object_type,object_id,action,before_state,after_state,occurred_at")
    .order("occurred_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE);
  if (caseRefUuid) genericQuery = genericQuery.eq("object_id", caseRefUuid);
  else if (caseRef) genericQuery = genericQuery.eq("object_id", "00000000-0000-0000-0000-000000000000");

  const genericResult = await genericQuery;
  let semanticRows: SemanticRow[] = [];
  let semanticError: { message: string } | null = null;
  let historyTruncated = (genericResult.data?.length ?? 0) === PAGE_SIZE;
  if (caseRef) {
    let cursorAt: string | null = null;
    let cursorId: string | null = null;
    for (let page = 0; page < 20; page++) {
      const result = await sb.rpc("audit_replay_case", { p_case_ref: caseRef, p_limit: PAGE_SIZE, p_before_occurred_at: cursorAt, p_before_id: cursorId });
      if (result.error) { semanticError = result.error; break; }
      const rows = (result.data ?? []) as unknown as SemanticRow[];
      semanticRows.push(...rows);
      if (rows.length < PAGE_SIZE) break;
      const oldest = rows.at(-1)!;
      cursorAt = oldest.occurred_at; cursorId = oldest.id;
      if (page === 19) historyTruncated = true;
    }
  } else {
    const result = await sb.from("audit_semantic_events")
      .select("id,event_type,occurred_at,recorded_at,actor_id,aggregate_type,aggregate_id,correlation_id,causation_id,before_state,after_state,semantic_payload,integrity_status,chain_status,ingestion_status,case_ref")
      .order("occurred_at", { ascending: false }).order("id", { ascending: false }).limit(PAGE_SIZE);
    semanticRows = (result.data ?? []) as unknown as SemanticRow[];
    semanticError = result.error;
    historyTruncated = historyTruncated || semanticRows.length === PAGE_SIZE;
  }
  if (genericResult.error) console.error("[MVP2-M2-05 audit generic read]", genericResult.error);
  if (semanticError) console.error("[MVP2-M2-05 semantic read]", semanticError);

  const genericEvents: ReplayEvent[] = ((genericResult.data ?? []) as GenericRow[]).map(row => ({
    id: `audit-${row.id}`, eventType: genericType(row), occurredAt: row.occurred_at,
    actor: row.actor ?? "system", aggregateType: row.object_type, aggregateId: row.object_id,
    correlationId: null, beforeState: row.before_state, afterState: row.after_state,
    provenance: "generic", integrityStatus: "not_assessed", chainStatus: "incomplete",
    ingestionStatus: "generic_only",
  }));
  const semanticEvents: ReplayEvent[] = semanticRows.map(row => ({
    id: row.id, eventType: row.event_type, occurredAt: row.occurred_at, recordedAt: row.recorded_at,
    actor: row.actor_id ?? "system", aggregateType: row.aggregate_type, aggregateId: row.aggregate_id,
    correlationId: row.correlation_id, causationId: row.causation_id,
    beforeState: row.before_state, afterState: row.after_state, payload: row.semantic_payload,
    provenance: "semantic", integrityStatus: row.integrity_status, chainStatus: row.chain_status,
    ingestionStatus: row.ingestion_status,
  }));
  const allEvents = [...semanticEvents, ...genericEvents]
    .filter(event => !query || [event.eventType,event.aggregateType,event.aggregateId,event.actor,event.correlationId]
      .some(value => value?.toLowerCase().includes(query)))
    .sort((a,b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime() || a.id.localeCompare(b.id));

  const semanticUnavailable = Boolean(semanticError);
  const sourceError = Boolean(genericResult.error);
  const partialScope = authorized && roles.some(role => ["planner","reviewer","leadership"].includes(role));

  const { data: versionRows, error: versionError } = authorized
    ? await sb.from("audit_event_ontology_versions").select("id").eq("case_type", "inspection.standard").eq("status", "published").order("effective_from", { ascending: false }).limit(1)
    : { data: [], error: null };
  const versionId = versionRows?.[0]?.id as string | undefined;
  const [{ data: entryRows, error: entryError }, { data: registryRows, error: registryError }, { data: constraintRows, error: constraintError }] = versionId
    ? await Promise.all([
      sb.from("audit_event_ontology_entries").select("event_type,ordinal,required,branch_group,branch_minimum,expected_status,requirement_ref,acceptance_ref").eq("ontology_version_id", versionId).order("ordinal"),
      sb.from("audit_event_registry").select("event_type,title,aliases,requirement_refs,acceptance_refs,required_fields,source_mapping_status").eq("schema_version", 1).eq("active", true),
      sb.from("audit_event_order_constraints").select("event_type,must_follow_event_type,predecessor_required").eq("ontology_version_id", versionId),
    ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  const registry = new Map((registryRows ?? []).map(row => [row.event_type, row]));
  const expected: ExpectedAuditEvent[] = (entryRows ?? []).flatMap(entry => {
    const reg = registry.get(entry.event_type);
    if (!reg) return [];
    return [{
      requirementId: entry.requirement_ref as ExpectedAuditEvent["requirementId"],
      acceptanceId: entry.acceptance_ref as ExpectedAuditEvent["acceptanceId"],
      eventType: entry.event_type, title: reg.title, chapter: "selected-ontology",
      defaultStatus: entry.expected_status as ExpectedAuditEvent["defaultStatus"], aliases: reg.aliases as string[],
      requiredFields: reg.required_fields as string[], ordinal: entry.ordinal, required: entry.required,
      branchGroup: entry.branch_group, branchMinimum: entry.branch_minimum,
      mustFollowEventTypes: (constraintRows ?? []).filter(row => row.event_type === entry.event_type && row.predecessor_required).map(row => row.must_follow_event_type),
      optionalPredecessorEventTypes: (constraintRows ?? []).filter(row => row.event_type === entry.event_type && !row.predecessor_required).map(row => row.must_follow_event_type),
    }];
  });
  const ontologyLoaded = Boolean(versionId) && !versionError && !entryError && !registryError && !constraintError && expected.length === 36;

  return (
    <Shell current="/admin/audit" title={t("admin.audit.replay.title", "Inspection Flight Recorder")}
      context={<><span className="ax-lozenge ax-lozenge--info">MVP2-M2-05</span><span className="ax-lozenge ax-lozenge--success">{"ENG-12 · "}{t("admin.audit.badge.appendonly", "append-only")}</span></>}>
      <AuditReplayWorkspace
        locale={locale}
        mode={mode}
        caseRef={caseRef}
        query={one("q")}
        at={at}
        vs={vs}
        roles={roles}
        authorized={authorized}
        partialScope={partialScope}
        semanticUnavailable={semanticUnavailable || !ontologyLoaded}
        sourceError={sourceError}
        sourceErrorMessage={neutralAuditError()}
        events={allEvents}
        expected={expected}
        ontologyLoaded={ontologyLoaded}
        historyTruncated={historyTruncated}
      />
    </Shell>
  );
}
