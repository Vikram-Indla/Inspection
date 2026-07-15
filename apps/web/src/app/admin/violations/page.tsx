import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NewViolationForm, AddMappingForm, PublishMappingForm, DeactivateViolationForm, type ClauseOption, type VioStrings } from "./Controls";
import { getViolationUsage, type ViolationUsage } from "./actions";
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
//    SELECT any authenticated; writes compliance_admin/form_admin (fail-closed
//    requireConfigurationWriter guard), plus a module route-visibility guard.
//
// Remaining violation-code capabilities (category, applicability, edit/version,
// trigger trace) are CONTRACT TARGETS rendered as a
// disabled, annotated element, never a working control.
export const dynamic = "force-dynamic";

const WRITER_ROLES = new Set(["compliance_admin", "form_admin"]);

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
  const { t } = await useT();
  const sb = await supabaseServer();

  const [{ data: codesRaw, error }, { data: clauses, error: clauseError }] = await Promise.all([
    sb.from("violation_codes")
      .select("id, code, title, level, active_from, active_to, regulation_clauses(clause_ref, regulations(code)), penalty_mappings(id, penalty_ref, mapping_version, legal_basis, penalty_range, repeat_rule, status, effective_from, effective_to, created_by, approved_by)")
      .order("code"),
    sb.from("regulation_clauses")
      .select("id, clause_ref, title, regulations(code)")
      .order("clause_ref"),
  ]);
  if (error) logProviderError("admin violations read", error);
  if (clauseError) logProviderError("admin violation clauses read", clauseError);

  // Reflect RLS in the UI; the route layout separately restricts module visibility.
  const { data: { user } } = await sb.auth.getUser();
  const { data: roleRows, error: roleError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = (roleRows ?? []).map(r => r.role_key);
  const canWrite = roles.some(r => WRITER_ROLES.has(r));

  const codes = (codesRaw ?? []) as unknown as CodeRow[];
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
  };

  // Severity = glyph + word + colour (never colour alone). The "word" is the
  // schema level label (L1/L2/L3); no invented severity noun.
  function severityChip(level: string) {
    const glyph = level === "L1" ? "⛔" : level === "L2" ? "▲" : "◆";
    const cls =
      level === "L1" ? "ax-lozenge ax-lozenge--critical"
      : level === "L2" ? "ax-lozenge ax-lozenge--warning"
      : "ax-lozenge ax-lozenge--info";
    return (
      <span className={cls}>
        <span aria-hidden="true">{glyph}</span>{" "}
        {t("admin.viol.severity", "severity")} <span className="ax-numeric">{level}</span>
      </span>
    );
  }

  // Lifecycle = glyph + word + colour, with an explicit "derived from … today" note.
  function lifecycleChip(kind: Lifecycle) {
    const glyph = kind === "active" ? "✓" : kind === "future" ? "◷" : "⏻";
    const cls =
      kind === "active" ? "ax-lozenge ax-lozenge--success"
      : kind === "future" ? "ax-lozenge ax-lozenge--info"
      : "ax-lozenge ax-lozenge--warning";
    const label =
      kind === "active" ? t("admin.viol.lc.active", "active")
      : kind === "future" ? t("admin.viol.lc.future", "not yet active")
      : t("admin.viol.lc.deactivated", "deactivated");
    return <span className={cls}><span aria-hidden="true">{glyph}</span> {label}</span>;
  }

  function auditSummary(events: AuditEvent[] | null | undefined, label: string) {
    if (events === undefined) {
      return <span className="ax-caption"><span aria-hidden="true">🔒</span> {t("admin.viol.audit.writerOnly", "Audit history is available to configuration writers.")}</span>;
    }
    if (events === null) {
      return <span className="ax-caption"><span aria-hidden="true">⚠</span> {t("admin.viol.audit.unavailable", "Audit history unavailable — no zero-event claim was made.")}</span>;
    }
    if (events.length === 0) {
      return <span className="ax-caption"><span aria-hidden="true">○</span> {t("admin.viol.audit.empty", "No audit events returned for this object.")}</span>;
    }
    return (
      <details className="ax-caption">
        <summary><span aria-hidden="true">✓</span> {label}: <strong>{events.length}</strong></summary>
        <ol className="ax-stack" style={{ gap: "var(--ax-space-050)", marginBlockEnd: 0 }}>
          {events.map(event => (
            <li key={event.id}>
              <span className="ax-numeric">{event.action}</span>{" · "}
              <bdi dir="ltr" className="ax-numeric">{new Date(event.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</bdi>
              {event.actor ? <> · {t("admin.viol.audit.actor", "actor")} <bdi dir="ltr" className="ax-numeric">{event.actor}</bdi></> : null}
            </li>
          ))}
        </ol>
      </details>
    );
  }

  const modeTabs = (
    <div className="ax-segmented" role="tablist" aria-label={t("admin.viol.mode.label", "Catalogue view")}>
      <a role="tab" aria-selected={!penaltyMode} aria-current={!penaltyMode ? "page" : undefined}
        className={`ax-btn ${!penaltyMode ? "ax-btn--prominent" : "ax-btn--subtle"} ax-link`} href="/admin/violations">
        {t("admin.viol.mode.catalogue", "Violation catalogue")}
      </a>
      <a role="tab" aria-selected={penaltyMode} aria-current={penaltyMode ? "page" : undefined}
        className={`ax-btn ${penaltyMode ? "ax-btn--prominent" : "ax-btn--subtle"} ax-link`} href="/admin/violations?mode=penalty">
        {t("admin.viol.mode.penalty", "Penalty mapping")}
      </a>
    </div>
  );

  // A contract-target leg: rendered as a disabled, annotated button so it is
  // legible as "not enabled" without ever behaving like a working control.
  const blockedTarget = (id: string, label: string, owner: string) => (
    <button key={id} type="button" className="ax-btn ax-btn--subtle" disabled aria-disabled="true"
      title={`${label} — ${t("admin.viol.blocked.title", "contract target, not enabled")} · ${owner}`}
      data-blocked-leg={id}>
      <span aria-hidden="true">⛔</span> {label}
    </button>
  );

  const cd010Blocked: [string, string, string][] = [
    ["category", t("admin.viol.blk.category", "Category"), "backend"],
    ["applicability", t("admin.viol.blk.applicability", "Applicability"), "backend"],
    ["edit", t("admin.viol.blk.edit", "Edit code"), "product/backend"],
    ["version", t("admin.viol.blk.version", "Version history"), "product/backend"],
    ["trigger-trace", t("admin.viol.blk.trace", "Trigger-trace query"), "backend"],
  ];
  const cd011Blocked: [string, string, string][] = [];

  const title = penaltyMode
    ? t("admin.viol.penalty.title", "Penalty Mapping")
    : t("admin.viol.title", "Violation Catalogue");

  return (
    <Shell current="/admin" title={title}
      context={<span className="ax-lozenge ax-lozenge--info">{penaltyMode ? "SCR-ADM-041 · ENG-08" : "SCR-ADM-040 · ENG-08"}</span>}>

      {modeTabs}

      {/* S07 STALE — a read fact with no invented duration or SLA. */}
      <p className="ax-caption" role="status" aria-live="polite">
        {t("admin.viol.readAt", "Read at")}{" "}
        <bdi dir="ltr" className="ax-numeric">{readAt}</bdi>{" · "}
        {t("admin.viol.stale", "data may have changed since — reopen to refresh (no staleness verdict exists).")}
      </p>

      {/* S08 DEGRADED / S09 RECOVERY — a failed read is unavailable, never zero;
          recovery offers a return without implying success before the re-read. */}
      {(error || clauseError) && (
        <div className="ax-banner ax-banner--critical" role="alert">
          <div>
            <strong>{t("admin.viol.error.title", "Couldn’t load the violation catalogue.")}</strong>{" "}
            {t("admin.viol.error.body", NEUTRAL_LOAD_ERROR)}{" "}
            <a className="ax-link" href={penaltyMode ? "/admin/violations?mode=penalty" : "/admin/violations"}>
              {t("admin.viol.error.retry", "Retry")}
            </a>
          </div>
        </div>
      )}

      {/* S05/S06 — allowed reviewer sees a read-only surface; create is hidden. */}
      {roleError && !error ? (
        <div className="ax-banner ax-banner--warning" role="alert"><div><strong>{t("admin.permissionsUnavailable.title", "Permissions unavailable")}</strong>{" "}{t("admin.permissionsUnavailable.body", "Your configuration permissions could not be verified. Writes are disabled; retry the page.")}</div></div>
      ) : !canWrite && !error && (
        <div className="ax-surface ax-permission" style={{ padding: "var(--ax-space-300)" }}>
          <p className="ax-caption" style={{ margin: 0 }}>
            <span aria-hidden="true">🔒</span>{" "}
            {t("admin.viol.readonly", "Read-only view — configuration writes require the compliance-admin or form-admin role (RLS). Route visibility does not grant write authority.")}
          </p>
        </div>
      )}

      {penaltyMode ? (
        /* ============ CD-011 · Penalty mapping mode ============ */
        <>
          {/* Signature — Mapping Validation Lens: exactly the four proven checks. */}
          <section className="ax-surface ax-stack" aria-labelledby="pen-lens-h" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }}>
            <h3 id="pen-lens-h" style={{ margin: 0 }}>{t("admin.viol.lens.title", "Mapping Validation Lens")}</h3>
            <p className="ax-caption" style={{ margin: 0 }}>{t("admin.viol.lens.intro", "Creating a mapping passes exactly four proven checks. No lifecycle, approval, or monetary value exists on this table.")}</p>
            <ul className="ax-stack" style={{ gap: "var(--ax-space-050)", margin: 0, paddingInlineStart: "var(--ax-space-200)" }}>
              <li className="ax-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c1", "The violation is not already mapped (one mapping per violation).")}</li>
              <li className="ax-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c2", "A second mapping is rejected by the database unique constraint.")}</li>
              <li className="ax-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c3", "Legal basis is present before create (never invented).")}</li>
              <li className="ax-caption"><span aria-hidden="true">✓</span> {t("admin.viol.lens.proven", "Proven rule")} — {t("admin.viol.lens.c4", "Range and repeat presets are governed tokens, not amounts.")}</li>
            </ul>
          </section>

          {/* S03 EMPTY — no violation codes exist, so nothing can be mapped. */}
          {!error && codes.length === 0 && (
            <div className="ax-surface"><div className="ax-state">
              <span className="ax-state__glyph" aria-hidden="true">⚖️</span>
              <h4>{t("admin.viol.penalty.empty.title", "No violation codes to map")}</h4>
              <p className="ax-caption">{t("admin.viol.penalty.empty.body", "Create a violation code in the catalogue first; a penalty maps one-to-one onto it.")}</p>
            </div></div>
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
              <div key={v.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexWrap: "wrap", gap: "var(--ax-space-300)", alignItems: "flex-start" }}>
                {/* Column 1 — violation */}
                <div className="ax-stack" style={{ gap: "var(--ax-space-100)", minInlineSize: 200, flex: "1 1 200px" }}>
                  <span className="ax-overline">{t("admin.viol.penalty.col.violation", "Violation")}</span>
                  <strong><span className="ax-numeric">{v.code}</span> — {v.title}</strong>
                  <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
                    {severityChip(v.level)}
                    {lifecycleChip(lc)}
                  </div>
                </div>
                {/* Column 2 — lens status */}
                <div className="ax-stack" style={{ gap: "var(--ax-space-100)", minInlineSize: 180, flex: "1 1 180px" }}>
                  <span className="ax-overline">{t("admin.viol.penalty.col.lens", "Validation lens")}</span>
                  {activeMapping
                    ? <span className="ax-lozenge ax-lozenge--success" role="status"><span aria-hidden="true">✓</span> {t("admin.viol.lens.mapped", "one active mapping; one-to-one satisfied")}</span>
                    : draft
                    ? <span className="ax-lozenge ax-lozenge--warning" role="status"><span aria-hidden="true">◷</span> {t("admin.viol.lens.draft", "draft awaiting a distinct approver")}</span>
                    : <span className="ax-lozenge ax-lozenge--warning" role="status"><span aria-hidden="true">○</span> {t("admin.viol.lens.unmapped", "no mapping yet — one is required")}</span>}
                </div>
                {/* Column 3 — mapping record or create form */}
                <div className="ax-stack" style={{ gap: "var(--ax-space-100)", minInlineSize: 260, flex: "2 1 260px" }}>
                  <span className="ax-overline">{t("admin.viol.penalty.col.record", "Penalty mapping record")}</span>
                  {pm ? (
                    <div className="ax-stack" style={{ gap: "var(--ax-space-050)" }}>
                      <span>{t("admin.viol.penalty", "Penalty")} <strong className="ax-numeric">{pm.penalty_ref}</strong></span>
                      <span className="ax-caption">{t("admin.viol.map.legalBasis", "Legal basis")}: <bdi dir="ltr">{pm.legal_basis}</bdi></span>
                      <span className="ax-caption">
                        {t("admin.viol.map.penaltyRange", "Range preset")}: <span className="ax-numeric">{pm.penalty_range?.schedule ?? t("admin.viol.map.rangeNone", "None")}</span>
                        {" · "}
                        {t("admin.viol.map.repeatRule", "Repeat-rule preset")}: <span className="ax-numeric">{pm.repeat_rule?.repeat_12mo ?? t("admin.viol.map.repeatNone", "None")}</span>
                      </span>
                      <span className="ax-caption">
                        <span className="ax-version">{pm.mapping_version}</span>{" "}
                        {pm.status} · {pm.effective_from ?? "—"}{pm.effective_to ? ` → ${pm.effective_to}` : ""}
                      </span>
                      {draft && canWrite ? <PublishMappingForm mappingId={draft.id} violationCode={v.code} strings={strings} /> : null}
                      {auditSummary(evidence?.mappingAudit, t("admin.viol.audit.mapping", "Mapping audit events"))}
                    </div>
                  ) : canWrite ? (
                    <AddMappingForm violationId={v.id} violationCode={v.code} strings={strings} />
                  ) : (
                    <span className="ax-caption">{t("admin.viol.penalty.readonly", "Unmapped — a compliance/form admin can add the mapping.")}</span>
                  )}
                  {canWrite && !draft && pm ? <AddMappingForm violationId={v.id} violationCode={v.code} strings={strings} /> : null}
                </div>
              </div>
            );
          })}

          {/* Contract targets — disabled, annotated (never working controls). */}
          {cd011Blocked.length > 0 && <section className="ax-surface ax-stack" aria-labelledby="pen-blocked-h" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }}>
            <h3 id="pen-blocked-h" style={{ margin: 0 }}>{t("admin.viol.blocked.heading", "Contract targets — not enabled on this schema")}</h3>
            <p className="ax-caption" style={{ margin: 0 }}>{t("admin.viol.blocked.body", "These capabilities remain blocked because no column, policy, lifecycle model, or route exists for them. Scoped audit history is available to configuration writers.")}</p>
            <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
              {cd011Blocked.map(([id, label, owner]) => blockedTarget(id, label, owner))}
            </div>
          </section>}

          <p className="ax-caption">{t("admin.viol.penalty.footer", "One violation = one penalty (M09-004) — the database rejects a second mapping. Presets are governed tokens, never monetary or legal values. The contract route /admin/penalties is not a live URL; this is its logical mode.")}</p>
        </>
      ) : (
        /* ============ CD-010 · Violation catalogue mode ============ */
        <>
          {canWrite && clauseError ? (
            <div className="ax-banner ax-banner--warning" role="alert"><div>
              <strong>{t("admin.viol.clausesUnavailable.title", "Regulation clauses are unavailable")}</strong>{" "}
              {t("admin.viol.clausesUnavailable.body", "Violation creation is disabled because its required legal-anchor source could not be read. Retry before authoring.")}
            </div></div>
          ) : canWrite && clauseOptions.length > 0 ? <NewViolationForm clauses={clauseOptions} strings={strings} /> : canWrite ? (
            <div className="ax-banner" role="status"><div>{t("admin.viol.clausesEmpty", "No regulation clauses exist. Create and publish the legal source before creating a violation code.")}</div></div>
          ) : null}

          {/* S03 EMPTY — a genuine empty read, not a fabricated zero. */}
          {!error && codes.length === 0 && (
            <div className="ax-surface"><div className="ax-state">
              <span className="ax-state__glyph" aria-hidden="true">⚖️</span>
              <h4>{t("admin.viol.empty.title", "No violation codes configured")}</h4>
              <p className="ax-caption">{t("admin.viol.empty.body", "Violations generate automatically from configured responses (M09-003). Add the first catalogue code above.")}</p>
            </div></div>
          )}

          {/* S01 POPULATED — legal-taxonomy rows with clause-link trace only. */}
          {codes.map(v => {
            const rc = v.regulation_clauses;
            const pm = v.penalty_mappings?.[0];
            const lc = deriveLifecycle(v.active_from, v.active_to, today);
            const evidence = evidenceById.get(v.id);
            return (
              <div key={v.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
                <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
                  <h3><span className="ax-numeric">{v.code}</span> — {v.title}</h3>
                  <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
                    {severityChip(v.level)}
                    {lifecycleChip(lc)}
                    {pm
                      ? <span className="ax-lozenge ax-lozenge--success"><span aria-hidden="true">✓</span> {t("admin.viol.mapped", "penalty mapped")}</span>
                      : <span className="ax-lozenge ax-lozenge--warning"><span aria-hidden="true">○</span> {t("admin.viol.unmapped", "unmapped")}</span>}
                  </div>
                </div>
                {/* Clause-link trace only — legal basis lives on the penalty mapping, not here. */}
                <p className="ax-caption ax-trace">
                  <span className="ax-overline">{t("admin.viol.trace", "Legal trace")}:</span>{" "}
                  {rc ? <bdi dir="ltr">{rc.regulations?.code ?? "?"} §{rc.clause_ref}</bdi> : t("admin.viol.noAnchor", "No clause anchor")}
                </p>
                {/* Explicit derivation — never a stored status enum. */}
                <p className="ax-caption">
                  {t("admin.viol.derived", "Lifecycle derived from active-from")}{" "}
                  <bdi dir="ltr" className="ax-numeric">{v.active_from ?? "—"}</bdi>
                  {v.active_to ? <> / {t("admin.viol.to", "active-to")} <bdi dir="ltr" className="ax-numeric">{v.active_to}</bdi></> : null}
                  {" "}{t("admin.viol.asOf", "as of today")}{" "}
                  <bdi dir="ltr" className="ax-numeric">{today}</bdi>.
                </p>
                <div className="ax-row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap" }} aria-label={t("admin.viol.usage.heading", "Usage and audit") }>
                  {evidence?.usage ? (
                    <span className="ax-caption" data-usage-state="available">
                      <span aria-hidden="true">↗</span> {t("admin.viol.usage.items", "Item references")}: <strong>{evidence.usage.item_count}</strong>{" · "}
                      {t("admin.viol.usage.runtime", "Runtime references")}: <strong>{evidence.usage.runtime_count}</strong>
                    </span>
                  ) : canWrite ? (
                    <span className="ax-caption" data-usage-state="unavailable"><span aria-hidden="true">⚠</span> {t("admin.viol.usage.unavailable", "Usage unavailable — no zero-count claim was made.")}</span>
                  ) : (
                    <span className="ax-caption" data-usage-state="restricted"><span aria-hidden="true">🔒</span> {t("admin.viol.usage.writerOnly", "Usage counts are available to configuration writers.")}</span>
                  )}
                  {auditSummary(evidence?.codeAudit, t("admin.viol.audit.code", "Violation audit events"))}
                </div>
                {canWrite && !v.active_to && (
                  <DeactivateViolationForm violationId={v.id} violationCode={v.code} strings={strings} />
                )}
              </div>
            );
          })}

          {/* Contract targets — disabled, annotated (never working controls). */}
          <section className="ax-surface ax-stack" aria-labelledby="cat-blocked-h" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }}>
            <h3 id="cat-blocked-h" style={{ margin: 0 }}>{t("admin.viol.blocked.heading", "Contract targets — not enabled on this schema")}</h3>
            <p className="ax-caption" style={{ margin: 0 }}>{t("admin.viol.blocked.catBody", "violation_codes still has no category, applicability, edit/version model, or trigger-trace query. Usage, active-to deactivation, and scoped audit history are now wired.")}</p>
            <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
              {cd010Blocked.map(([id, label, owner]) => blockedTarget(id, label, owner))}
            </div>
          </section>

          <p className="ax-caption">{t("admin.viol.footer", "Violations generate automatically from configured responses; the inspector can never type or override one (M09-003/026). Legal basis belongs to the penalty mapping, not the code row. Config violation_codes is distinct from runtime violations, and its row changes are audit-tracked (trg_audit_violation_codes).")}</p>
        </>
      )}
    </Shell>
  );
}
