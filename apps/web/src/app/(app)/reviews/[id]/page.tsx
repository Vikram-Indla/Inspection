import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";
import DecisionPanel, { type WorkspaceDecisionStrings } from "./DecisionPanel";
import RecordTabs, { type RecordTabDef } from "./RecordTabs";
import StartReview, { type StartReviewStrings } from "./StartReview";
import VersionCompare, { type VersionCompareStrings, type ItemSection } from "./VersionCompare";
import FindingTraceChain, { type FindingTrace, type TraceNode } from "./FindingTraceChain";
import { fetchFactoryChecks, updatedCount, FACTORY_FIELD_EN } from "@/lib/factory-verification";
import { IconBlocked, IconPaperclip } from "@/app/icons";
import responsive from "../responsive.module.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ReviewWorkspace({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ decision?: string; correlation?: string; comment?: string; handoff?: string }>;
}) {
  const [{ id }, receipt] = await Promise.all([params, searchParams]);  // inspection id
  const receiptDecision = ["approve", "return", "reject"].includes(receipt.decision ?? "") ? receipt.decision : null;
  const receiptCorrelation = receipt.correlation && UUID.test(receipt.correlation) ? receipt.correlation : null;
  const receiptComment = receipt.comment && UUID.test(receipt.comment) ? receipt.comment : null;
  const receiptHandoff = receipt.handoff && UUID.test(receipt.handoff) ? receipt.handoff : null;
  const { t, locale } = await useT();
  const lang = locale === "ar" ? "ar" : "en";
  const tx = (key: string, en: string, ar: string) => t(key, lang === "ar" ? ar : en);
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[review workspace auth read]", authError.message, authError.code);
    return (
      <Shell current="/reviews" title={t("review.ws.loadError", "Could not load")}>
        <section className="sq-surface cd-panelpad cd-result" role="alert">
          <h3 tabIndex={-1}>{t("review.ws.loadError", "Could not load")}</h3>
          <p>{t("review.ws.loadErrorDesc", "The record could not be fetched — the data source may be degraded. Try again.")}</p>
        </section>
      </Shell>
    );
  }
  const { data: roleRows, error: roleReadError } = user
    ? await getUserRoles(user.id)
    : { data: null, error: null };
  if (roleReadError) {
    console.error("[review workspace role read]", roleReadError.message, roleReadError.code);
    return (
      <Shell current="/reviews" title={t("review.ws.loadError", "Could not load")}>
        <section className="sq-surface cd-panelpad cd-result" role="alert">
          <h3 tabIndex={-1}>{t("review.ws.loadError", "Could not load")}</h3>
          <p>{t("review.ws.loadErrorDesc", "The record could not be fetched — the data source may be degraded. Try again.")}</p>
        </section>
      </Shell>
    );
  }
  // RLS (0002_rbac_audit.sql: inspections_read/subs_read/reviews_read) and the
  // CD-030 design scope itself ("P11 · Reviewer/Auditor") grant auditor,
  // planner, leadership and the assigned inspector read access to this record
  // — the page-level gate
  // must not be narrower than that or it silently weakens an accepted
  // permission (CLAUDE.md). canDecide stays reviewer/ops-only: it gates
  // StartReview/DecisionPanel, which is the real guard against the read
  // roles ever submitting a decision (reviews_insert's RLS is not itself a
  // tight boundary here).
  const authorized = !!user && (roleRows ?? []).some(r => ["reviewer", "ops", "auditor", "planner", "leadership", "inspector"].includes(r.role_key));
  const canDecide = !!user && (roleRows ?? []).some(r => r.role_key === "reviewer" || r.role_key === "ops");
  const viewerRole = (roleRows ?? []).find(r => ["reviewer", "ops", "auditor", "planner", "leadership", "inspector"].includes(r.role_key))?.role_key ?? null;
  if (!authorized) {
    return (
      <Shell current="/reviews" title={t("review.ws.unauthTitle", "You don’t have access to this review")}>
        <section className="sq-surface cd-panelpad cd-result" role="alert">
          <div className="cd-result__row"><div className="cd-result__icon cd-result__icon--critical" aria-hidden="true"><IconBlocked size={24} /></div>
            <div className="cd-stack"><h3 tabIndex={-1}>{t("review.ws.unauthTitle", "You don’t have access to this review")}</h3>
              <p>{t("review.ws.unauthBody", "This workspace requires an authorized review, planning, operations, audit, leadership or assigned-inspector role with matching scope. Navigation visibility is not authorization.")}</p></div></div>
        </section>
      </Shell>
    );
  }
  const { data: ins, error: insErr } = await sb.from("inspections")
    .select(`id, status, visits(factories(id, name, factory_code)), package_versions(version_label, definition),
      submission_versions(id, version_number, snapshot, acknowledgement, submitted_at),
      checklist_responses(id, item_id, response),
      findings(id, item_id, severity, description),
      violations(id, finding_id, triggered_by_response, mapping_version, violation_codes(code, title, level, clause_id, regulation_clauses(clause_ref, legal_source))),
      action_forms(id, item_id, violation_id, owner_name, due_at, status, required_correction),
      evidence(storage_path, evidence_type, content_sha256, captured_at, linked_type, linked_id),
      reviews(id, status, decision, decision_reason, returned_sections, decided_at, submission_version_id)`)
    .eq("id", id).maybeSingle();
  if (!ins) {
    // insErr distinguishes an actual fetch failure (degraded source) from a
    // genuinely missing id — a failed fetch is never labeled "not found".
    return (
      <Shell current="/reviews" title={insErr ? t("review.ws.loadError", "Could not load") : t("review.ws.notFound", "Not found")}>
        <EmptyState glyph="…" title={insErr ? t("review.ws.loadError", "Could not load") : t("review.ws.notFound", "Not found")}
          body={insErr
            ? t("review.ws.loadErrorDesc", "The record could not be fetched — the data source may be degraded. Try again.")
            : t("review.ws.notFoundDesc", "No record matches this ID or it is outside your permitted scope.")} />
      </Shell>
    );
  }
  type SnapshotItem = { id?: string; sha256?: string; [key: string]: unknown };
  type ReviewSnapshot = {
    answers?: Record<string, string>;
    evidence?: { manifest?: SnapshotItem[] };
    action_forms?: SnapshotItem[];
  };
  const subs = (ins.submission_versions as unknown as { id: string; version_number: number; snapshot: ReviewSnapshot; acknowledgement: unknown; submitted_at: string }[]).sort((a, b) => b.version_number - a.version_number);
  const latest = subs[0];
  const reviews = ins.reviews as unknown as { id: string; status: string; decision: string | null; decision_reason: string | null; returned_sections: string[] | null; decided_at: string | null; submission_version_id: string }[];
  const timelineIds = [ins.id, ...subs.map(s => s.id), ...reviews.map(r => r.id)];
  // These reads are independent once the inspection aggregate is known. Run
  // them together so the route remains responsive under live-provider latency.
  const [{ data: itemRows }, fv, { data: trail, error: timelineError }] = await Promise.all([
    sb.from("inspection_items").select("id, code, title, regulation_clauses(clause_ref, legal_source)"),
    fetchFactoryChecks(sb, ins.id),
    sb.rpc("review_timeline", { p_inspection_id: ins.id }),
  ]);
  // CD-028 leg 5 — opening is read-only. The review is NOT created and the
  // inspection is NOT transitioned as a side-effect of this render; that now
  // happens only through the explicit StartReview action below.
  const open = reviews.find(r => { return r.submission_version_id === latest?.id && !r.decided_at; });
  const canStart = !open && !!latest && ins.status === "submitted";
  const sections = (ins.package_versions as unknown as { definition: { sections: { key: string; title: string; items?: string[] }[] } }).definition.sections.filter(s => { return !!s.items?.length; });
  const f = (ins.visits as unknown as { factories: { id: string; name: string; factory_code: string } }).factories;
  // CD-030 / SCR-WEB-320 (M06-023/046/053) — version-compare data. itemSection maps each answer key
  // (item code, e.g. "FS-101") to its owning section (M06-040..048). returnedScope
  // is the STORED scope of the last decided return (reviews.returned_sections holds
  // section keys) and is the SOLE authority for expected-vs-unexpected — never
  // inferred from the diff (M06-050/053). No scope on record → classification
  // unavailable, never "unchanged".
  const sectionsDef = (ins.package_versions as unknown as { definition: { sections: { key: string; title: string; items?: string[] }[] } }).definition.sections;
  const itemSection: ItemSection = {};
  sectionsDef.forEach(s => (s.items ?? []).forEach(it => { itemSection[it] = { key: s.key, title: s.title }; }));
  // Relation order is not a contract of the nested Supabase read. Sort the
  // stored return decisions explicitly before choosing the latest authority;
  // otherwise the scope rail could classify against an older return merely
  // because the database returned child rows in a different order.
  const decidedReturns = reviews
    .filter(r => { return !!r.decided_at && !!r.returned_sections && r.returned_sections.length > 0; })
    .sort((a, b) => String(a.decided_at).localeCompare(String(b.decided_at)));
  const scopeReview = decidedReturns.length ? decidedReturns[decidedReturns.length - 1] : null;
  const returnedScope = scopeReview?.returned_sections ?? null;
  const scopeLabel = scopeReview
    ? `${(returnedScope ?? []).join(", ")} · ${scopeReview.decided_at ? formatDate(scopeReview.decided_at, lang) : "—"}`
    : null;

  type ItemRow = { id: string; code: string; title: string; regulation_clauses: { clause_ref: string; legal_source: string | null } | { clause_ref: string; legal_source: string | null }[] | null };
  type ResponseRow = { id: string; item_id: string; response: { value?: string } | string | null };
  type FindingRow = { id: string; item_id: string | null; severity: string; description: string };
  type ViolationRow = { id: string; finding_id: string | null; triggered_by_response: string | null; mapping_version: string; violation_codes: { code: string; title: string; level: string; clause_id: string | null; regulation_clauses: { clause_ref: string; legal_source: string | null } | { clause_ref: string; legal_source: string | null }[] | null } | null };
  type ActionRow = { id: string; item_id: string | null; violation_id: string | null; owner_name: string | null; due_at: string | null; status: string; required_correction: string | null };
  type EvidenceRow = { storage_path: string; evidence_type: string; content_sha256: string | null; linked_type: string; linked_id: string };
  const items = (itemRows ?? []) as ItemRow[];
  const responses = (ins.checklist_responses ?? []) as unknown as ResponseRow[];
  const findings = (ins.findings ?? []) as unknown as FindingRow[];
  const violations = (ins.violations ?? []) as unknown as ViolationRow[];
  const actionForms = (ins.action_forms ?? []) as unknown as ActionRow[];
  const evidenceRows = (ins.evidence ?? []) as unknown as EvidenceRow[];
  const decidedReview = reviews.filter(r => !!r.decided_at).sort((a, b) => String(b.decided_at).localeCompare(String(a.decided_at)))[0] ?? null;
  const versionLabel = `Submission snapshot · v${latest?.version_number ?? "—"}`;
  const unavailable = (source: string, value: string): TraceNode => ({ value, source, unavailable: true });
  const present = (value: string, source: string): TraceNode => ({ value, source });
  const answerEntries = Object.entries(latest?.snapshot?.answers ?? {});
  const traceRows: FindingTrace[] = answerEntries.map(([key, raw]) => {
    const item = items.find(i => i.code === key);
    const response = item ? responses.find(r => r.item_id === item.id) : undefined;
    const finding = item ? findings.find(f => f.item_id === item.id) : undefined;
    const violation = violations.find(v => (finding && v.finding_id === finding.id) || (response && v.triggered_by_response === response.id));
    // Prefer the explicit violation → corrective-action FK when present. An
    // item-level action is only the fallback; choosing it first could display
    // a different action when both the item and its violation have forms.
    const action = actionForms.find(a => (violation && a.violation_id === violation.id))
      ?? actionForms.find(a => (item && a.item_id === item.id));
    const linkedEvidence = evidenceRows.filter(e =>
      (item && e.linked_type === "item" && e.linked_id === item.id) ||
      (finding && e.linked_type === "finding" && e.linked_id === finding.id) ||
      (action && e.linked_type === "action" && e.linked_id === action.id),
    );
    const itemClause = Array.isArray(item?.regulation_clauses) ? item?.regulation_clauses[0] : item?.regulation_clauses;
    const violationClause = Array.isArray(violation?.violation_codes?.regulation_clauses) ? violation?.violation_codes?.regulation_clauses[0] : violation?.violation_codes?.regulation_clauses;
    const clause = itemClause ?? violationClause ?? null;
    const responseValue = typeof raw === "string" ? raw : JSON.stringify(raw);
    return {
      key,
      question: present(item?.title ?? key, `${versionLabel} · package item`),
      response: present(responseValue, versionLabel),
      evidence: linkedEvidence.length > 0
        ? present(`${linkedEvidence.length} linked record(s) · ${linkedEvidence[0].evidence_type}`, `${versionLabel} · evidence metadata`)
        : unavailable(`${versionLabel} · evidence linkage`, "Evidence link unavailable"),
      clause: clause
        ? present(`${clause.clause_ref}${clause.legal_source ? ` · ${clause.legal_source}` : ""}`, "Published regulation mapping")
        : unavailable("Published regulation mapping", "Clause link unavailable"),
      violation: violation?.violation_codes
        ? present(`${violation.violation_codes.code} · ${violation.violation_codes.title} · ${violation.violation_codes.level}`, `Violation mapping ${violation.mapping_version}`)
        : present("No violation recorded", "Inspection violation set"),
      action: action
        ? present(`${action.required_correction ?? "Corrective action"} · ${action.status}`, `Action form · ${action.owner_name ?? "owner unavailable"}`)
        : present("No corrective action recorded", "Inspection action-form set"),
      decision: decidedReview
        ? present(`${decidedReview.decision ?? "decision"}${decidedReview.decision_reason ? ` · ${decidedReview.decision_reason}` : ""}`, `Review decision · ${decidedReview.decided_at}`)
        : unavailable("Review decision record", "Decision comment pending"),
    };
  });
  const compareVersions = subs.map(s => ({
    n: s.version_number,
    answers: (s.snapshot?.answers ?? {}) as Record<string, string>,
    evidence: Array.isArray(s.snapshot?.evidence?.manifest) ? s.snapshot.evidence.manifest : null,
    actionForms: Array.isArray(s.snapshot?.action_forms) ? s.snapshot.action_forms : null,
  }));
  const enumLabels: Record<string, string> = {};
  Array.from(new Set(compareVersions.flatMap(v => { return Object.values(v.answers); }))).forEach(v => { enumLabels[v] = t(`enum.${v}`, String(v).replace(/_/g, " ")); });
  const compareStrings: VersionCompareStrings = {
    heading: t("review.cmp.heading", "Version comparison — Tamper-evident Scope Rail"),
    scopeSource: t("review.cmp.scopeSource", "Returned-scope authority (stored): {label}. Classification is never inferred from the diff."),
    noScope: t("review.cmp.noScope", "No returned scope on record — expected/unexpected cannot be established, so changes are shown 'unavailable', never 'unchanged'."),
    from: t("review.cmp.from", "Compare from"),
    to: t("review.cmp.to", "Compare to"),
    colItem: t("review.cmp.colItem", "Item"),
    colSection: t("review.cmp.colSection", "Section"),
    colClass: t("review.cmp.colClass", "Scope classification"),
    catExpected: t("review.cmp.catExpected", "Expected (in returned scope)"),
    catUnexpected: t("review.cmp.catUnexpected", "Unexpected — locked-section change"),
    catUnchanged: t("review.cmp.catUnchanged", "Unchanged"),
    catUnavailable: t("review.cmp.catUnavailable", "Unavailable"),
    tamperTitle: t("review.cmp.tamperTitle", "Out-of-scope change detected."),
    tamperBody: t("review.cmp.tamperBody", "An answer changed outside the sections the reviewer returned. Read every flagged row before deciding."),
    cleanTitle: t("review.cmp.cleanTitle", "Changes within returned scope."),
    cleanBody: t("review.cmp.cleanBody", "Every changed answer falls inside the returned sections. Non-answer comparisons remain unavailable below."),
    noPrior: t("review.cmp.noPrior", "No prior version to compare — this is the first submitted version."),
    emptyDiff: t("review.cmp.emptyDiff", "No answer changed between these two versions (computed from stored snapshots — not a failure)."),
    navHint: t("review.cmp.navHint", "Comparison is navigation-only — there is no accept/merge action. When a diff is shown, selecting a scope-rail row scrolls to its answer."),
    unavailableHeading: t("review.cmp.unavailHeading", "Comparisons not derived in the runtime"),
    unavailEvidence: t("review.cmp.unavailEvidence", "Evidence / media comparison — not derived; shown unavailable, never 'unchanged'."),
    unavailPackage: t("review.cmp.unavailPackage", "Package-semantic comparison — answer meaning across package versions is not reconciled."),
    unavailMetadata: t("review.cmp.unavailMetadata", "Metadata / section-order comparison — not diffed."),
    unavailNote: t("review.cmp.unavailNote", "These are honestly unavailable (HANDOFF_BLOCKED_MEDIADIFF/_PKGSEMANTIC/_METADIFF), not equal."),
    collectionHeading: tx("review.cmp.collectionHeading", "Immutable collection comparison", "مقارنة المجموعات غير القابلة للتعديل"),
    evidenceCollection: tx("review.cmp.evidenceCollection", "Evidence manifest (ID + SHA metadata)", "بيان الأدلة (المعرّف وبصمة SHA)"),
    actionCollection: tx("review.cmp.actionCollection", "Action forms", "نماذج الإجراءات"),
    added: tx("review.cmp.added", "added", "مضاف"),
    removed: tx("review.cmp.removed", "removed", "محذوف"),
    changed: tx("review.cmp.changed", "changed", "متغير"),
    collectionUnavailable: tx("review.cmp.collectionUnavailable", "Unavailable in one or both immutable snapshots — not treated as unchanged.", "غير متاح في إحدى اللقطتين غير القابلتين للتعديل أو كلتيهما — ولا يُعامل كأنه لم يتغير."),
    staleTitle: t("review.cmp.staleTitle", "A newer version was submitted."),
    staleBody: t("review.cmp.staleBody", "Version v{n} arrived while you had this open — refresh before relying on this comparison."),
    staleRefresh: t("review.cmp.staleRefresh", "Refresh"),
    enumLabels,
  };
  // M04-190 / M06-017 / M06-034 — factory-data verification checks for the
  // reviewer: Source (Senaei) vs Observed, Verified/Updated, before/after,
  // linked evidence. Tolerant fetch: 0020 pending → verbatim error, no crash.
  if (fv.error) console.error("[review factory verification]", fv.error);
  const fvUpdated = updatedCount(fv.checks);
  const fvEvidence = (ins.evidence as unknown as { storage_path: string; linked_type?: string; linked_id?: string }[]).filter(e => e.linked_type === "factory_field");
  const fvEvCount = (checkId: string) => fvEvidence.filter(e => e.linked_id === checkId).length;
  // M06-010/022/039/051 — chronological audit timeline for this inspection's
  // review chain (immutable audit_events rows; audit_read grants reviewer).
const panelStrings: WorkspaceDecisionStrings = {
    heading: t("review.ws.panelHeading", "Decision — irreversible once confirmed"),
    decisions: { approve: t("enum.approve", "approve"), return: t("enum.return", "return"), reject: t("enum.reject", "reject") },
    returnScopeTitle: t("review.ws.returnScopeTitle", "Exact return scope (STM-REV-003)"),
    returnScopeHint: t("review.ws.returnScopeHint", "Only selected sections unlock; the rest stays locked."),
    reason: t("review.ws.reason", "Reason"),
    reasonPlaceholder: t("review.ws.reasonPlaceholder", "mandatory for return/reject — recorded immutably"),
    comment: tx("review.ws.comment", "Reviewer comment (immutable once recorded)", "تعليق المراجع (غير قابل للتعديل بعد التسجيل)"),
    commentPlaceholder: tx("review.ws.commentPlaceholder", "Optional comment stored as a distinct immutable record", "تعليق اختياري يُحفظ كسجل مستقل غير قابل للتعديل"),
    approveWarnTitle: t("review.ws.approveWarnTitle", "Irreversible:"),
    approveWarnBody: t("review.ws.approveWarnBody", "locks the version, triggers compliance chain."),
    rejectWarnTitle: t("review.ws.rejectWarnTitle", "Final:"),
    rejectWarnBody: t("review.ws.rejectWarnBody", "no compliance trigger; new inspection needs a new visit."),
    confirm: t("review.ws.confirm", "Confirm {decision}"),
    recording: t("review.ws.recording", "Recording…"),
    audited: t("review.ws.audited", "Audited: reviewer, reason, sections, prior/new status, version, timestamp."),
    reviewConfirmation: tx("review.ws.reviewConfirmation", "Review decision before recording", "مراجعة القرار قبل تسجيله"),
    continueToConfirmation: tx("review.ws.continueToConfirmation", "Review confirmation", "مراجعة التأكيد"),
    back: tx("review.ws.back", "Back", "رجوع"),
    summary: tx("review.ws.summary", "Inspection summary", "ملخص التفتيش"),
    version: tx("review.ws.version", "Version", "الإصدار"),
    violations: tx("review.ws.violations", "Violations", "المخالفات"),
    criticalViolations: tx("review.ws.criticalViolations", "Critical violations", "المخالفات الحرجة"),
    actionForms: tx("review.ws.actionForms", "Action forms", "نماذج الإجراءات"),
    evidence: tx("review.ws.evidence", "Evidence records", "سجلات الأدلة"),
    factoryUpdates: tx("review.ws.factoryUpdates", "Factory updates", "تحديثات بيانات المصنع"),
    compliancePreview: tx("review.ws.compliancePreview", "Compliance consequence preview:", "معاينة آثار الامتثال:"),
    approveCompliance: tx("review.ws.approveCompliance", "Approval permanently locks this version and hands the approved inspection to the configured compliance chain. Penalty and document values are not invented here.", "تعتمد الموافقة هذا الإصدار نهائياً وتحيل التفتيش المعتمد إلى مسار الامتثال المهيأ. لا تُفترض هنا أي قيم للغرامات أو المستندات."),
    returnImpact: tx("review.ws.returnImpact", "Return preserves this submitted version and unlocks only the selected sections for the assigned inspector.", "يحفظ الإرجاع هذا الإصدار المقدم ويفتح فقط الأقسام المحددة للمفتش المعيّن."),
    rejectImpact: tx("review.ws.rejectImpact", "Reject is final, keeps the inspection read-only, and does not start Compliance Management. A new inspection requires a new visit.", "الرفض نهائي، ويُبقي التفتيش للقراءة فقط، ولا يبدأ إدارة الامتثال. يتطلب التفتيش الجديد إنشاء زيارة جديدة."),
  };
  const startStrings: StartReviewStrings = {
    title: t("review.ws.startTitle", "Start Level 2 review"),
    body: t("review.ws.startBody", "Opening this record does not change anything. Starting the review claims it for you and moves the inspection to under review — an explicit, audited action."),
    start: t("review.ws.startAction", "Start review"),
    starting: t("review.ws.starting", "Starting…"),
  };
  const traceStrings = {
    heading: t("review.ws.trace.heading", "Finding trace chain"),
    hint: t("review.ws.trace.hint", "Question → response → evidence → clause → violation → corrective action → decision comment. Each link is labelled by its source and version; unavailable links are never inferred."),
    empty: t("review.ws.trace.empty", "No checklist answers are available to build the trace chain."),
    question: t("review.ws.trace.question", "Question"),
    response: t("review.ws.trace.response", "Response"),
    evidence: t("review.ws.trace.evidence", "Evidence"),
    clause: t("review.ws.trace.clause", "Clause"),
    violation: t("review.ws.trace.violation", "Violation"),
    action: t("review.ws.trace.action", "Corrective action"),
    decision: t("review.ws.trace.decision", "Decision comment"),
    unavailable: t("review.ws.trace.unavailable", "Unavailable"),
  };
  // CLASS-CONTRACT.md § Review & Approval — div.tabs > button.tab(.is-active) >
  // span.tab-count, 7 total. Tabs are the record's existing content regions;
  // no new content is introduced here, only the switcher.
  const decidedCount = reviews.filter(r => !!r.decided_at).length;
  const recordTabs: RecordTabDef[] = [
    { key: "checklist", label: t("review.ws.checklist", "Checklist — v{n}").replace("{n}", String(latest?.version_number)), count: answerEntries.length },
    { key: "evidence", label: t("review.ws.evidenceHeading", "Violations · actions · evidence (read-only)"), count: violations.length },
    { key: "factory", label: t("review.ws.fvHeading", "Factory data verification (Senaei source vs observed)"), count: fv.checks.length },
    { key: "ack", label: t("review.ws.sigHeading", "Acknowledgement signature"), count: latest?.acknowledgement != null ? 1 : 0 },
    { key: "compare", label: t("review.cmp.heading", "Version comparison — Tamper-evident Scope Rail"), count: compareVersions.length },
    { key: "timeline", label: tx("review.ws.timelineHeading", "Canonical review timeline", "الخط الزمني المعتمد للمراجعة"), count: (trail ?? []).length },
    { key: "prior", label: t("review.ws.priorDecision", "Prior decision:"), count: decidedCount },
  ];
  return (
    <Shell current="/reviews" title={t("review.ws.title", "Review — {factory}").replace("{factory}", f.name)}
      context={<><span className="sq-version">v{latest?.version_number} · {t("review.ws.latest", "latest")}</span><span className="sq-lozenge sq-lozenge--review sq-lozenge--info">{t(`enum.${ins.status}`, ins.status.replace(/_/g, " "))}</span>{!canDecide && <span className="sq-lozenge sq-lozenge--warning">{t("review.ws.readOnlyRole", "{role} · read-only").replace("{role}", viewerRole ? t(`enum.${viewerRole}`, viewerRole) : "—")}</span>}<a className="btn btn-secondary btn-sm" href={`/factories/${f.id}`}>{t("review.ws.openFactory360", "Open Factory 360")}</a><a className="btn btn-secondary btn-sm" href={`/reports/inspection/${ins.id}`}>{t("review.ws.reportLink", "Inspection report PDF")}</a></>}>
      <div className={responsive.reviewRoot} data-saqeel-migration="review-approvals" data-saqeel-screen="SCR-WEB-310">
      <h1 className={responsive.semanticTitle}>{t("review.ws.title", "Review — {factory}").replace("{factory}", f.name)}</h1>
      {receiptCorrelation && receiptDecision && (
        <div className="sq-banner sq-banner--success" role="status">
          <div>
            <strong>{tx("review.ws.decisionRecorded", "Decision recorded atomically.", "تم تسجيل القرار كوحدة ذرية واحدة.")}</strong>{" "}
            {t(`enum.${receiptDecision}`, receiptDecision)}
            {" · "}{tx("review.ws.correlation", "correlation", "معرّف الارتباط")} <bdi className="sq-numeric">{receiptCorrelation}</bdi>
            {receiptComment && <>{" · "}{tx("review.ws.commentRecord", "comment", "التعليق")} <bdi className="sq-numeric">{receiptComment}</bdi></>}
            {receiptHandoff && <>{" · "}{tx("review.ws.handoffRecord", "Compliance handoff", "إحالة الامتثال")} <bdi className="sq-numeric">{receiptHandoff}</bdi></>}
            {!receiptHandoff && receiptDecision === "approve" && <>{" · "}{tx("review.ws.handoffUnavailable", "Compliance handoff ID unavailable — do not claim handoff completion.", "معرّف إحالة الامتثال غير متاح — لا يمكن اعتبار الإحالة مكتملة.")}</>}
          </div>
        </div>
      )}
      <div className="sq-banner sq-banner--immutable"><div><strong>{t("review.ws.readOnlyTitle", "Read-only submitted version.")}</strong> {t("review.ws.readOnlyBody", "Content edits are impossible — the database rejects them (proven B3). Corrections happen only via Return with exact scope.")}</div></div>
      <FindingTraceChain traces={traceRows} strings={traceStrings} />
      <div className="cd-review-workspace-grid">
        <div className="sq-stack">
        <RecordTabs tabs={recordTabs} panels={[
          <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="checklist">
            <h2 style={{ marginBlockEnd: "var(--space-3)" }}>{t("review.ws.checklist", "Checklist — v{n}").replace("{n}", String(latest?.version_number))}</h2>
            <div className="sq-tablewrap"><table className="sq-table">
              <thead><tr><th scope="col">{t("review.ws.colItem", "Item")}</th><th scope="col">{t("review.ws.colResponse", "Response")}</th></tr></thead>
              <tbody>{Object.entries(latest?.snapshot?.answers ?? {}).map(([k, v]) => (
                <tr key={k}><td><strong>{k}</strong></td><td><span className={`sq-lozenge ${v === "non_compliant" ? "sq-lozenge--critical" : "sq-lozenge--success"}`}>{t(`enum.${v}`, String(v).replace(/_/g, " "))}</span></td></tr>
              ))}</tbody>
            </table></div>
          </div>,
          <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="evidence">
            <h2 style={{ marginBlockEnd: "var(--space-3)" }}>{t("review.ws.evidenceHeading", "Violations · actions · evidence (read-only)")}</h2>
            {(ins.violations as unknown as { violation_codes: { code: string; title: string; level: string }; mapping_version: string }[]).map((v, i) => (
              <p key={i}><span className="sq-lozenge sq-lozenge--critical">{v.violation_codes.code} · {t(`enum.${v.violation_codes.level}`, v.violation_codes.level)}</span> {v.violation_codes.title} <span className="sq-version">{t("review.ws.mapping", "mapping")} {v.mapping_version}</span></p>
            ))}
            {(ins.action_forms as unknown as { owner_name: string; due_at: string; status: string; required_correction: string }[]).map((a, i) => (
              <p key={i} className="sq-caption" style={{ marginBlockStart: 8 }}>{t("review.ws.actionPrefix", "action:")} {a.required_correction} — {a.owner_name}, {t("review.ws.due", "due")} {formatDate(a.due_at, lang)} · {t(`enum.${a.status}`, a.status.replace(/_/g, " "))}</p>
            ))}
            {evidenceRows.length === 0 ? (
              <div className="sq-banner" role="status"><div>{tx("review.ws.evidenceEmpty", "No evidence records are attached to this submitted inspection.", "لا توجد سجلات أدلة مرفقة بهذا التفتيش المقدم.")}</div></div>
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr>
                  <th scope="col">{tx("review.ws.evidenceSource", "Source", "المصدر")}</th>
                  <th scope="col">{tx("review.ws.evidenceType", "Type", "النوع")}</th>
                  <th scope="col">{tx("review.ws.evidenceReference", "Immutable reference", "المرجع غير القابل للتعديل")}</th>
                </tr></thead>
                <tbody>{evidenceRows.map((e, index) => (
                  <tr key={`${e.storage_path}:${index}`}>
                    <td>{t(`enum.evidence.linked.${e.linked_type}`, e.linked_type.replace(/_/g, " "))} · <bdi className="sq-numeric">{e.linked_id}</bdi></td>
                    <td>{t(`enum.evidence.${e.evidence_type}`, e.evidence_type.replace(/_/g, " "))}</td>
                    <td className="sq-numeric"><IconPaperclip size={16} /> <bdi>{e.storage_path}</bdi><br />sha256 {e.content_sha256 ?? tx("review.ws.hashUnavailable", "unavailable", "غير متاحة")}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="sq-caption">{tx("review.ws.mediaPreviewUnavailable", "Media bytes cannot be previewed because no authorized signed-URL contract is available on this route. Metadata remains read-only; the UI does not expose or guess a public URL.", "لا يمكن معاينة محتوى الوسائط لعدم توفر عقد معتمد لرابط موقّع في هذا المسار. تبقى البيانات الوصفية للقراءة فقط، ولا تعرض الواجهة رابطاً عاماً أو تفترضه.")}</p>
          </div>,
          /* M04-190 / M06-017 / M06-034 — factory data verification: Source vs Observed, before/after, updated highlighting */
          <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="factory">
            <h2 style={{ marginBlockEnd: "var(--space-3)" }}>
              {t("review.ws.fvHeading", "Factory data verification (Senaei source vs observed)")}{" "}
              <span className={`sq-lozenge ${fvUpdated ? "sq-lozenge--warning" : "sq-lozenge--success"}`}>
                {fvUpdated
                  ? t("review.ws.fvChanged", "{n} field(s) updated").replace("{n}", String(fvUpdated))
                  : t("review.ws.fvNoChanges", "no changes vs source")}
              </span>
            </h2>
            {fv.error ? (
              <p className="sq-caption">{t("review.ws.fvError", "Verification data is temporarily unavailable. Source-versus-observed comparison cannot be shown yet.")}</p>
            ) : fv.checks.length === 0 ? (
              <p className="sq-caption">{t("review.ws.fvEmpty", "No factory-field checks recorded for this inspection.")}</p>
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr>
                  <th scope="col">{t("review.ws.fvColField", "Field")}</th>
                  <th scope="col">{t("review.ws.fvColBefore", "Before — source (Senaei)")}</th>
                  <th scope="col">{t("review.ws.fvColAfter", "After — observed")}</th>
                  <th scope="col">{t("review.ws.fvColStatus", "Status")}</th>
                  <th scope="col">{t("review.ws.fvColEvidence", "Evidence")}</th>
                </tr></thead>
                <tbody>{fv.checks.map(c => (
                  <tr key={c.id} style={c.status === "updated" ? { background: "var(--surface-sunken)" } : undefined}>
                    <td style={c.status === "updated" ? { borderInlineStart: "4px solid var(--status-warning)" } : undefined}>
                      <strong>{t(`field.fv.f.${c.field_key}`, FACTORY_FIELD_EN[c.field_key] ?? c.field_key.replace(/_/g, " "))}</strong>
                    </td>
                    <td>{c.source_value ?? "—"}</td>
                    <td>{c.observed_value ?? "—"}</td>
                    <td><span className={`sq-lozenge ${c.status === "verified" ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>{t(`enum.fv.${c.status}`, c.status)}</span></td>
                    <td className="sq-numeric">
                      {fvEvCount(c.id) || "—"}
                      {c.evidence_note && <div className="sq-caption">{c.evidence_note}</div>}
                    </td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="sq-caption" style={{ marginBlockStart: "var(--space-3)" }}>{t("review.ws.fvNote", "Observations never modify the Senaei source record; checks are audit-logged with before/after values.")}</p>
          </div>,
          /* M04-197 / M06-021 — acknowledgement signature made visible to the reviewer */
          <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="ack">
            {latest?.acknowledgement != null ? (() => {
              const ack = latest.acknowledgement as { name?: string; ts?: string; signed_at?: string; signature_data_url?: string };
              return (
                <>
                  <h2 style={{ marginBlockEnd: "var(--space-3)" }}>{t("review.ws.sigHeading", "Acknowledgement signature")}</h2>
                  <p>
                    <strong>{ack.name ?? "—"}</strong> · <span className="sq-numeric">{(ack.signed_at ?? ack.ts) ? formatDateTime(ack.signed_at ?? ack.ts!, lang) : "—"}</span>
                    {" "}<span className="sq-version">v{latest.version_number}</span>
                  </p>
                  {ack.signature_data_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={ack.signature_data_url} alt={t("review.ws.sigAlt", "Representative signature")} style={{ maxInlineSize: 280, maxBlockSize: 120, background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }} />
                    : <p className="sq-caption">{t("review.ws.sigNone", "No drawn signature stored with this version (acknowledged by name only).")}</p>}
                </>
              );
            })() : (
              <>
                <h2 style={{ marginBlockEnd: "var(--space-3)" }}>{t("review.ws.sigHeading", "Acknowledgement signature")}</h2>
                <p className="sq-caption">{t("review.ws.sigNone", "No drawn signature stored with this version (acknowledged by name only).")}</p>
              </>
            )}
          </div>,
          latest ? (
            <VersionCompare
              key="compare"
              versions={compareVersions}
              itemSection={itemSection}
              returnedScope={returnedScope}
              scopeLabel={scopeLabel}
              strings={compareStrings}
            />
          ) : (
            // S07 / HANDOFF_BLOCKED_LINKED — the inspection loaded but its
            // submission versions did not (a degraded relation fetch: a
            // submitted inspection always has at least one version on record).
            // State it explicitly; never render nothing where a comparison
            // surface belongs.
            <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="compare">
              <div className="sq-banner sq-banner--warning" role="status">
                <div><strong>{t("review.cmp.sourceUnavailable", "Comparison source unavailable.")}</strong> {t("review.cmp.sourceUnavailableBody", "Submitted-version data could not be loaded for this record, so no comparison can be shown — this is unavailable, not an empty result.")}</div>
              </div>
            </div>
          ),
          <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="timeline">
            <h2 style={{ marginBlockEnd: "var(--space-3)" }}>{tx("review.ws.timelineHeading", "Canonical review timeline", "الخط الزمني المعتمد للمراجعة")}</h2>
            {timelineError ? (
              <div className="sq-banner sq-banner--warning" role="alert"><div><strong>{tx("review.ws.timelineUnavailable", "Canonical timeline unavailable.", "الخط الزمني المعتمد غير متاح.")}</strong> {tx("review.ws.timelineUnavailableBody", "The review timeline contract is not available in this environment; no fallback chronology is invented.", "عقد الخط الزمني للمراجعة غير متاح في هذه البيئة؛ لن يتم إنشاء تسلسل زمني بديل غير موثّق.")}</div></div>
            ) : (trail ?? []).length > 0 ? (
              <>
                {(trail as { event_key: string; occurred_at: string; object_type: string; object_id: string; actor_id: string | null; payload: Record<string, unknown> }[]).map(ev => (
                  <p key={`${ev.event_key}:${ev.object_id}`} className="sq-caption" style={{ marginBlockStart: 4 }}>
                    <span className="sq-numeric">{formatDateTime(ev.occurred_at, lang)}</span>
                    {" · "}<strong>{t(`enum.audit.${ev.object_type}`, ev.object_type.replace(/_/g, " "))}</strong>
                    {" · "}{t(`enum.audit.${ev.event_key}`, ev.event_key.replace(/_/g, " ").toLowerCase())}
                    {typeof ev.payload.comment === "string" && <>{" · "}{ev.payload.comment}</>}
                    {typeof ev.payload.handoff_id === "string" && <>{" · "}{tx("review.ws.handoffRecord", "Compliance handoff", "إحالة الامتثال")} <bdi className="sq-numeric">{ev.payload.handoff_id}</bdi></>}
                  </p>
                ))}
                <p className="sq-caption" style={{ marginBlockStart: "var(--space-3)" }}>{tx("review.ws.timelineNote", "Canonical submission, resubmission, review, comment and Compliance handoff events from review_timeline().", "أحداث التقديم وإعادة التقديم والمراجعة والتعليقات وإحالة الامتثال المعتمدة من review_timeline().")}</p>
              </>
            ) : (
              <p className="sq-caption">{t("review.ws.trace.unavailable", "Unavailable")}</p>
            )}
          </div>,
          <div className="sq-surface" style={{ padding: "var(--space-6)" }} key="prior">
            <h2 style={{ marginBlockEnd: "var(--space-3)" }}>{t("review.ws.priorDecision", "Prior decision:")}</h2>
            {decidedCount === 0
              ? <p className="sq-caption">{t("review.ws.trace.unavailable", "Unavailable")}</p>
              : reviews.filter(r => !!r.decided_at).map(r => (
                <div key={r.id} className="sq-banner sq-banner--warning"><div><strong>{t("review.ws.priorDecision", "Prior decision:")}</strong> {r.decision ? t(`enum.${r.decision}`, r.decision) : "—"} · {r.decision_reason} {r.returned_sections && `· ${t("review.ws.sections", "sections")} ${r.returned_sections.join(", ")}`} <span className="sq-caption">({t("review.ws.immutable", "immutable")})</span></div></div>
              ))}
          </div>,
        ]} />
        </div>
        {!canDecide
          // HANDOFF read-only path — auditor/planner/leadership can read the
          // whole workspace above but never see Start review / the decision
          // controls, regardless of open/canStart state.
          ? <div className="sq-surface" style={{ padding: "var(--space-6)" }}><p className="sq-caption">{t("review.ws.readOnlyNote", "Read-only for this role — decision controls are limited to Level 2 Reviewer / Operations.")}</p></div>
          : open && ins.status === "under_review"
          ? <DecisionPanel reviewId={open.id} sections={sections.map(s => ({ key: s.key, title: s.title }))}
              summary={{
                version: latest?.version_number ?? 0,
                violationCount: violations.length,
                criticalViolationCount: violations.filter(v => v.violation_codes?.level === "L1").length,
                actionFormCount: actionForms.length,
                evidenceCount: evidenceRows.length,
                factoryUpdateCount: fvUpdated,
              }}
              strings={panelStrings} />
          : canStart
          ? <StartReview inspectionId={ins.id} submissionVersionId={latest!.id} strings={startStrings} />
          : <div className="sq-surface" style={{ padding: "var(--space-6)" }}><p className="sq-caption">{t("review.ws.noOpenDecision", "No open decision — status {status}.").replace("{status}", t(`enum.${ins.status}`, ins.status.replace(/_/g, " ")))}</p></div>}
      </div>
      </div>
    </Shell>
  );
}
