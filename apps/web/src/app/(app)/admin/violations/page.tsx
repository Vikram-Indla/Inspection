import Shell from "@/app/(app)/admin/_components/AdminShell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NewViolationForm, AddMappingForm, PublishMappingForm, PublishViolationForm, DeactivateViolationForm, type ClauseOption, type VioStrings } from "./Controls";
import styles from "./Controls.module.css";
import { getViolationUsage, type ViolationUsage } from "./actions";
import EmptyState from "@/components/EmptyState";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";

// CD-010 (SCR-ADM-040 · Violation Catalogue) + CD-011 (SCR-ADM-041 · Penalty
// Mapping) share the direct route /admin/violations. Penalty mapping is a LOGICAL
// mode inside this route (?mode=penalty) — the contract route /admin/penalties is
// NOT created as a live URL.
//
// Truth boundary (source-truth memo 2026-07-15):
//  • violation_codes(id, UNIQUE code, title, level, optional clause_id,
//    active_from, active_to). Legal basis belongs to the PENALTY MAPPING, never
//    to the violation-code row. Config violation_codes ≠ runtime `violations`.
//  • active/future/deactivated is DERIVED from active_from/active_to + today —
//    there is no stored status enum.
//  • penalty mappings are versioned drafts with effective periods. Atomic
//    maker-checker publication deactivates the prior active version; database
//    indexes enforce one active and one draft per violation.
//  • violation_codes AND penalty_mappings row changes ARE audit-tracked at the DB
//    (trg_audit_violation_codes / trg_audit_penalty_mappings → audit_events). RLS:
//    SELECT any authenticated; writes require the admin role (fail-closed
//    requireConfigurationWriter guard), plus a module route-visibility guard.
//
// Category, applicability, governed version lineage, trigger trace and penalty
// lifecycle fields consume the authoritative completion migration.
export const dynamic = "force-dynamic";

const WRITER_ROLES = new Set(["admin"]);

type Lifecycle = "active" | "future" | "deactivated";
// Explicit derivation (never a stored enum): future if it has not started;
// deactivated if it has an end date at/on-or-before today; active otherwise.
function deriveLifecycle(activeFrom: string | null, activeTo: string | null, today: string): Lifecycle {
  if (activeFrom && activeFrom > today) return "future";
  if (activeTo && activeTo <= today) return "deactivated";
  return "active";
}

type CodeRow = {
  id: string;
  code: string;
  title: string;
  level: string;
  status: string;
  corrective_action: string | null;
  grace_period_days: number | null;
  category: string | null;
  applicability: string | null;
  configuration_version: number;
  supersedes_id: string | null;
  deactivation_reason: string | null;
  active_from: string | null;
  active_to: string | null;
  regulation_clauses: { clause_ref: string; regulations: { code: string } | null } | null;
  penalty_mappings: {
    id: string;
    penalty_ref: string;
    mapping_version: string;
    legal_basis: string;
    penalty_range: { schedule?: string } | null;
    repeat_rule: { repeat_12mo?: string } | null;
    status: string;
    effective_from: string | null;
    effective_to: string | null;
    created_by: string | null;
    approved_by: string | null;
    penalty_type: string;
    amount: number | null;
    grace_period_days: number | null;
    due_period_days: number | null;
    template_version_id: string | null;
  }[] | null;
};

type AuditEvent = { id: number; actor: string | null; action: string; occurred_at: string };
type RowEvidence = {
  usage: ViolationUsage | null;
  codeAudit: AuditEvent[] | null;
  mappingAudit: AuditEvent[] | null;
};

export default async function Violations({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const penaltyMode = sp.mode === "penalty";
  const { t, locale } = await useT();
  const sb = await supabaseServer();

  const [{ data: codesRaw, error }, { data: clauses, error: clauseError }, templateRead, itemTraceRead] = await Promise.all([
    sb.from("violation_codes")
      .select("id, code, title, level, status, corrective_action, grace_period_days, category, applicability, configuration_version, supersedes_id, deactivation_reason, active_from, active_to, regulation_clauses(clause_ref, regulations(code)), penalty_mappings(id, penalty_ref, mapping_version, legal_basis, penalty_range, repeat_rule, status, effective_from, effective_to, created_by, approved_by, penalty_type, amount, grace_period_days, due_period_days, template_version_id)")
      .order("code"),
    sb.from("regulation_clauses")
      .select("id, clause_ref, title, regulations(code)")
      .order("clause_ref"),
    sb.from("configuration_templates").select("id, template_key, version_label, title_en, status").in("status", ["published", "locked"]).order("template_key"),
    sb.from("inspection_items").select("code, title, response_model").order("code"),
  ]);
  if (error) logProviderError("admin violations read", error);
  if (clauseError) logProviderError("admin violation clauses read", clauseError);

  // Reflect RLS in the UI; the route layout separately restricts module visibility.
  const { data: { user } } = await getServerUser();
  const { data: roleRows, error: roleError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = (roleRows ?? []).map(r => r.role_key);
  const canWrite = roles.some(r => WRITER_ROLES.has(r));
  // Compliance.docx requires all create/modify operations to pass through a
  // Compliance Configuration Request. The generic CCR engine exists, but the
  // typed violation/penalty validator and atomic activation cascade do not.
  // Keep the legacy catalogue read-only until that backend contract lands.
  const canConfigure = false;

  const codes = (codesRaw ?? []) as unknown as CodeRow[];
  const templateChoices = (templateRead.data ?? []).map(template => ({ id: template.id, label: `${template.template_key} · ${template.version_label} — ${template.title_en}` }));
  const itemTraces = (itemTraceRead.data ?? []) as Array<{ code: string; title: string; response_model: { mapping?: Record<string, { violation?: string }> } | null }>;
  const today = new Date().toISOString().slice(0, 10);
  const readAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  const clauseOptions: ClauseOption[] = (clauses ?? []).map(c => {
    const reg = c.regulations as unknown as { code: string } | null;
    return { id: c.id, label: `${reg?.code ?? "?"} §${c.clause_ref} — ${c.title ?? ""}` };
  });

  // Both RPCs are config-writer scoped. A failed/unapplied RPC is represented as
  // unavailable, never as a fabricated zero-event/zero-usage fact.
  const evidenceEntries = canWrite ? await Promise.all(codes.map(async v => {
    const mappingId = (v.penalty_mappings ?? []).find(mapping => mapping.status === "draft")?.id
      ?? (v.penalty_mappings ?? []).find(mapping => ["published", "locked"].includes(mapping.status))?.id;
    const [usage, codeAuditResult, mappingAuditResult] = await Promise.all([
      getViolationUsage(v.code),
      sb.rpc("admin_configuration_audit", { p_object_type: "violation_codes", p_object_id: v.id }),
      mappingId
        ? sb.rpc("admin_configuration_audit", { p_object_type: "penalty_mappings", p_object_id: mappingId })
        : Promise.resolve({ data: [] as AuditEvent[], error: null }),
    ]);
    if (codeAuditResult.error) logProviderError("admin violation audit read", codeAuditResult.error);
    if (mappingAuditResult.error) logProviderError("admin penalty audit read", mappingAuditResult.error);
    return [v.id, {
      usage,
      codeAudit: codeAuditResult.error ? null : (codeAuditResult.data as AuditEvent[] ?? []),
      mappingAudit: mappingAuditResult.error ? null : (mappingAuditResult.data as AuditEvent[] ?? []),
    }] as const;
  })) : [];
  const evidenceById = new Map<string, RowEvidence>(evidenceEntries);

  const strings: VioStrings = {
    code: t("admin.viol.form.code", "Code"),
    title: t("admin.viol.form.title", "Title"),
    titlePlaceholder: t("admin.viol.form.titlePlaceholder", "Violation title"),
    level: t("admin.viol.form.level", "Level"),
    levelPlaceholder: t("admin.viol.form.levelPlaceholder", "Level…"),
    clause: t("admin.viol.form.clause", "Clause"),
    selectClause: t("admin.viol.form.selectClause", "Select clause…"),
    activeFrom: t("admin.viol.form.activeFrom", "Active from"),
    correctiveAction: t("admin.viol.form.correctiveAction", "Corrective action"),
    gracePeriod: t("admin.viol.form.gracePeriod", "Grace period (days)"),
    category: t("admin.viol.form.category", "Category"),
    applicability: t("admin.viol.form.applicability", "Applicability"),
    configurationVersion: t("admin.viol.form.configurationVersion", "Configuration version"),
    creating: t("admin.viol.form.creating", "Creating…"),
    create: t("admin.viol.form.create", "Create violation code"),
    created: t("admin.viol.form.created", "created"),
    penaltyRef: t("admin.viol.map.penaltyRef", "Penalty ref"),
    legalBasis: t("admin.viol.map.legalBasis", "Legal basis"),
    legalBasisPlaceholder: t("admin.viol.map.legalBasisPlaceholder", "SBC-801 §5.1 / M-43"),
    mappingVersion: t("admin.viol.map.mappingVersion", "Mapping version"),
    penaltyRange: t("admin.viol.map.penaltyRange", "Range preset"),
    rangeApproved: t("admin.viol.map.rangeApproved", "Approved schedule"),
    rangeNone: t("admin.viol.map.rangeNone", "None"),
    repeatRule: t("admin.viol.map.repeatRule", "Repeat-rule preset"),
    repeatEscalate: t("admin.viol.map.repeatEscalate", "Repeat in 12mo → escalate one level"),
    repeatNone: t("admin.viol.map.repeatNone", "None"),
    mapping: t("admin.viol.map.mapping", "Mapping…"),
    mapTo: t("admin.viol.map.mapTo", "Map penalty to"),
    mapped: t("admin.viol.map.done", "mapped"),
    approveMapping: t("admin.viol.map.approve", "Approve and publish mapping"),
    publishingMapping: t("admin.viol.map.publishing", "Publishing mapping…"),
    mappingPublished: t("admin.viol.map.published", "mapping published"),
    activeTo: t("admin.viol.form.activeTo", "Active to"),
    deactivating: t("admin.viol.form.deactivating", "Deactivating…"),
    deactivate: t("admin.viol.form.deactivate", "Deactivate"),
    deactivated: t("admin.viol.form.deactivated", "deactivated"),
    validationLens: t("admin.viol.lens.title", "Mapping Validation Lens"),
    checkUnmapped: t("admin.viol.lens.c1", "The violation is not already mapped (one mapping per violation)."),
    checkUnique: t("admin.viol.lens.c2", "A second mapping is rejected by the database unique constraint."),
    checkLegalBasis: t("admin.viol.lens.c3", "Legal basis is present before create (never invented)."),
    checkPresets: t("admin.viol.lens.c4", "Range and repeat presets are governed tokens, not amounts."),
    pass: t("admin.viol.lens.pass", "Pass"),
    needsAttention: t("admin.viol.lens.needsAttention", "Needs attention"),
    deactivationReason: t("admin.viol.form.deactivationReason", "Deactivation reason"),
    penaltyType: t("admin.viol.map.penaltyType", "Penalty type"),
    amount: t("admin.viol.map.amount", "Amount (when applicable)"),
    duePeriod: t("admin.viol.map.duePeriod", "Due period (days)"),
    template: t("admin.viol.map.template", "Governed template"),
    none: t("admin.viol.none", "None"),
    publishCode: t("admin.viol.publish", "Approve & publish code"),
    publishingCode: t("admin.viol.publishing", "Publishing…"),
    codePublished: t("admin.viol.published", "Violation code published"),
    errors: {
      ccr_required: locale === "ar"
        ? "يجب إكمال إعداد المخالفة والعقوبة من خلال طلب إعداد امتثال محكوم. تظل الكتابة المباشرة معطلة حتى نشر التحقق المخصص والانتقالات المحمية."
        : t(
            "admin.viol.error.ccrRequired",
            "Violation and penalty configuration must use a governed Compliance Configuration Request. Direct writes remain disabled until typed validation and guarded transitions are deployed.",
          ),
    },
  };

  // Severity = glyph + word + colour (never colour alone). The "word" is the
  // schema level label (L1/L2/L3); no invented severity noun.
  function severityChip(level: string) {
    const glyph = level === "L1" ? "⛔" : level === "L2" ? "▲" : "◆";
    const cls =
      level === "L1" ? "badge badge-critical"
      : level === "L2" ? "badge badge-warning"
      : "badge badge-info";
    return (
      <span className={cls}>
        <span aria-hidden="true">{glyph}</span>{" "}
        {t("admin.viol.severity", "severity")} <span className="numeric">{level}</span>
      </span>
    );
  }

  // Lifecycle = glyph + word + colour, with an explicit "derived from … today" note.
  function lifecycleChip(kind: Lifecycle) {
    const glyph = kind === "active" ? "✓" : kind === "future" ? "◷" : "⏻";
    const cls =
      kind === "active" ? "badge badge-compliant"
      : kind === "future" ? "badge badge-info"
      : "badge badge-warning";
    const label =
      kind === "active" ? t("admin.viol.lc.active", "active")
      : kind === "future" ? t("admin.viol.lc.future", "not yet active")
      : t("admin.viol.lc.deactivated", "deactivated");
    return <span className={cls}><span aria-hidden="true">{glyph}</span> {label}</span>;
  }

  function auditSummary(events: AuditEvent[] | null | undefined, label: string) {
    if (events === undefined) {
      return <span className="t-caption"><span aria-hidden="true">🔒</span> {t("admin.viol.audit.writerOnly", "Audit history is available to configuration writers.")}</span>;
    }
    if (events === null) {
      return <span className="t-caption"><span aria-hidden="true">⚠</span> {t("admin.viol.audit.unavailable", "Audit history unavailable — no zero-event claim was made.")}</span>;
    }
    if (events.length === 0) {
      return <span className="t-caption"><span aria-hidden="true">○</span> {t("admin.viol.audit.empty", "No audit events returned for this object.")}</span>;
    }
    return (
      <details className="t-caption">
        <summary><span aria-hidden="true">✓</span> {label}: <strong>{events.length}</strong></summary>
        <ol className="stack" style={{ gap: "var(--space-1)", marginBlockEnd: 0 }}>
          {events.map(event => (
            <li key={event.id}>
              <span className="numeric">{event.action}</span>{" · "}
              <bdi dir="ltr" className="numeric">{new Date(event.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</bdi>
              {event.actor ? <> · {t("admin.viol.audit.actor", "actor")} <bdi dir="ltr" className="numeric">{event.actor}</bdi></> : null}
            </li>
          ))}
        </ol>
      </details>
    );
  }

  const modeTabs = (
    <div className="sq-segmented" role="tablist" aria-label={t("admin.viol.mode.label", "Catalogue view")}>
      <a role="tab" aria-selected={!penaltyMode} aria-current={!penaltyMode ? "page" : undefined}
        className={`btn btn-touch sq-link ${!penaltyMode ? "btn-primary btn-lg" : "btn-ghost"}`} href="/admin/violations">
        {t("admin.viol.mode.catalogue", "Violation catalogue")}
      </a>
      <a role="tab" aria-selected={penaltyMode} aria-current={penaltyMode ? "page" : undefined}
        className={`btn btn-touch sq-link ${penaltyMode ? "btn-primary btn-lg" : "btn-ghost"}`} href="/admin/violations?mode=penalty">
        {t("admin.viol.mode.penalty", "Penalty mapping")}
      </a>
    </div>
  );

  const title = penaltyMode
    ? t("admin.viol.penalty.title", "Penalty Mapping")
    : t("admin.viol.title", "Violation Catalogue");

  return (
    <Shell current="/admin/violations" title={title}
      context={<span className="badge badge-info">{penaltyMode ? "Penalty mappings" : "Violation catalogue"}</span>}>

      <h1 className="sr-only">{title}</h1>
      <div className={styles.pageRoot}>
      {modeTabs}

      {/* S07 STALE — a read fact with no invented duration or SLA. */}
      <p className="t-caption" role="status" aria-live="polite">
        {t("admin.viol.readAt", "Read at")}{" "}
        <bdi dir="ltr" className="numeric">{readAt}</bdi>{" · "}
        {t("admin.viol.stale", "data may have changed since — reopen to refresh (no staleness verdict exists).")}
      </p>

      {/* S08 DEGRADED / S09 RECOVERY — a failed read is unavailable, never zero;
          recovery offers a return without implying success before the re-read. */}
      {(error || clauseError) && (
        <div className="alert alert-critical" role="alert">
          <div>
            <strong>{t("admin.viol.error.title", "Couldn’t load the violation catalogue.")}</strong>{" "}
            {t("admin.viol.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            <a className="sq-link" href={penaltyMode ? "/admin/violations?mode=penalty" : "/admin/violations"}>
              {t("admin.viol.error.retry", "Retry")}
            </a>
          </div>
        </div>
      )}

      {/* S05/S06 — allowed reviewer sees a read-only surface; create is hidden. */}
      {roleError && !error ? (
        <div className="alert alert-warning" role="alert"><div><strong>{t("admin.permissionsUnavailable.title", "Permissions unavailable")}</strong>{" "}{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div></div>
      ) : !canWrite && !error && (
        <div className="panel sq-permission" style={{ padding: "var(--space-6)" }}>
          <p className="t-caption" style={{ margin: 0 }}>
            <span aria-hidden="true">🔒</span>{" "}
            {t("admin.viol.readonly", "Read-only view — configuration writes require the compliance-admin or form-admin role (RLS). Route visibility does not grant write authority.")}
          </p>
        </div>
      )}
      {canWrite && !roleError ? (
        <div className="alert alert-warning" role="note">
          <div>
            <strong>{t("admin.viol.ccrRequired.title", "Configuration Request required.")}</strong>{" "}
            {t("admin.viol.ccrRequired.body", "Violation and penalty creation, modification, publication, activation and deactivation are read-only here until the typed CCR validation and atomic dependency cascade are deployed. Use the Compliance Configuration Request workspace; this catalogue will not bypass it.")}{" "}
            <a className="sq-link" href="/admin/compliance-requests">{t("admin.viol.ccrRequired.link", "Open Compliance Configuration Requests")}</a>
          </div>
        </div>
      ) : null}

      {penaltyMode ? (
        /* ============ CD-011 · Penalty mapping mode ============ */
        <>
          {/* Signature — Mapping Validation Lens: exactly the four proven checks. */}
          <section className="panel stack" aria-labelledby="pen-lens-h" style={{ padding: "var(--space-6)", gap: "var(--space-3)" }}>
            <h2 id="pen-lens-h" style={{ margin: 0 }}>{t("admin.viol.lens.title", "Mapping Validation Lens")}</h2>
            <p className="t-caption" style={{ margin: 0 }}>{t("admin.viol.lens.intro", "Creating a mapping validates legal basis, lifecycle, type, optional amount, timing, repeat policy, and an optional immutable template reference. No value is inferred or invented.")}</p>
            <ul className="stack" style={{ gap: "var(--space-1)", margin: 0, paddingInlineStart: "var(--space-4)" }}>
              <li className="t-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c1", "The violation is not already mapped (one mapping per violation).")}</li>
              <li className="t-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c2", "A second mapping is rejected by the database unique constraint.")}</li>
              <li className="t-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c3", "Legal basis is present before create (never invented).")}</li>
              <li className="t-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c4", "Range and repeat presets are governed tokens, not amounts.")}</li>
            </ul>
          </section>

          {/* S03 EMPTY — no violation codes exist, so nothing can be mapped. */}
          {!error && codes.length === 0 && (
            <EmptyState glyph="⚖️" title={t("admin.viol.penalty.empty.title", "No violation codes to map")}
              body={t("admin.viol.penalty.empty.body", "Create a violation code in the catalogue first; a penalty maps one-to-one onto it.")} />
          )}

          {/* S01 POPULATED — per violation: violation | lens status | mapping record/create. */}
          {codes.map(v => {
            const mappings = v.penalty_mappings ?? [];
            const draft = mappings.find(mapping => mapping.status === "draft");
            const activeMapping = mappings.find(mapping => ["published", "locked"].includes(mapping.status));
            const pm = draft ?? activeMapping ?? mappings[0];
            const lc = deriveLifecycle(v.active_from, v.active_to, today);
            const evidence = evidenceById.get(v.id);
            return (
              <div key={v.id} className="panel" style={{ padding: "var(--space-6)", display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "flex-start" }}>
                {/* Column 1 — violation */}
                <div className="stack" style={{ gap: "var(--space-2)", minInlineSize: 200, flex: "1 1 200px" }}>
                  <span className="sq-overline">{t("admin.viol.penalty.col.violation", "Violation")}</span>
                  <strong><span className="numeric">{v.code}</span> — {v.title}</strong>
                  <div className="row">
                    {severityChip(v.level)}
                    {lifecycleChip(lc)}
                  </div>
                </div>
                {/* Column 2 — lens status */}
                <div className="stack" style={{ gap: "var(--space-2)", minInlineSize: 180, flex: "1 1 180px" }}>
                  <span className="sq-overline">{t("admin.viol.penalty.col.lens", "Validation lens")}</span>
                  {activeMapping
                    ? <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓</span> {t("admin.viol.lens.mapped", "one active mapping; one-to-one satisfied")}</span>
                    : draft
                    ? <span className="badge badge-warning" role="status"><span aria-hidden="true">◷</span> {t("admin.viol.lens.draft", "draft awaiting a distinct approver")}</span>
                    : <span className="badge badge-warning" role="status"><span aria-hidden="true">○</span> {t("admin.viol.lens.unmapped", "no mapping yet — one is required")}</span>}
                </div>
                {/* Column 3 — mapping record or create form */}
                <div className="stack" style={{ gap: "var(--space-2)", minInlineSize: 260, flex: "2 1 260px" }}>
                  <span className="sq-overline">{t("admin.viol.penalty.col.record", "Penalty mapping record")}</span>
                  {pm ? (
                    <div className="stack" style={{ gap: "var(--space-1)" }}>
                      <span>{t("admin.viol.penalty", "Penalty")} <strong className="numeric">{pm.penalty_ref}</strong></span>
                      <span className="t-caption">{t("admin.viol.map.legalBasis", "Legal basis")}: <bdi dir="ltr">{pm.legal_basis}</bdi></span>
                      <span className="t-caption">
                        {t("admin.viol.map.penaltyRange", "Range preset")}: <span className="numeric">{pm.penalty_range?.schedule ?? t("admin.viol.map.rangeNone", "None")}</span>
                        {" · "}
                        {t("admin.viol.map.repeatRule", "Repeat-rule preset")}: <span className="numeric">{pm.repeat_rule?.repeat_12mo ?? t("admin.viol.map.repeatNone", "None")}</span>
                      </span>
                      <span className="t-caption">
                        <span className="id-code">{pm.mapping_version}</span>{" "}
                        {pm.status} · {pm.effective_from ?? "—"}{pm.effective_to ? ` → ${pm.effective_to}` : ""}
                      </span>
                      <span className="t-caption">{strings.penaltyType}: {pm.penalty_type}{pm.amount !== null ? <> · {strings.amount}: <bdi dir="ltr" className="numeric">{pm.amount}</bdi></> : null}{pm.grace_period_days !== null ? <> · {strings.gracePeriod}: {pm.grace_period_days}</> : null}{pm.due_period_days !== null ? <> · {strings.duePeriod}: {pm.due_period_days}</> : null}</span>
                      {draft && canConfigure ? <PublishMappingForm mappingId={draft.id} violationCode={v.code} strings={strings} /> : null}
                      {auditSummary(evidence?.mappingAudit, t("admin.viol.audit.mapping", "Mapping audit events"))}
                    </div>
                  ) : canConfigure ? (
                    <AddMappingForm violationId={v.id} violationCode={v.code} templates={templateChoices} strings={strings} />
                  ) : (
                    <span className="t-caption">{t("admin.viol.penalty.readonly", "Unmapped — a compliance/form admin can add the mapping.")}</span>
                  )}
                  {canConfigure && !draft && pm ? <AddMappingForm violationId={v.id} violationCode={v.code} templates={templateChoices} strings={strings} /> : null}
                </div>
              </div>
            );
          })}

          <p className="t-caption">{t("admin.viol.penalty.footer", "One violation = one penalty — the database rejects a second mapping. Presets are governed tokens, never monetary or legal values. The contract route /admin/penalties is not a live URL; this is its logical mode.")}</p>
        </>
      ) : (
        /* ============ CD-010 · Violation catalogue mode ============ */
        <>
          {canConfigure && clauseError ? (
            <div className="alert alert-warning" role="alert"><div>
              <strong>{t("admin.viol.clausesUnavailable.title", "Regulation clauses are unavailable")}</strong>{" "}
              {t("admin.viol.clausesUnavailable.body", "Violation creation is disabled because its required legal-anchor source could not be read. Retry before authoring.")}
            </div></div>
          ) : canConfigure && clauseOptions.length > 0 ? <NewViolationForm clauses={clauseOptions} strings={strings} /> : canConfigure ? (
            <div className="alert" role="status"><div>{t("admin.viol.clausesEmpty", "No regulation clauses exist. Create and publish the legal source before creating a violation code.")}</div></div>
          ) : null}

          {/* S03 EMPTY — a genuine empty read, not a fabricated zero. */}
          {!error && codes.length === 0 && (
            <EmptyState glyph="⚖️" title={t("admin.viol.empty.title", "No violation codes configured")}
              body={t("admin.viol.empty.body", "Violations generate automatically from configured responses. Add the first catalogue code above.")} />
          )}

          {/* S01 POPULATED — legal-taxonomy rows with clause-link trace only. */}
          {codes.map(v => {
            const rc = v.regulation_clauses;
            const pm = v.penalty_mappings?.[0];
            const lc = deriveLifecycle(v.active_from, v.active_to, today);
            const evidence = evidenceById.get(v.id);
            return (
              <div key={v.id} className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div className="row" style={{ justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <h2><span className="numeric">{v.code}</span> — {v.title}</h2>
                  <div className="row" style={{ gap: "var(--space-3)" }}>
                    {severityChip(v.level)}
                    {lifecycleChip(lc)}
                    {pm
                      ? <span className="badge badge-compliant"><span aria-hidden="true">✓</span> {t("admin.viol.mapped", "penalty mapped")}</span>
                      : <span className="badge badge-warning"><span aria-hidden="true">○</span> {t("admin.viol.unmapped", "unmapped")}</span>}
                  </div>
                </div>
                {/* Clause-link trace only — legal basis lives on the penalty mapping, not here. */}
                <p className="t-caption sq-trace">
                  <span className="sq-overline">{t("admin.viol.trace", "Legal trace")}:</span>{" "}
                  {rc ? <bdi dir="ltr">{rc.regulations?.code ?? "?"} §{rc.clause_ref}</bdi> : t("admin.viol.noAnchor", "No clause anchor")}
                </p>
                <div className="row">
                  <span className="badge badge-info">v{v.configuration_version}</span>
                  {v.category && <span className="badge badge-info">{v.category}</span>}
                  {v.applicability && <span className="t-caption">{v.applicability}</span>}
                </div>
                <p className="t-caption"><strong>{t("admin.viol.corrective", "Corrective action")}:</strong> {v.corrective_action ?? "—"}{v.grace_period_days !== null ? <> · {t("admin.viol.grace", "Grace period")}: {v.grace_period_days} {t("admin.days", "days")}</> : null}</p>
                {(() => {
                  const traces = itemTraces.filter(item => Object.values(item.response_model?.mapping ?? {}).some(mapping => mapping.violation === v.code));
                  return <details className="t-caption"><summary>{t("admin.viol.triggerTrace", "Trigger trace")} · {traces.length} {t("admin.items", "item(s)")}</summary>{traces.length ? <ul>{traces.map(item => <li key={item.code}><bdi dir="ltr">{item.code}</bdi> — {item.title}</li>)}</ul> : <p>{t("admin.viol.noTriggers", "No item response mapping currently references this code.")}</p>}</details>;
                })()}
                <details className="t-caption"><summary>{t("admin.viol.versionHistory", "Version history")}</summary><ol>{codes.filter(candidate => candidate.code === v.code).sort((a, b) => a.configuration_version - b.configuration_version).map(version => <li key={version.id}>v{version.configuration_version} · {version.status} · {version.active_from ?? "—"}{version.deactivation_reason ? ` · ${version.deactivation_reason}` : ""}</li>)}</ol></details>
                {/* Explicit derivation — never a stored status enum. */}
                <p className="t-caption">
                  {t("admin.viol.derived", "Lifecycle derived from active-from")}{" "}
                  <bdi dir="ltr" className="numeric">{v.active_from ?? "—"}</bdi>
                  {v.active_to ? <> / {t("admin.viol.to", "active-to")} <bdi dir="ltr" className="numeric">{v.active_to}</bdi></> : null}
                  {" "}{t("admin.viol.asOf", "as of today")}{" "}
                  <bdi dir="ltr" className="numeric">{today}</bdi>.
                </p>
                <div className="row" style={{ gap: "var(--space-4)" }} aria-label={t("admin.viol.usage.heading", "Usage and audit") }>
                  {evidence?.usage ? (
                    <span className="t-caption" data-usage-state="available">
                      <span aria-hidden="true">↗</span> {t("admin.viol.usage.items", "Item references")}: <strong>{evidence.usage.item_count}</strong>{" · "}
                      {t("admin.viol.usage.runtime", "Runtime references")}: <strong>{evidence.usage.runtime_count}</strong>
                    </span>
                  ) : canWrite ? (
                    <span className="t-caption" data-usage-state="unavailable"><span aria-hidden="true">⚠</span> {t("admin.viol.usage.unavailable", "Usage unavailable — no zero-count claim was made.")}</span>
                  ) : (
                    <span className="t-caption" data-usage-state="restricted"><span aria-hidden="true">🔒</span> {t("admin.viol.usage.writerOnly", "Usage counts are available to configuration writers.")}</span>
                  )}
                  {auditSummary(evidence?.codeAudit, t("admin.viol.audit.code", "Violation audit events"))}
                </div>
                {canConfigure && !v.active_to && (
                  <DeactivateViolationForm violationId={v.id} violationCode={v.code} strings={strings} />
                )}
                {canConfigure && v.status === "draft" && <PublishViolationForm violationId={v.id} violationCode={v.code} strings={strings} />}
              </div>
            );
          })}

          <p className="t-caption">{t("admin.viol.footer", "Violations generate automatically from configured responses; the inspector can never type or override one. Legal basis belongs to the penalty mapping, not the code row. Config violation_codes is distinct from runtime violations, and its row changes are audit-tracked (trg_audit_violation_codes).")}</p>
        </>
      )}
      </div>
    </Shell>
  );
}
