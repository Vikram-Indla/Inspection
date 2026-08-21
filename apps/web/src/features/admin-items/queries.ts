import { getItemUsage } from "@/app/(app)/admin/items/actions";
import { logProviderError } from "@/lib/neutral-error";
import { formatDateTime } from "@/lib/dates";
import type { getServerUser, supabaseServer } from "@/lib/supabase-server";
import type { Locale } from "@/lib/i18n";
import type { AdminItemsRead, AuditEvent, CatalogueRow, ClauseOption, PreviewItem } from "./types";

type Client = Awaited<ReturnType<typeof supabaseServer>>;
type ServerUser = Awaited<ReturnType<typeof getServerUser>>;

type ResponseModel = {
  responses?: string[];
  mapping?: Record<string, { result?: string; violation?: string }>;
  score_excluded_on?: string[];
  requirement?: "required" | "optional" | "conditional";
  scoring_enabled?: boolean;
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
};
type EvidenceRule = { on?: string; type?: string; min?: number; mandatory?: boolean } | null;

const WRITER_ROLES = ["admin", "compliance_admin", "form_admin"];

export async function loadAdminItems(
  sb: Client,
  user: Awaited<ServerUser>["data"]["user"],
  locale: Locale,
  auditItemId: string | null,
): Promise<AdminItemsRead> {
  const [{ data: items, error }, { data: clauses, error: clauseError }] = await Promise.all([
    sb.from("inspection_items")
      .select("id, code, title, clause_id, active, configuration_version, deactivation_reason, score_weight, response_model, evidence_rule, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, regulations(id, code))")
      .order("code"),
    sb.from("regulation_clauses").select("id, clause_ref, title, regulations(code)").order("clause_ref"),
  ]);
  if (error) logProviderError("admin items read", error);
  if (clauseError) logProviderError("admin item clauses read", clauseError);

  const clauseUnavailable = Boolean(clauseError);
  const clauseOptions: ClauseOption[] = (clauses ?? []).map(clause => {
    const reg = Array.isArray(clause.regulations) ? clause.regulations[0] : clause.regulations;
    return { id: clause.id, label: `${reg?.code ?? "?"} §${clause.clause_ref} — ${clause.title ?? ""}` };
  });

  const items0 = items ?? [];
  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const isWriter = !roleRead.error && WRITER_ROLES.some(role => roles.has(role));

  const usageEntries = isWriter
    ? await Promise.all(items0.map(async item => [item.id, await getItemUsage(item.code)] as const))
    : [];
  const usageById = new Map(usageEntries);

  const rows: CatalogueRow[] = items0.map(item => {
    const rc = Array.isArray(item.regulation_clauses) ? item.regulation_clauses[0] : item.regulation_clauses;
    const rcReg = rc ? (Array.isArray(rc.regulations) ? rc.regulations[0] : rc.regulations) : null;
    const rm = (item.response_model ?? {}) as ResponseModel;
    const nc = rm.mapping?.non_compliant;
    const ev = (item.evidence_rule ?? null) as EvidenceRule;
    const colExcluded = (item.score_excluded_on ?? null) as string[] | null;
    const usage = usageById.get(item.id);
    return {
      id: item.id,
      code: item.code,
      title: item.title,
      clauseId: item.clause_id,
      clauseLabel: rc && rcReg ? `${rcReg.code} §${rc.clause_ref}` : null,
      clauseRegId: rcReg ? rcReg.id : null,
      active: item.active,
      scoreWeight: item.score_weight ?? null,
      responses: rm.responses ?? [],
      ncTarget: nc?.violation ?? nc?.result ?? null,
      evidenceMandatory: ev?.mandatory === true,
      evidenceType: ev?.type ?? null,
      scoreExcluded: colExcluded ?? rm.score_excluded_on ?? [],
      requirement: rm.requirement ?? null,
      conditionalVisibleWhen: rm.conditional?.visible_when ?? null,
      scoringOff: rm.scoring_enabled === false,
      usage: usage ? { packages: usage.package_count, versions: usage.version_count } : null,
      guidance: item.guidance_en,
      version: item.configuration_version ?? 1,
    };
  });

  const previewItems: PreviewItem[] = items0.map(item => {
    const rm = (item.response_model ?? {}) as ResponseModel;
    const ev = (item.evidence_rule ?? null) as EvidenceRule;
    const nc = rm.mapping?.non_compliant;
    const colExcluded = (item.score_excluded_on ?? null) as string[] | null;
    const guidance = locale === "ar"
      ? (item.guidance_ar ?? item.guidance_en ?? null)
      : (item.guidance_en ?? item.guidance_ar ?? null);
    return {
      id: item.id, code: item.code, title: item.title, active: item.active,
      responses: rm.responses ?? [],
      ncTarget: nc?.violation ?? nc?.result ?? null,
      evidence: ev,
      requirement: rm.requirement ?? "required",
      conditionalRule: rm.conditional?.visible_when ?? null,
      mandatoryWhenVisible: rm.conditional?.mandatory_when_visible === true,
      scoringEnabled: rm.scoring_enabled !== false,
      guidance,
      scoreWeight: item.score_weight ?? null,
      scoreExcludedOn: colExcluded ?? rm.score_excluded_on ?? [],
    };
  });

  const auditItem = auditItemId ? rows.find(row => row.id === auditItemId) ?? null : null;
  let auditError = false;
  let events: AuditEvent[] = [];
  if (isWriter && auditItem) {
    const auditResult = await sb.rpc("admin_configuration_audit", { p_object_type: "inspection_items", p_object_id: auditItem.id });
    auditError = Boolean(auditResult.error);
    const raw = !auditResult.error && Array.isArray(auditResult.data)
      ? auditResult.data as Array<{ id: number; action: string; actor: string | null; occurred_at: string }>
      : [];
    const actorIds = Array.from(new Set(raw.map(event => event.actor).filter((value): value is string => Boolean(value))));
    const nameRead = actorIds.length ? await sb.rpc("display_names", { p_user_ids: actorIds }) : { data: [] };
    const names: Record<string, string> = {};
    for (const row of nameRead.data ?? []) {
      if (row?.full_name) names[row.user_id] = row.full_name;
    }
    events = raw.map(event => ({
      id: event.id,
      action: event.action,
      actorName: event.actor ? names[event.actor] ?? null : null,
      occurredAt: event.occurred_at,
    }));
  }

  return {
    error: Boolean(error),
    clauseUnavailable,
    clauseOptions,
    rows,
    previewItems,
    isWriter,
    roleError: Boolean(roleRead.error),
    readAt: formatDateTime(Date.now(), locale),
    audit: { itemId: auditItemId, item: auditItem, error: auditError, events },
  };
}
