import type { FindingTrace, TraceNode } from "@/components/sections/review-detail/finding-trace-chain/finding-trace-chain";
import type { ItemSection } from "@/components/sections/review-detail/version-compare/version-compare";
import { fetchFactoryChecks, updatedCount } from "@/lib/factory-verification";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { getUserRoles } from "@/lib/persona";
import type { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import type { ReviewsStrings } from "./strings";

type Client = Awaited<ReturnType<typeof supabaseServer>>;
type Detail = ReviewsStrings["detail"];

const READ_ROLES = ["admin", "supervisor", "planner", "inspector"];
const DECIDE_ROLES = ["supervisor", "admin"];

export type SnapshotItem = { id?: string; sha256?: string; [key: string]: unknown };
export type ReviewSnapshot = {
  answers?: Record<string, string>;
  evidence?: { manifest?: SnapshotItem[] };
  action_forms?: SnapshotItem[];
};

export type SubmissionRow = {
  id: string; version_number: number; snapshot: ReviewSnapshot;
  acknowledgement: unknown; submitted_at: string;
};
export type ReviewRow = {
  id: string; status: string; decision: string | null; decision_reason: string | null;
  returned_sections: string[] | null; decided_at: string | null; submission_version_id: string;
};
export type ItemRow = { id: string; code: string; title: string; regulation_clauses: Clause | Clause[] | null };
export type Clause = { clause_ref: string; legal_source: string | null };
export type ResponseRow = { id: string; item_id: string; response: { value?: string } | string | null };
export type FindingRow = { id: string; item_id: string | null; severity: string; description: string };
export type ViolationRow = {
  id: string; finding_id: string | null; triggered_by_response: string | null; mapping_version: string;
  violation_codes: { code: string; title: string; level: string; clause_id: string | null; regulation_clauses: Clause | Clause[] | null } | null;
};
export type ActionRow = {
  id: string; item_id: string | null; violation_id: string | null; owner_name: string | null;
  due_at: string | null; status: string; required_correction: string | null;
};
export type EvidenceRow = {
  storage_path: string; evidence_type: string; content_sha256: string | null;
  linked_type: string; linked_id: string;
};
export type TimelineEvent = {
  event_key: string; occurred_at: string; object_type: string; object_id: string;
  actor_id: string | null; payload: Record<string, unknown>;
};

export type ReviewWorkspace = {
  kind: "ready";
  inspectionId: string;
  inspectionStatus: string;
  factory: { id: string; name: string; factory_code: string };
  canDecide: boolean;
  viewerRole: string | null;
  latest: SubmissionRow | undefined;
  reviews: ReviewRow[];
  openReview: ReviewRow | null;
  canStart: boolean;
  decidedReviews: ReviewRow[];
  sections: { key: string; title: string }[];
  answers: [string, string][];
  violations: ViolationRow[];
  actionForms: ActionRow[];
  evidenceRows: EvidenceRow[];
  traces: FindingTrace[];
  compareVersions: { n: number; answers: Record<string, string>; evidence: SnapshotItem[] | null; actionForms: SnapshotItem[] | null }[];
  itemSection: ItemSection;
  returnedScope: string[] | null;
  scopeLabel: string | null;
  enumLabels: Record<string, string>;
  factoryChecks: Awaited<ReturnType<typeof fetchFactoryChecks>>["checks"];
  factoryCheckError: boolean;
  factoryUpdated: number;
  factoryEvidenceCount: (checkId: string) => number;
  timeline: TimelineEvent[];
  timelineError: boolean;
};

export type ReviewDetailLoad =
  | ReviewWorkspace
  | { kind: "unauthorized" }
  | { kind: "missing"; degraded: boolean };

export async function loadReviewDetail(
  sb: Client,
  inspectionId: string,
  strings: Detail,
  locale: Locale,
): Promise<ReviewDetailLoad> {
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[review workspace auth read]", authError.message, authError.code);
    return { kind: "missing", degraded: true };
  }
  const { data: roleRows, error: roleReadError } = user ? await getUserRoles(user.id) : { data: null, error: null };
  if (roleReadError) {
    console.error("[review workspace role read]", roleReadError.message, roleReadError.code);
    return { kind: "missing", degraded: true };
  }

  // RLS (0002_rbac_audit.sql, superseded by execution_supervisor_review_authority)
  // and the CD-030 scope grant admin, planner, supervisor and the assigned
  // inspector read access. The page gate must not be narrower than that or it
  // silently weakens an accepted permission. canDecide stays supervisor/admin —
  // it is the real guard against a read role submitting a decision.
  const roles = roleRows ?? [];
  if (!user || !roles.some(r => READ_ROLES.includes(r.role_key))) return { kind: "unauthorized" };
  const canDecide = roles.some(r => DECIDE_ROLES.includes(r.role_key));
  const viewerRole = roles.find(r => READ_ROLES.includes(r.role_key))?.role_key ?? null;

  const { data: ins, error: insErr } = await sb.from("inspections")
    .select(`id, status, visits(factories(id, name, factory_code)), package_versions(version_label, definition),
      submission_versions(id, version_number, snapshot, acknowledgement, submitted_at),
      checklist_responses(id, item_id, response),
      findings(id, item_id, severity, description),
      violations(id, finding_id, triggered_by_response, mapping_version, violation_codes(code, title, level, clause_id, regulation_clauses(clause_ref, legal_source))),
      action_forms(id, item_id, violation_id, owner_name, due_at, status, required_correction),
      evidence(storage_path, evidence_type, content_sha256, captured_at, linked_type, linked_id),
      reviews(id, status, decision, decision_reason, returned_sections, decided_at, submission_version_id)`)
    .eq("id", inspectionId).maybeSingle();

  // insErr distinguishes an actual fetch failure from a genuinely missing id —
  // a failed fetch is never labelled "not found".
  if (!ins) return { kind: "missing", degraded: Boolean(insErr) };

  const subs = (ins.submission_versions as unknown as SubmissionRow[]).sort((a, b) => b.version_number - a.version_number);
  const latest = subs[0];
  const reviews = ins.reviews as unknown as ReviewRow[];

  const [{ data: itemRows }, fv, { data: trail, error: timelineError }] = await Promise.all([
    sb.from("inspection_items").select("id, code, title, regulation_clauses(clause_ref, legal_source)"),
    fetchFactoryChecks(sb, ins.id),
    sb.rpc("review_timeline", { p_inspection_id: ins.id }),
  ]);
  if (fv.error) console.error("[review factory verification]", fv.error);

  // CD-028 leg 5 — opening is read-only. The review is not created and the
  // inspection is not transitioned as a side effect of this load.
  const openReview = reviews.find(r => r.submission_version_id === latest?.id && !r.decided_at) ?? null;
  const definition = (ins.package_versions as unknown as { definition: { sections: { key: string; title: string; items?: string[] }[] } }).definition;
  const sections = definition.sections.filter(s => !!s.items?.length).map(s => ({ key: s.key, title: s.title }));

  const itemSection: ItemSection = {};
  definition.sections.forEach(s => (s.items ?? []).forEach(it => { itemSection[it] = { key: s.key, title: s.title }; }));

  // Relation order is not a contract of the nested read. Sort the stored return
  // decisions explicitly before choosing the latest authority, or the scope rail
  // could classify against an older return.
  const decidedReturns = reviews
    .filter(r => !!r.decided_at && !!r.returned_sections && r.returned_sections.length > 0)
    .sort((a, b) => String(a.decided_at).localeCompare(String(b.decided_at)));
  const scopeReview = decidedReturns.at(-1) ?? null;
  const returnedScope = scopeReview?.returned_sections ?? null;

  const items = (itemRows ?? []) as ItemRow[];
  const responses = (ins.checklist_responses ?? []) as unknown as ResponseRow[];
  const findings = (ins.findings ?? []) as unknown as FindingRow[];
  const violations = (ins.violations ?? []) as unknown as ViolationRow[];
  const actionForms = (ins.action_forms ?? []) as unknown as ActionRow[];
  const evidenceRows = (ins.evidence ?? []) as unknown as EvidenceRow[];
  const decidedReview = reviews.filter(r => !!r.decided_at)
    .sort((a, b) => String(b.decided_at).localeCompare(String(a.decided_at)))[0] ?? null;

  const versionLabel = `${strings.ws.version} v${latest?.version_number ?? "—"}`;
  const resultLabels: Record<string, string> = strings.ws.resultLabel;
  const decisionLabels: Record<string, string> = strings.ws.decisionLabel;
  const resultLabel = (value: string): string => resultLabels[value] ?? value.replace(/_/g, " ");
  const decisionLabel = (value: string): string => decisionLabels[value] ?? value.replace(/_/g, " ");
  const unavailable = (source: string, value: string): TraceNode => ({ value, source, unavailable: true });
  const present = (value: string, source: string): TraceNode => ({ value, source });
  const answers = Object.entries(latest?.snapshot?.answers ?? {});
  const first = (value: Clause | Clause[] | null | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

  const traces: FindingTrace[] = answers.map(([key, raw]) => {
    const item = items.find(i => i.code === key);
    const response = item ? responses.find(r => r.item_id === item.id) : undefined;
    const finding = item ? findings.find(f => f.item_id === item.id) : undefined;
    const violation = violations.find(v => (finding && v.finding_id === finding.id) || (response && v.triggered_by_response === response.id));
    // Prefer the explicit violation → corrective-action FK. An item-level action
    // is only the fallback; choosing it first could show a different action when
    // both the item and its violation have forms.
    const action = actionForms.find(a => violation && a.violation_id === violation.id)
      ?? actionForms.find(a => item && a.item_id === item.id);
    const linkedEvidence = evidenceRows.filter(e =>
      (item && e.linked_type === "item" && e.linked_id === item.id)
      || (finding && e.linked_type === "finding" && e.linked_id === finding.id)
      || (action && e.linked_type === "action" && e.linked_id === action.id));
    const clause = first(item?.regulation_clauses) ?? first(violation?.violation_codes?.regulation_clauses);
    const rawResponse = typeof raw === "string" ? raw : JSON.stringify(raw);

    return {
      key,
      question: present(item?.title ?? key, versionLabel),
      response: present(resultLabel(rawResponse), versionLabel),
      evidence: linkedEvidence.length > 0
        ? present(`${linkedEvidence.length} · ${linkedEvidence[0].evidence_type}`, `${versionLabel} · ${strings.ws.trace.evidence}`)
        : unavailable(`${versionLabel} · ${strings.ws.trace.evidence}`, strings.ws.trace.unavailable),
      clause: clause
        ? present(`${clause.clause_ref}${clause.legal_source ? ` · ${clause.legal_source}` : ""}`, strings.ws.mapping)
        : unavailable(strings.ws.mapping, strings.ws.trace.unavailable),
      violation: violation?.violation_codes
        ? present(`${violation.violation_codes.code} · ${violation.violation_codes.title} · ${violation.violation_codes.level}`, `${strings.ws.mapping} ${violation.mapping_version}`)
        : present(strings.ws.trace.unavailable, strings.ws.violations),
      action: action
        ? present(`${action.required_correction ?? strings.ws.trace.action} · ${action.status}`, `${strings.ws.trace.action} · ${action.owner_name ?? strings.ws.trace.unavailable}`)
        : present(strings.ws.trace.unavailable, strings.ws.actionForms),
      decision: decidedReview
        ? present(`${decidedReview.decision ? decisionLabel(decidedReview.decision) : ""}${decidedReview.decision_reason ? ` · ${decidedReview.decision_reason}` : ""}`,
          `${strings.ws.trace.decision} · ${decidedReview.decided_at ? formatDateTime(decidedReview.decided_at, locale) : "—"}`)
        : unavailable(strings.ws.trace.decision, strings.ws.trace.unavailable),
    };
  });

  const compareVersions = subs.map(s => ({
    n: s.version_number,
    answers: (s.snapshot?.answers ?? {}) as Record<string, string>,
    evidence: Array.isArray(s.snapshot?.evidence?.manifest) ? s.snapshot.evidence.manifest : null,
    actionForms: Array.isArray(s.snapshot?.action_forms) ? s.snapshot.action_forms : null,
  }));
  const enumLabels: Record<string, string> = {};
  [...new Set(compareVersions.flatMap(v => Object.values(v.answers)))]
    .forEach(v => { enumLabels[v] = String(v).replace(/_/g, " "); });

  const factoryEvidence = evidenceRows.filter(e => e.linked_type === "factory_field");

  return {
    kind: "ready",
    inspectionId: ins.id,
    inspectionStatus: ins.status,
    factory: (ins.visits as unknown as { factories: { id: string; name: string; factory_code: string } }).factories,
    canDecide,
    viewerRole,
    latest,
    reviews,
    openReview,
    canStart: !openReview && !!latest && ins.status === "submitted",
    decidedReviews: reviews.filter(r => !!r.decided_at),
    sections,
    answers,
    violations,
    actionForms,
    evidenceRows,
    traces,
    compareVersions,
    itemSection,
    returnedScope,
    scopeLabel: scopeReview
      ? `${(returnedScope ?? []).join(", ")} · ${scopeReview.decided_at ? formatDate(scopeReview.decided_at, locale) : "—"}`
      : null,
    enumLabels,
    factoryChecks: fv.checks,
    factoryCheckError: Boolean(fv.error),
    factoryUpdated: updatedCount(fv.checks),
    factoryEvidenceCount: (checkId: string) => factoryEvidence.filter(e => e.linked_id === checkId).length,
    timeline: (trail ?? []) as TimelineEvent[],
    timelineError: Boolean(timelineError),
  };
}
