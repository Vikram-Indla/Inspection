import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Workspace, { type WorkspaceStrings, type WorkspacePanel, type PrevComparison } from "./Workspace";
import FactoryVerification, {
  type FactoryField, type FactoryProductRow, type FactoryMaterialRow,
  type FactoryLicense, type FactoryFieldEvidence, type FactoryVerificationStrings,
} from "./FactoryVerification";
import { contextFlags, type FormDef, type Item, type VioConfig } from "./runtime";
import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./workspace.module.css";

const humanize = (k: string) => k.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

type PenaltyRow = { penalty_ref: string; legal_basis: string | null; mapping_version: string | null };
type VCodeRow = { id: string; code: string; title: string; level: string; penalty_mappings: PenaltyRow | PenaltyRow[] | null };
type FrozenVCodeRow = VCodeRow & { configuration_version?: number; corrective_action?: string | null; grace_period_days?: number | null };
type ItemRow = {
  id: string; code: string; title: string;
  response_model: Item["response_model"]; evidence_rule: Item["evidence_rule"];
  score_excluded_on: string[] | null; score_weight: number | null; guidance_en: string | null; guidance_ar: string | null;
  regulation_clauses: { clause_ref: string; legal_source: string | null } | null;
};
type FrozenItemRow = Omit<ItemRow, "regulation_clauses"> & {
  regulation_clauses: ItemRow["regulation_clauses"] | ItemRow["regulation_clauses"][];
};

export default async function FieldInspection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await useT();
  // SAQEEL field-chrome helpers (parity with the converted factory-360 screen):
  // this focused execution screen renders its own back-arrow header and NO
  // bottom FieldNav.
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const back = (
    <Link href="/field/my-tasks" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );
  const header = (title: React.ReactNode, subtitle?: React.ReactNode) => (
    <FieldHeader leading={back} title={title} subtitle={subtitle}
      langHref={langHref} langLabel={langLabel} />
  );
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  const { data: ins } = await sb.from("inspections")
    .select("id, status, visit_id, package_versions(id, version_label, definition, packages(code, title)), visits(factory_id, visit_type, execution_mode, window_start, window_end, factories(name, factory_code, region, city, license_number, activity_class)), submission_versions(version_number), reviews(returned_sections, decision_reason, decided_at)")
    .eq("id", id).single();
  if (!ins) {
    return (
      <>
        {header(t("field.ws.notFound", "Not found"))}
        <div className={styles.page}>
          <div className="empty">
            <div style={{ fontSize: 32 }} aria-hidden="true">∅</div>
            <div className="empty-title">{t("field.ws.notFound", "Not found")}</div>
          </div>
        </div>
      </>
    );
  }
  const packageVersion = ins.package_versions as unknown as { id: string; definition: { package_kind?: unknown; sections?: { items?: string[] }[]; item_snapshot?: Record<string, FrozenItemRow>; violation_snapshot?: Record<string, FrozenVCodeRow> } };
  const frozenDefinition = packageVersion.definition;
  if (frozenDefinition.package_kind) {
    return (
      <>
        {header(t("field.ws.notConfiguredTitle", "Not configured"))}
        <div className={styles.page}>
          <div className="empty">
            <div style={{ fontSize: 32 }} aria-hidden="true">∅</div>
            <div className="empty-title">{t("field.ws.notConfigured", "Inspection package not configured")}</div>
            <p className="t-caption">{t("field.ws.notConfiguredDesc", "This report type is not configured for field execution.")}</p>
          </div>
        </div>
      </>
    );
  }
  const packageCodes = [...new Set((frozenDefinition.sections ?? []).flatMap(section => section.items ?? []))];
  const itemRead = packageCodes.length
    ? sb.from("inspection_items")
      .select("id, code, title, response_model, evidence_rule, score_excluded_on, score_weight, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)")
      .in("code", packageCodes)
    : Promise.resolve({ data: [] as ItemRow[], error: null });
  // Phase 5 (§15) — the COMPLETE downloaded active item library powers the
  // inspector's additional-item selection; the configured set above stays the
  // frozen default scope. Same column projection, active items only.
  const libraryRead = sb.from("inspection_items")
    .select("id, code, title, response_model, evidence_rule, score_excluded_on, score_weight, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)")
    .eq("active", true);
  // Phase 5 (§18, D-018) — violation invalidation columns land in migration
  // 20260721150000; read tolerantly so the page degrades pre-migration.
  const violationsFull = await sb.from("violations").select("id, violation_code_id, invalidated_at, invalidated_by, invalidate_reason").eq("inspection_id", id);
  const violationsRead = violationsFull.error
    ? await sb.from("violations").select("id, violation_code_id").eq("inspection_id", id)
    : violationsFull;

  const [{ data: itemRows }, { data: libraryRows }, { data: resp }, { data: ev }, { data: vios }, { data: engines }] = await Promise.all([
    itemRead,
    libraryRead,
    sb.from("checklist_responses").select("item_id, response, updated_at").eq("inspection_id", id),
    sb.from("evidence").select("id, linked_type, linked_id, evidence_type, storage_path, captured_at, content_sha256").eq("inspection_id", id),
    Promise.resolve(violationsRead),
    sb.from("engine_settings").select("engine, settings").in("engine", ["evidence", "sla", "field"]),
  ]);
  // Tolerant fetches for columns landing in migrations 0015/0020 (context,
  // action_forms.item_id, inspection_no, evidence lifecycle): a missing column
  // degrades the feature instead of killing the page.
  const [{ data: ctxRow }, { data: afRows }, { data: noRow }, { data: evMeta }] = await Promise.all([
    sb.from("inspections").select("context").eq("id", id).maybeSingle(),
    sb.from("action_forms").select("id, item_id, violation_id, form_type, owner_name, owner_role, due_at, required_correction, status").eq("inspection_id", id),
    sb.from("inspections").select("inspection_no").eq("id", id).maybeSingle(),
    sb.from("evidence").select("id, archived_at, superseded_by, deleted_at").eq("inspection_id", id),
  ]);
  // Phase 5 (§15/§18) — tolerant reads for migration 20260721150000 objects:
  // per-visit item lifecycle rows, and published action_form configuration
  // templates for the manual "Add action form" affordance (§18). A missing
  // table degrades the feature instead of killing the page.
  const [{ data: itemStateRows }, { data: actionTemplateRows }] = await Promise.all([
    sb.from("inspection_item_states").select("item_id, state, reason, reverted_at").eq("inspection_id", id),
    sb.from("configuration_templates").select("id, template_key, title_en, title_ar").eq("template_type", "action_form").eq("status", "published"),
  ]);
  // Arrival/cancellation evidence is captured before an inspection exists and
  // is therefore anchored to visit_id. Read it back into the inspection
  // workspace when the additive visit-level column is available; an older
  // schema must degrade to inspection-only evidence rather than breaking the
  // field page (M04-045/M04-058).
  const visitEvidenceRead = ins.visit_id
    ? await sb.from("evidence").select("id, linked_type, linked_id, evidence_type, storage_path, captured_at").eq("visit_id", ins.visit_id)
    : { data: [], error: null };
  if (visitEvidenceRead.error) {
    // eslint-disable-next-line no-console
    console.error("[field inspection visit evidence]", visitEvidenceRead.error.message);
  }
  // TASK-EXECUTION-MODULE-001 · Phase 4B — journey schema probe (D-015) +
  // latest active-session cancellation request for this visit. While migration
  // 20260721140000 is not applied the probe fails and the workspace has no
  // active-session cancel path (exactly the pre-Phase-4B behavior).
  const { error: journeyProbeError } = await sb.from("cancellation_requests").select("id").limit(1);
  const journeySchemaAvailable = !journeyProbeError;
  let cancellation: { id: string; status: string; reason_key: string; requested_at: string; decision_reason: string | null } | null = null;
  if (journeySchemaAvailable && ins.visit_id) {
    const { data: cancelRows } = await sb.from("cancellation_requests")
      .select("id, status, reason_key, requested_at, decision_reason")
      .eq("visit_id", ins.visit_id)
      .order("requested_at", { ascending: false })
      .limit(1);
    cancellation = ((cancelRows?.[0] ?? null) as { id: string; status: string; reason_key: string; requested_at: string; decision_reason: string | null } | null);
  }
  // Governed cancellation reasons (engine_settings.field, 0020 seed) — labels
  // localized from the configuration itself, same rule as the startup page.
  const fieldEngine = (engines ?? []).find(e => e.engine === "field")?.settings as
    { cancellation_reasons?: { key: string; en: string; ar?: string }[] } | undefined;
  const cancelReasons = (fieldEngine?.cancellation_reasons ?? []).map(r => ({
    key: r.key, label: (locale === "ar" && r.ar) ? r.ar : r.en,
  }));
  // Merge lifecycle columns (0020) into the evidence rows the client sees.
  const evLife = Object.fromEntries(((evMeta ?? []) as { id: string; archived_at: string | null; superseded_by: string | null; deleted_at: string | null }[]).map(m => [m.id, m]));
  const evidenceRows = ([
    ...((ev ?? []) as { id: string; linked_type: string; linked_id: string; evidence_type: string; storage_path: string | null; captured_at: string | null; content_sha256: string | null }[]),
    ...((visitEvidenceRead.data ?? []) as { id: string; linked_type: string; linked_id: string; evidence_type: string; storage_path: string | null; captured_at: string | null }[]),
  ].filter((row, index, all) => all.findIndex(candidate => candidate.id === row.id) === index))
    .map(e => ({ ...e, ...(evLife[e.id] ?? {}) }));
  // F2 — signed thumbnails for synced photo evidence (RLS + storage policy decide access).
  const evidenceUrls: Record<string, string> = {};
  const photoRows = evidenceRows.filter(e => e.evidence_type === "photo" && !!e.storage_path);
  if (photoRows.length) {
    // K-016 — one RLS-authorized batch signing request per workspace render.
    // Signed URLs are deliberately not cached across users or requests: doing
    // so would outlive a permission change. The browser may reuse each 1-hour
    // URL inside this authenticated workspace session.
    const { data: signedRows } = await sb.storage.from("evidence")
      .createSignedUrls(photoRows.map(row => row.storage_path!), 3600);
    for (const [index, signed] of (signedRows ?? []).entries()) {
      if (signed.signedUrl) evidenceUrls[photoRows[index].id] = signed.signedUrl;
    }
  }
  const visitRow = ins.visits as unknown as {
    factory_id: string; visit_type: string; execution_mode: string; window_start: string; window_end: string;
    factories: { name: string; factory_code: string | null; region: string | null; city: string | null; license_number: string | null; activity_class: string | null };
  };
  // O-13/IPAD-FIGMA-DELTA §2B — mid-visit incident logging is a distinct
  // capability from a violation; surfaced here so it's reachable from the
  // active visit and its outputs show in this visit's own workspace.
  const { data: visitIncidents } = ins.visit_id
    ? await sb.from("incident_reports").select("id, incident_type, preliminary_incident_description, created_at").eq("visit_id", ins.visit_id).order("created_at", { ascending: false })
    : { data: [] };
  const incidentLogHref = `/field/incident-reports?visit=${ins.visit_id ?? ""}&factory=${visitRow.factory_id}&inspection=${id}`;
  // M04-136/137 — the factory's most recent prior APPROVED inspection (read
  // granted by the 0020 prior-approved policies; absent rows hide the panel).
  const { data: prevRow } = await sb.from("inspections")
    .select("id, started_at, visits!inner(factory_id)")
    .eq("visits.factory_id", visitRow.factory_id).eq("status", "approved").neq("id", id)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  let prev: PrevComparison | null = null;
  if (prevRow) {
    const [{ data: pResp }, { data: pEv }, { data: pNo }] = await Promise.all([
      sb.from("checklist_responses").select("item_id, response").eq("inspection_id", prevRow.id),
      sb.from("evidence").select("linked_type, linked_id").eq("inspection_id", prevRow.id),
      sb.from("inspections").select("inspection_no").eq("id", prevRow.id).maybeSingle(),   // tolerant pre-0020
    ]);
    const answers: Record<string, string> = {};
    for (const r of (pResp ?? []) as { item_id: string; response: { value?: string } | null }[]) {
      if (r.response?.value) answers[r.item_id] = r.response.value;
    }
    const evidence: Record<string, number> = {};
    for (const e of (pEv ?? []) as { linked_type: string; linked_id: string }[]) {
      if (e.linked_type === "item") evidence[e.linked_id] = (evidence[e.linked_id] ?? 0) + 1;
    }
    prev = {
      label: (pNo as { inspection_no?: string } | null)?.inspection_no ?? prevRow.id.slice(0, 8),
      date: prevRow.started_at ? String(prevRow.started_at).slice(0, 10) : null,
      answers, evidence,
    };
  }
  // Items with locale-resolved guidance (M04-138 · guidance_en/ar) + regulation ref.
  const liveItems = new Map(((itemRows ?? []) as unknown as ItemRow[]).map(row => [row.code, row]));
  const { data: legacySnapshots } = await sb.from("package_version_item_snapshots")
    .select("item_code, snapshot").eq("package_version_id", packageVersion.id);
  const { data: dependencySnapshots } = await sb.from("package_version_dependency_snapshots")
    .select("dependency_key, snapshot").eq("package_version_id", packageVersion.id).eq("dependency_type", "violation");
  const companionSnapshot = Object.fromEntries(((legacySnapshots ?? []) as { item_code: string; snapshot: FrozenItemRow }[])
    .map(row => [row.item_code, row.snapshot]));
  const configuredRows = packageCodes.map(code => frozenDefinition.item_snapshot?.[code] ?? companionSnapshot[code] ?? liveItems.get(code)).filter((row): row is ItemRow | FrozenItemRow => !!row);
  const items: Item[] = configuredRows.map(r => {
    const clauseRelation = Array.isArray(r.regulation_clauses) ? r.regulation_clauses[0] : r.regulation_clauses;
    return ({
    id: r.id, code: r.code, title: r.title,
    response_model: r.response_model, evidence_rule: r.evidence_rule,
    score_excluded_on: r.score_excluded_on, score_weight: r.score_weight,
    guidance: (locale === "ar" && r.guidance_ar) ? r.guidance_ar : r.guidance_en,
    clause: clauseRelation ? { clause_ref: clauseRelation.clause_ref, legal_source: clauseRelation.legal_source } : null,
  });
  });
  // Phase 5 (§15) — full active item library for the additional-item panel
  // (the workspace dedupes against the effective scope).
  const library: Item[] = ((libraryRows ?? []) as unknown as ItemRow[]).map(r => {
    const clauseRelation = Array.isArray(r.regulation_clauses) ? r.regulation_clauses[0] : r.regulation_clauses;
    return ({
    id: r.id, code: r.code, title: r.title,
    response_model: r.response_model, evidence_rule: r.evidence_rule,
    score_excluded_on: r.score_excluded_on, score_weight: r.score_weight,
    guidance: (locale === "ar" && r.guidance_ar) ? r.guidance_ar : r.guidance_en,
    clause: clauseRelation ? { clause_ref: clauseRelation.clause_ref, legal_source: clauseRelation.legal_source } : null,
  });
  });
  // Compliance configuration for the violation auto-display panel (M04-142/143/144).
  const vioConfig = {} as Record<string, VioConfig>;
  const referencedViolationCodes = [...new Set(configuredRows.flatMap(row =>
    Object.values(row.response_model.mapping ?? {}).flatMap(mapping => mapping.violation ? [mapping.violation] : []),
  ))];
  const runtimeViolationIds = [...new Set(((vios ?? []) as { violation_code_id: string }[]).map(row => row.violation_code_id))];
  const [liveByCode, liveById] = await Promise.all([
    referencedViolationCodes.length
      ? sb.from("violation_codes").select("id, code, title, level, penalty_mappings(penalty_ref, legal_basis, mapping_version)").in("code", referencedViolationCodes)
      : Promise.resolve({ data: [] as VCodeRow[], error: null }),
    runtimeViolationIds.length
      ? sb.from("violation_codes").select("id, code, title, level, penalty_mappings(penalty_ref, legal_basis, mapping_version)").in("id", runtimeViolationIds)
      : Promise.resolve({ data: [] as VCodeRow[], error: null }),
  ]);
  const vcodes = [...(liveByCode.data ?? []), ...(liveById.data ?? [])]
    .filter((row, index, all) => all.findIndex(candidate => candidate.id === row.id) === index);
  const liveViolationConfig = Object.fromEntries(((vcodes ?? []) as unknown as VCodeRow[]).map(v => [v.code, v]));
  const companionViolations = Object.fromEntries(((dependencySnapshots ?? []) as { dependency_key: string; snapshot: FrozenVCodeRow }[])
    .map(row => [row.dependency_key, row.snapshot]));
  const configuredViolations = { ...liveViolationConfig, ...companionViolations, ...(frozenDefinition.violation_snapshot ?? {}) };
  for (const v of Object.values(configuredViolations)) {
    // Phase 5 (§18, D-018) — penalty singularity, fail closed: exactly ONE
    // configured penalty mapping is allowed per violation code (Phase 1,
    // enforced by penalty_mappings.violation_code_id UNIQUE). If MORE THAN ONE
    // active mapping ever shows up (defense-in-depth — the unique constraint
    // should make this impossible), the violation renders WITHOUT a penalty
    // and mapping_version is nulled so the workspace refuses to create the
    // candidate. The first row is NEVER silently picked on conflict.
    if (Array.isArray(v.penalty_mappings) && v.penalty_mappings.length > 1) {
      vioConfig[v.code] = { id: v.id, code: v.code, title: v.title, level: v.level, penalty_ref: null, legal_basis: null, mapping_version: null, penalty_conflict: true };
      continue;
    }
    const pm = Array.isArray(v.penalty_mappings) ? v.penalty_mappings[0] : v.penalty_mappings;
    vioConfig[v.code] = { id: v.id, code: v.code, title: v.title, level: v.level, penalty_ref: pm?.penalty_ref ?? null, legal_basis: pm?.legal_basis ?? null, mapping_version: pm?.mapping_version ?? null };
  }
  const settings = Object.fromEntries((engines ?? []).map(e => [e.engine, e.settings])) as {
    evidence?: Record<string, { formats?: string[]; max_mb?: number }>;
    sla?: { action_due_calendar_days?: number };
  };
  // ── SCR-IPAD-630 · Factory-information verification (M04-095..114/190) ──
  // Source-owned factory attributes render as Source Value (Senaei) vs Observed
  // Value; observations persist to inspection_factory_checks via the offline
  // outbox (factory_check op). Senaei is NEVER written back (FND-007/M04-112).
  // inspection_factory_checks read is tolerant: a missing table degrades the
  // module into a load-error banner rather than killing the page.
  const [{ data: factoryFull }, { data: prodRows }, { data: matRows }, { data: licRow }, { data: checkRows, error: checksErr }] = await Promise.all([
    sb.from("factories").select("name, cr_number, license_number, activity_class, region, city, employees_total, employees_saudi, capital_invested, risk_score, risk_band").eq("id", visitRow.factory_id).maybeSingle(),
    sb.from("factory_products").select("name, hs_code, unit, annual_capacity, is_primary").eq("factory_id", visitRow.factory_id).order("is_primary", { ascending: false }),
    sb.from("factory_materials").select("name, source, hs_code").eq("factory_id", visitRow.factory_id),
    sb.from("factory_documents").select("reference_no, valid_from, valid_to").eq("factory_id", visitRow.factory_id).eq("doc_type", "license").order("valid_to", { ascending: false }).limit(1).maybeSingle(),
    sb.from("inspection_factory_checks").select("id, field_key, source_value, observed_value, status, evidence_note").eq("inspection_id", id),
  ]);
  // fields[] — each source-owned attribute as key/label/source=value (M04-100/102).
  const fvFieldDefs: { key: string; en: string }[] = [
    { key: "name", en: "Factory name" },
    { key: "cr_number", en: "Commercial registration (CR)" },
    { key: "license_number", en: "Industrial license number" },
    { key: "activity_class", en: "Activity class" },
    { key: "region", en: "Region" },
    { key: "city", en: "City" },
    { key: "employees_total", en: "Total workforce" },
    { key: "employees_saudi", en: "Saudi workforce" },
    { key: "capital_invested", en: "Invested capital (SAR)" },
  ];
  const fRow = (factoryFull ?? {}) as Record<string, string | number | null>;
  const factoryFields: FactoryField[] = fvFieldDefs.map(d => {
    const v = fRow[d.key];
    return { key: d.key, label: t(`field.fv.field.${d.key}`, d.en), source: v == null ? null : String(v) };
  });
  const factoryLicense: FactoryLicense = licRow
    ? { reference_no: licRow.reference_no ?? null, valid_from: licRow.valid_from ?? null, valid_to: licRow.valid_to ?? null }
    : null;
  const factoryProducts = (prodRows ?? []) as FactoryProductRow[];
  const factoryMaterials = (matRows ?? []) as FactoryMaterialRow[];
  // Factory-360 snapshot — governed risk leg (Risk Engine output on the factory
  // row; RLS-scoped). Health Score is intentionally absent (Health ≠ Risk).
  const factoryRiskScore = fRow.risk_score == null ? null : Number(fRow.risk_score);
  const factoryRiskBand = fRow.risk_band == null ? null : String(fRow.risk_band);
  const factoryRiskBandLabel = factoryRiskBand ? t(`enum.${factoryRiskBand}`, factoryRiskBand.replace(/_/g, " ")) : null;
  const factoryChecks = (checkRows ?? []) as { id: string; field_key: string; source_value: string | null; observed_value: string | null; status: "verified" | "updated"; evidence_note: string | null }[];
  const factoryChecksError = checksErr
    ? t("field.fv.loadError", "Saved checks could not be loaded: {error}")
      .replace("{error}", t("field.fv.unavailable", "data source unavailable"))
    : null;
  const factoryFieldEvidence: FactoryFieldEvidence[] = evidenceRows
    .filter(e => e.linked_type === "factory_field")
    .map(e => ({ linked_id: e.linked_id }));
  const fvStrings: FactoryVerificationStrings = {
    title: t("field.fv.title", "Factory information verification"),
    hint: t("field.fv.hint", "Confirm each Senaei-sourced attribute or record what you observed on site. Observations are stored separately — the source record is never overwritten (M04-112)."),
    sourceTag: t("field.fv.sourceTag", "Senaei source"),
    colField: t("field.fv.colField", "Attribute"),
    colSource: t("field.fv.colSource", "Source value"),
    colObserved: t("field.fv.colObserved", "Observed value"),
    colStatus: t("field.fv.colStatus", "Status"),
    colEvidence: t("field.fv.colEvidence", "Evidence"),
    verifyBtn: t("field.fv.verifyBtn", "Verify as-is"),
    verified: t("field.fv.verified", "Verified"),
    updated: t("field.fv.updated", "Updated"),
    unchecked: t("field.fv.unchecked", "Not checked"),
    observedPlaceholder: t("field.fv.observedPlaceholder", "Enter observed value…"),
    noteLabel: t("field.fv.noteLabel", "Note"),
    notePlaceholder: t("field.fv.notePlaceholder", "Optional observation note…"),
    noteHeld: t("field.fv.noteHeld", "Note saved locally — it attaches once you record an observation for this field."),
    changeCounter: t("field.fv.changeCounter", "{n} field(s) updated"),
    noChanges: t("field.fv.noChanges", "No changes"),
    reviewTitle: t("field.fv.reviewTitle", "Changes for review"),
    reviewEmpty: t("field.fv.reviewEmpty", "No source values were changed."),
    before: t("field.fv.before", "Before"),
    after: t("field.fv.after", "After"),
    evAttach: t("field.fv.evAttach", "📷 Attach evidence"),
    evCount: t("field.fv.evCount", "{n} evidence"),
    evQueued: t("field.fv.evQueued", "Evidence queued for {field}"),
    evTooLarge: t("field.fv.evTooLarge", "{name} exceeds the {mb} MB limit for {type} evidence"),
    evBadFormat: t("field.fv.evBadFormat", "{name}: unsupported format for {type} evidence (allowed: {formats})"),
    annotateTitle: t("field.fv.annotateTitle", "Annotate photo"),
    annotateHint: t("field.fv.annotateHint", "Draw on the photo to highlight the observation. The annotated copy is queued alongside the original."),
    annotateSave: t("field.fv.annotateSave", "Save annotation"),
    annotateSkip: t("field.fv.annotateSkip", "Attach without annotation"),
    annotateClear: t("field.fv.annotateClear", "Clear"),
    annotateCancel: t("field.fv.annotateCancel", "Cancel"),
    loadError: t("field.fv.loadError", "Saved checks could not be loaded: {error}"),
    syncFailed: t("field.fv.syncFailed", "Sync failed"),
    retry: t("field.fv.retry", "Retry"),
    savedLocal: t("field.fv.savedLocal", "Saved locally — syncing"),
    readOnly: t("field.fv.readOnly", "This inspection is read-only — factory checks cannot be changed."),
    licenseTitle: t("field.fv.licenseTitle", "Industrial license"),
    licRef: t("field.fv.licRef", "Reference"),
    licIssue: t("field.fv.licIssue", "Issued"),
    licExpiry: t("field.fv.licExpiry", "Expires"),
    licNone: t("field.fv.licNone", "No synced license document."),
    productsTitle: t("field.fv.productsTitle", "Products"),
    productsEmpty: t("field.fv.productsEmpty", "No products recorded for this factory."),
    colProduct: t("field.fv.colProduct", "Product"),
    colHs: t("field.fv.colHs", "HS code"),
    colCapacity: t("field.fv.colCapacity", "Annual capacity"),
    primaryTag: t("field.fv.primaryTag", "Primary"),
    materialsTitle: t("field.fv.materialsTitle", "Raw materials"),
    materialsEmpty: t("field.fv.materialsEmpty", "No raw materials recorded for this factory."),
    colMaterial: t("field.fv.colMaterial", "Material"),
    colMatSource: t("field.fv.colMatSource", "Source"),
    srcLocal: t("field.fv.srcLocal", "Local"),
    srcImported: t("field.fv.srcImported", "Imported"),
    // SAQEEL Field Establishment File — new sections (pre-translated en+ar).
    snapshotTitle: tr("field.fv.snapshotTitle", "Factory 360 snapshot", "لمحة المنشأة 360"),
    snapshotAdvisory: tr("field.fv.snapshotAdvisory", "Advisory", "استشاري"),
    riskScore: tr("field.fv.riskScore", "Risk score", "مؤشر الخطورة"),
    riskUnknown: tr("field.fv.riskUnknown", "No band", "غير محدد"),
    drafts: tr("field.fv.drafts", "Drafts", "مسودات"),
    pendingSync: tr("field.fv.pendingSync", "Pending sync", "بانتظار المزامنة"),
    licensesDocs: tr("field.fv.licensesDocs", "Licenses & documents", "التراخيص والمستندات"),
    incidentTitle: tr("field.fv.incidentTitle", "Log an incident during the visit", "رصد حادث أثناء الزيارة"),
    incidentDesc: tr("field.fv.incidentDesc", "Log an incident observed during the visit. It surfaces in this visit's outputs — separate from violation items.", "سجّل حادثاً تم رصده أثناء الزيارة، ليظهر ضمن مخرجات الزيارة — مستقل عن بنود المخالفة."),
    incidentLog: tr("field.fv.incidentLog", "Log incident", "تسجيل حادث"),
    inspectionItems: tr("field.fv.inspectionItems", "Inspection items", "بنود التفتيش"),
    // Pending-integration scaffolding — design structure awaiting a governed
    // source/API; captured values are NOT persisted (pre-translated en+ar).
    pendingIntegration: tr("field.fv.pendingIntegration", "Pending integration", "قيد الربط"),
    pendingCaption: tr("field.fv.pendingCaption", "Design structure pending a governed source — captured values are not saved yet.", "هيكل تصميمي بانتظار مصدر معتمد — القيم المدخلة لا تُحفظ بعد."),
    selectPlaceholder: tr("field.fv.selectPlaceholder", "Select…", "اختر…"),
    estDataTitle: tr("field.fv.estDataTitle", "Establishment data", "بيانات المنشأة"),
    spatialAuth: tr("field.fv.spatialAuth", "Establishment spatial authority", "الإشراف المكاني للمنشأة"),
    spatialAuthModon: tr("field.fv.spatialAuthModon", "MODON", "هيئة مدن"),
    optOther: tr("field.fv.optOther", "Other", "أخرى"),
    energyType: tr("field.fv.energyType", "Energy type used", "نوع الطاقة المستخدمة"),
    energyGas: tr("field.fv.energyGas", "Natural gas", "الغاز الطبيعي"),
    energyElectricity: tr("field.fv.energyElectricity", "Electricity", "الكهرباء"),
    estStatus: tr("field.fv.estStatus", "Establishment status", "حالة المنشأة"),
    estStatusProduction: tr("field.fv.estStatusProduction", "In production", "الإنتاج"),
    estStatusClosed: tr("field.fv.estStatusClosed", "Closed", "مغلق"),
    prodStatus: tr("field.fv.prodStatus", "Production status", "الحالة الإنتاجية"),
    prodContinuous: tr("field.fv.prodContinuous", "Continuous production", "إنتاج مستمر"),
    prodNonContinuous: tr("field.fv.prodNonContinuous", "Non-continuous production", "إنتاج غير مستمر"),
    closureJustification: tr("field.fv.closureJustification", "Establishment status justification", "مبرر حالة المنشأة"),
    closureJustificationPh: tr("field.fv.closureJustificationPh", "Shown when stopped/closed/repair/relocated is chosen", "يظهر عند اختيار متوقف/مغلق/إصلاح/نقل"),
    closingAuthority: tr("field.fv.closingAuthority", "Government body that closed it", "الجهة الحكومية التي قامت بالإغلاق"),
    authCivilDefense: tr("field.fv.authCivilDefense", "Civil Defense", "الدفاع المدني"),
    authMunicipality: tr("field.fv.authMunicipality", "Municipality", "البلدية"),
    authModon: tr("field.fv.authModon", "MODON", "هيئة المدن الصناعية"),
    exportsProducts: tr("field.fv.exportsProducts", "Does the establishment export products?", "هل يتم تصدير منتجات؟"),
    optYes: tr("field.fv.optYes", "Yes", "نعم"),
    optNo: tr("field.fv.optNo", "No", "لا"),
    contactsTitle: tr("field.fv.contactsTitle", "Contacts", "جهات التواصل"),
    contactLabel: tr("field.fv.contactLabel", "Contact", "جهة"),
    contactDelete: tr("field.fv.contactDelete", "Delete", "حذف"),
    addContact: tr("field.fv.addContact", "Add contact", "إضافة جهة اتصال"),
    cName: tr("field.fv.cName", "Name", "الاسم"),
    cTitle: tr("field.fv.cTitle", "Title", "الصفة"),
    cId: tr("field.fv.cId", "ID number", "رقم الهوية"),
    cMobile: tr("field.fv.cMobile", "Mobile", "الجوال"),
    cEmail: tr("field.fv.cEmail", "Email", "البريد الإلكتروني"),
    workforceTitle: tr("field.fv.workforceTitle", "Workforce", "العمالة"),
    machinesTitle: tr("field.fv.machinesTitle", "Machines", "الآلات"),
    spareTitle: tr("field.fv.spareTitle", "Spare parts", "قطع غيار"),
    shift1: tr("field.fv.shift1", "Shift 1", "الوردية الأولى"),
    shift2: tr("field.fv.shift2", "Shift 2", "الوردية الثانية"),
    shift3: tr("field.fv.shift3", "Shift 3", "الوردية الثالثة"),
    totalLabel: tr("field.fv.totalLabel", "Total", "المجموع"),
    workerUnit: tr("field.fv.workerUnit", "workers", "عامل"),
    itemCheck1: tr("field.fv.itemCheck1", "Exemption beneficiary", "مستفيد من الإعفاء"),
    itemCheck2: tr("field.fv.itemCheck2", "Chemical clearance beneficiary", "مستفيد من الفسح الكيميائي"),
    itemCheck3: tr("field.fv.itemCheck3", "Present at site", "موجودة في المنشأة"),
    categoryPending: tr("field.fv.categoryPending", "This category is pending integration — no governed source yet.", "هذه الفئة قيد الربط — لا يوجد مصدر معتمد بعد."),
    // Presentational workflow step (Factory-360 header).
    stepBadge: tr("field.fv.stepBadge", "Step 2 of 4", "الخطوة 2 من 4"),
    // Violation history — no governed factory-scoped source; badged empty scaffold.
    violationHistory: tr("field.fv.violationHistory", "Violation history", "سجل المخالفات"),
    violationHistoryPending: tr("field.fv.violationHistoryPending", "No governed violation-history source yet.", "لا يوجد مصدر معتمد لسجل المخالفات بعد."),
    // Standalone visit-notes scaffold (in-memory only, not persisted).
    visitNotesTitle: tr("field.fv.visitNotesTitle", "Notes", "الملاحظات"),
    visitNoteLabel: tr("field.fv.visitNoteLabel", "Note detail", "تفاصيل الملاحظة"),
    visitNotePlaceholder: tr("field.fv.visitNotePlaceholder", "Record a free-text note for this visit…", "دوّن ملاحظة نصية لهذه الزيارة…"),
    // Workforce roster scaffold (no governed count source).
    workerTypeLabel: tr("field.fv.workerTypeLabel", "Worker type", "نوع العامل"),
    workerTypePh: tr("field.fv.workerTypePh", "e.g. Administrative", "مثال: إدارية"),
    addWorkerRow: tr("field.fv.addWorkerRow", "Add worker type", "إضافة نوع عامل"),
    grandTotal: tr("field.fv.grandTotal", "Grand total", "المجموع الكلي"),
    rosterEmpty: tr("field.fv.rosterEmpty", "No worker types added yet — add a row to record a shift breakdown (not saved yet).", "لم تتم إضافة أنواع عمال بعد — أضف صفاً لتسجيل توزيع الورديات (لا يُحفظ بعد)."),
  };
  // Read-only unless the inspection is actively in progress (submitted/approved lock it).
  const factoryReadOnly = ins.status !== "in_progress";
  const definition = (ins.package_versions as unknown as { definition: { sections: { key: string; title: string; items?: string[] }[]; action_forms?: FormDef[] } }).definition;
  // Enum DISPLAY labels for the response buttons — DB values stay untouched.
  const enumLabels = {} as Record<string, string>;
  for (const it of items) {
    for (const r of (it.response_model.responses ?? [])) enumLabels[r] = enumLabels[r] ?? t(`enum.${r}`, r.replace(/_/g, " "));
  }
  // Site-condition flag labels (keys come from response_model.conditional data).
  const ctxLabels = {} as Record<string, string>;
  for (const k of contextFlags(items)) ctxLabels[k] = t(`field.ws.ctx.${k}`, humanize(k));
  // Action-form field labels (fields come from package definition data).
  const afFieldLabels = {} as Record<string, string>;
  for (const d of definition.action_forms ?? []) for (const f of d.fields) afFieldLabels[f] = afFieldLabels[f] ?? t(`field.ws.af.${f}`, humanize(f));
  const strings: WorkspaceStrings = {
    sync: {
      synced: t("field.ws.sync.synced", "Synced"),
      offline: t("field.ws.sync.offline", "Offline — work saved locally"),
      pending: t("field.ws.sync.pending", "Pending sync"),
      syncing: t("field.ws.sync.syncing", "Syncing…"),
      conflict: t("field.ws.sync.conflict", "Conflict — action required"),
      failed: t("field.ws.sync.failed", "Sync failed — will retry"),
    },
    connectivityOffline: t("field.ws.connectivity.offline", "No connection — your work is saved locally and will sync when you're back online."),
    connectivityWeak: t("field.ws.connectivity.weak", "Weak connection detected — saves may be slower than usual."),
    answered: t("field.ws.answered", "{a}/{b} answered · autosaved locally"),
    conflictHead: t("field.ws.conflictHead", "⚠ Conflict on {code} — explicit resolution (STM-SYNC-002, no silent overwrite)"),
    thisDevice: t("field.ws.thisDevice", "This device"),
    server: t("field.ws.server", "Server"),
    keepMine: t("field.ws.keepMine", "Keep mine"),
    keepServer: t("field.ws.keepServer", "Keep server"),
    returnedScope: t("field.ws.returnedScope", "Returned — correction scope: {sections}."),
    returnedNote: t("field.ws.returnedNote", "Only these sections are editable; resubmission creates the next final submitted version (STM-COR-001/002)."),
    submittedTitle: t("field.ws.submittedTitle", "Submitted — final submitted version."),
    submittedBody: t("field.ws.submittedBody", "Content locked by the database (proven B3); corrections only via reviewer return."),
    // SCR-IPAD-660 completion state (CR-320/324/327/335/336). The version number
    // and id are SERVER-assigned and only known once the outbox op syncs, so
    // every one of these renders nothing until the server has confirmed.
    completionVersionLabel: t("field.ws.completionVersionLabel", "Submission version"),
    completionCreatedTitle: t("field.ws.completionCreatedTitle", "What this submission created"),
    completionCreatedVersion: t("field.ws.completionCreatedVersion", "An immutable submitted version — content can no longer be edited here."),
    completionCreatedAudit: t("field.ws.completionCreatedAudit", "A submission audit event recording the version and section count."),
    completionCreatedReview: t("field.ws.completionCreatedReview", "A review task for the reviewer — approve, return for correction, or reject."),
    completionIdempotency: t("field.ws.completionIdempotency", "Protected by an idempotency key — a retry can never create a second version."),
    completionReused: t("field.ws.completionReused", "Already submitted — the server returned the existing version rather than creating a new one."),
    completionPendingSync: t("field.ws.completionPendingSync", "Not submitted yet — this is queued on the device and will submit exactly once when the connection returns. No version exists until the server assigns one."),
    completionFailedTitle: t("field.ws.completionFailedTitle", "Submission did not complete."),
    completionFailedBody: t("field.ws.completionFailedBody", "The server rejected this submission, so no submitted version was created. Your answers are safe on this device. Retry, or contact your supervisor if it keeps failing."),
    lockedSection: t("field.ws.lockedSection", "Not in return scope — locked read-only (M06-043); DB also rejects edits."),
    mandatoryPhoto: t("field.ws.mandatoryPhoto", "📷 Mandatory photo"),
    submitBtn: t("field.ws.submitBtn", "Review & submit — final version"),
    autoViolation: t("field.ws.autoViolation", "{code} → auto-violation {violation}{actionForm}{photo} (config-driven, non-overridable M09-026)"),
    plusActionForm: t("field.ws.plusActionForm", " + blocking action form"),
    plusPhoto: t("field.ws.plusPhoto", " + mandatory photo"),
    evidenceQueued: t("field.ws.evidenceQueued", "Evidence queued for {code} · sha256 {sha}… — linked, custody-stamped (ENG-07)"),
    blockers: t("field.ws.blockers", "Blockers: {items} unanswered (ERR-SUB-001 — state stays in progress)"),
    submitting: t("field.ws.submitting", "Submitting final version v{v} (idempotency-protected)…"),
    queuedOffline: t("field.ws.queuedOffline", "Queued — will submit exactly once on reconnect (never claims submitted while unsynced)"),
    retryNow: t("field.ws.retryNow", "Retry now"),
    exitBtn: t("field.ws.exitBtn", "Save & exit"),
    exitTitle: t("field.ws.exitTitle", "Exit this inspection?"),
    exitSavedSynced: t("field.ws.exitSavedSynced", "All your answers are saved on this device and synced to the server. You can safely continue later from My Tasks."),
    exitSavedLocal: t("field.ws.exitSavedLocal", "All your answers are saved on this device and will sync automatically once you're back online. You can safely continue later from My Tasks."),
    exitConfirm: t("field.ws.exitConfirm", "Exit to My Tasks"),
    exitCancel: t("field.ws.exitCancel", "Stay"),
    // Phase 4B — active-session cancellation request (§12)
    cancelHeading: t("field.ws.cancel.heading", "Request cancellation"),
    cancelCaption: t("field.ws.cancel.caption", "Cancellation is a request: Operations decides. You can keep working until a decision arrives — nothing is deleted either way."),
    cancelSelectReason: t("field.ws.cancel.selectReason", "Select cancellation reason — mandatory"),
    cancelCommentPlaceholder: t("field.ws.cancel.commentPlaceholder", "Comments (mandatory for reason “Other”)"),
    cancelSubmit: t("field.ws.cancel.submit", "Request cancellation"),
    cancelPending: t("field.ws.cancel.pending", "Cancellation requested — awaiting Operations decision. You can keep working."),
    cancelApprovedTitle: t("field.ws.cancel.approvedTitle", "Cancellation approved by Operations."),
    cancelApprovedBody: t("field.ws.cancel.approvedBody", "This visit is cancelled and the workspace is now read-only. Everything captured is preserved for audit."),
    cancelRejected: t("field.ws.cancel.rejected", "Cancellation was rejected by Operations — the visit continues. Reason: {reason}"),
    cancelFailed: t("field.ws.cancel.failed", "The cancellation request could not be sent. Check the connection, then try again."),
    cancelReasonsMissing: t("field.ws.cancel.reasonsMissing", "Cancellation reasons unavailable — engine_settings.field not seeded yet (0020 pending)."),
    enumLabels,
    // — Slice E2 runtime depth —
    progress: t("field.ws.progress", "{pct}% complete"),
    summaryTitle: t("field.ws.summaryTitle", "Live summary"),
    sumAnswered: t("field.ws.sum.answered", "Answered"),
    sumPending: t("field.ws.sum.pending", "Pending"),
    sumCompliant: t("field.ws.sum.compliant", "Compliant"),
    sumNonCompliant: t("field.ws.sum.nonCompliant", "Non-compliant"),
    sumViolations: t("field.ws.sum.violations", "Violations"),
    sumEvidence: t("field.ws.sum.evidence", "Evidence"),
    ctxTitle: t("field.ws.ctx.title", "Site conditions"),
    ctxHint: t("field.ws.ctx.hint", "These flags drive conditional checklist visibility (M04-119); they persist with the inspection."),
    ctxYes: t("field.ws.ctx.yes", "Yes"),
    ctxNo: t("field.ws.ctx.no", "No"),
    ctxLabels,
    guidanceLabel: t("field.ws.guidance", "Guidance"),
    conditionalBadge: t("field.ws.conditional", "Conditional"),
    aiExplainTitle: t("field.ws.aiExplain.title", "Explain this requirement"),
    aiExplainDescription: t("field.ws.aiExplain.description", "Advisory only. Uses this locked item, its guidance and evidence rule; it never changes your answer or decision."),
    aiExplain: t("field.ws.aiExplain.generate", "Explain requirement"),
    aiUnavailable: t("field.ws.aiExplain.unavailable", "AI explanation unavailable"),
    aiEvidence: t("field.ws.aiExplain.evidence", "Source references"),
    aiAdvisory: t("field.ws.aiExplain.advisory", "Human decision required"),
    noteLabel: t("field.ws.note.label", "Inspector note"),
    notePlaceholder: t("field.ws.note.placeholder", "Add an observation note (saved with the answer)…"),
    naExcluded: t("field.ws.naExcluded", "N/A — excluded from scoring for this item"),
    dateLabel: t("field.ws.date.label", "Recorded date"),
    evAdd: t("field.ws.ev.add", "📷 Add photo"),
    evAddDoc: t("field.ws.ev.addDoc", "📄 Add document"),
    evCount: t("field.ws.ev.count", "{n}/{min} evidence"),
    evRequired: t("field.ws.ev.required", "Evidence required before submit: {min} minimum"),
    evQueuedAlt: t("field.ws.ev.queuedAlt", "Queued evidence (unsynced)"),
    evTooLarge: t("field.ws.ev.tooLarge", "{name} exceeds the {mb} MB limit for {type} evidence"),
    evBadFormat: t("field.ws.ev.badFormat", "{name}: unsupported format for {type} evidence (allowed: {formats})"),
    afBlocking: t("field.ws.af.blocking", "Blocking — submission refused until this form is complete (M09-027)"),
    afComplete: t("field.ws.af.complete", "Complete"),
    afIncomplete: t("field.ws.af.incomplete", "Incomplete"),
    afSaved: t("field.ws.af.saved", "Action form saved for {code}"),
    afFieldLabels,
    vioTitle: t("field.ws.vio.title", "Violations implied by answers"),
    vioNone: t("field.ws.vio.none", "No violations implied by current answers."),
    vioPenalty: t("field.ws.vio.penalty", "Penalty {ref} · {basis}"),
    vioLevel: t("field.ws.vio.level", "Severity {level}"),
    vioAction: t("field.ws.vio.action", "Corrective action: {status}"),
    vioInvalidated: t("field.ws.vio.invalidated", "Invalidated — the answer changed back to compliant. Kept for audit; no penalty or action is due from this candidate."),
    vioPenaltyConflict: t("field.ws.vio.penaltyConflict", "Penalty mapping unavailable — configuration conflict"),
    // — Phase 5 item lifecycle (§15) —
    libTitle: t("field.ws.lib.title", "Item library"),
    libHint: t("field.ws.lib.hint", "Add items from the active library to this visit. Added items count toward progress and compliance immediately and follow their own response and evidence rules."),
    libAdd: t("field.ws.lib.add", "Add"),
    libEmpty: t("field.ws.lib.empty", "Every active library item is already in scope."),
    libAddedGroup: t("field.ws.lib.addedGroup", "Added items"),
    libAddedMsg: t("field.ws.lib.addedMsg", "{code} added to this visit"),
    deselectBtn: t("field.ws.deselect.btn", "Deselect"),
    deselectTitle: t("field.ws.deselect.title", "Deselect {code}"),
    deselectReason: t("field.ws.deselect.reason", "Reason"),
    deselectReasonPh: t("field.ws.deselect.reasonPh", "Why is this item not applicable to this visit? — mandatory, kept in the audit trail"),
    deselectConfirm: t("field.ws.deselect.confirm", "Deselect with reason"),
    deselectCancel: t("field.ws.deselect.cancel", "Cancel"),
    deselectNeedsReason: t("field.ws.deselect.needsReason", "A deselection reason is mandatory"),
    deselectedTitle: t("field.ws.deselected.title", "Deselected ({n})"),
    deselectedAudit: t("field.ws.deselected.audit", "Deselected items stay in the audit trail with their reason. They need no answer or evidence, create no violation, and are excluded from the compliance rate."),
    restoreBtn: t("field.ws.restore.btn", "Restore"),
    restoredMsg: t("field.ws.restore.msg", "{code} restored to this visit"),
    // — Phase 5 manual action forms (§18) —
    afAddTitle: t("field.ws.af.addTitle", "Action forms"),
    afAddHint: t("field.ws.af.addHint", "Included is not completed: an added form stays open until its mandatory fields are filled and it is completed separately."),
    afAddPick: t("field.ws.af.addPick", "Published action form template"),
    afAddBtn: t("field.ws.af.addBtn", "Add action form"),
    afAddedMsg: t("field.ws.af.addedMsg", "Action form added — it is open, not completed"),
    afNone: t("field.ws.af.none", "No published action form templates available."),
    valTitle: t("field.ws.val.title", "Validation issues (grouped by section)"),
    valUnanswered: t("field.ws.val.unanswered", "Unanswered: {items}"),
    valEvidence: t("field.ws.val.evidence", "Mandatory evidence missing: {items}"),
    valForms: t("field.ws.val.forms", "Action form incomplete: {items}"),
    ready: t("field.ws.ready", "All blocking validations pass — ready to submit"),
    notReady: t("field.ws.notReady", "{n} blocking issue(s) — submission will be refused"),
    // — Slice F2 evidence & media depth —
    panelTitle: t("field.ws.panel.title", "Factory & visit context"),
    panelFactory: t("field.ws.panel.factory", "Factory card"),
    panelVisit: t("field.ws.panel.visit", "Visit card"),
    panelCode: t("field.ws.panel.code", "Factory code"),
    panelLicense: t("field.ws.panel.license", "Industrial license"),
    panelRegion: t("field.ws.panel.region", "Region / city"),
    panelActivity: t("field.ws.panel.activity", "Activity class"),
    panelWindow: t("field.ws.panel.window", "Visit window"),
    panelTypeMode: t("field.ws.panel.typeMode", "Type · mode"),
    panelPkg: t("field.ws.panel.pkg", "Checklist version used for the inspection (locked)"),
    prevSource: t("field.ws.prev.source", "Comparing against the factory's latest approved inspection {ref} · {date} (M04-136/137)"),
    prevLine: t("field.ws.prev.line", "Previous inspection: {value} · {n} evidence"),
    prevNoAnswer: t("field.ws.prev.noAnswer", "not answered"),
    evSyncedAlt: t("field.ws.ev.syncedAlt", "Synced evidence"),
    evArchived: t("field.ws.ev.archived", "Archived — replaced"),
    evReplace: t("field.ws.ev.replace", "Replace"),
    evDelete: t("field.ws.ev.delete", "Delete"),
    evDeletedMsg: t("field.ws.ev.deleted", "Evidence removed from the checklist — soft-deleted with reason, audit event recorded (M04-164)"),
    saveFailed: t("field.ws.saveFailed", "This change could not be synchronized. It remains queued where possible — try again."),
    evDeleteQueuedOffline: t("field.ws.ev.deleteQueued", "Delete queued — will apply with reason on reconnect (M04-164)"),
    evArchiveQueued: t("field.ws.ev.archiveQueued", "Replacement queued for {code} — previous file will be archived, never destroyed (M04-163)"),
    evDeleteTitle: t("field.ws.ev.deleteTitle", "Delete evidence (M04-164)"),
    evDeleteReason: t("field.ws.ev.deleteReason", "Deletion reason"),
    evDeleteReasonPh: t("field.ws.ev.deleteReasonPh", "Why is this evidence being removed? — mandatory, audited"),
    evDeleteConfirm: t("field.ws.ev.deleteConfirm", "Delete with reason"),
    evDeleteCancel: t("field.ws.ev.deleteCancel", "Cancel"),
    evDeleteNeedsReason: t("field.ws.ev.deleteNeedsReason", "A deletion reason is mandatory (M04-164)"),
    annot: {
      title: t("field.ws.annot.title", "Annotate photo (M04-109)"),
      hint: t("field.ws.annot.hint", "Draw on the photo — pen strokes or rectangle highlights. Confirm flattens the annotation into the evidence image before it is queued (offline-safe)."),
      pen: t("field.ws.annot.pen", "✏️ Pen"),
      rect: t("field.ws.annot.rect", "▭ Highlight"),
      undo: t("field.ws.annot.undo", "Undo"),
      clear: t("field.ws.annot.clear", "Clear"),
      cancel: t("field.ws.annot.cancel", "Discard photo"),
      confirm: t("field.ws.annot.confirm", "Attach evidence"),
      imgAlt: t("field.ws.annot.imgAlt", "Captured photo with annotation layer"),
    },
    sig: {
      title: t("field.ws.sig.title", "Factory representative acknowledgement"),
      hint: t("field.ws.sig.hint", "Sign in the box below. The signature image, name and timestamp are stored inside the final submitted version (DEC-009)."),
      nameLabel: t("field.ws.sig.name", "Representative name"),
      namePlaceholder: t("field.ws.sig.namePh", "Full name as recorded on site"),
      clear: t("field.ws.sig.clear", "Clear"),
      cancel: t("field.ws.sig.cancel", "Cancel"),
      confirm: t("field.ws.sig.confirm", "Confirm & submit"),
      required: t("field.ws.sig.required", "Both a drawn signature and the representative name are required (DEC-009)."),
    },
  };
  const pvv = ins.package_versions as unknown as { packages: { code: string }; version_label: string };
  const panel: WorkspacePanel = {
    factory: { name: visitRow.factories.name, code: visitRow.factories.factory_code, region: visitRow.factories.region, city: visitRow.factories.city, license: visitRow.factories.license_number, activity: visitRow.factories.activity_class },
    visit: { window_start: visitRow.window_start, window_end: visitRow.window_end, visit_type: visitRow.visit_type, execution_mode: visitRow.execution_mode },
    pkg: { code: pvv.packages.code, label: pvv.version_label },
  };
  const inspectionNo = (ins as unknown as { inspection_no: string | null }).inspection_no ?? null;
  return (
    <>
      {header(
        <bdi>{t("field.ws.title", "Inspection — {factory}").replace("{factory}", (ins.visits as unknown as { factories: { name: string } }).factories.name)}</bdi>,
        <span className="id-code">{(ins.package_versions as unknown as { packages: { code: string }; version_label: string }).packages.code} · {(ins.package_versions as unknown as { version_label: string }).version_label} · {t("field.ws.locked", "locked")}</span>,
      )}
      <div className={styles.page}>
      {/* SCR-IPAD-630 — factory-verification step precedes the checklist (M04-095) */}
      <FactoryVerification
        inspectionId={id}
        userId={user.id}
        fields={factoryFields}
        license={factoryLicense}
        products={factoryProducts}
        materials={factoryMaterials}
        initialChecks={factoryChecks}
        checksLoadError={factoryChecksError}
        serverFieldEvidence={factoryFieldEvidence}
        evidenceLimits={settings.evidence ?? {}}
        readOnly={factoryReadOnly}
        strings={fvStrings}
        riskScore={factoryRiskScore}
        riskBand={factoryRiskBand}
        riskBandLabel={factoryRiskBandLabel}
        incidentHref={incidentLogHref}
      />

      {/* O-13/IPAD-FIGMA-DELTA §2B — distinct from a violation; surfaced in
          this visit's own outputs, not folded into the checklist. */}
      <section className={styles.card} aria-labelledby="field-ws-incidents-heading" style={{ padding: "var(--space-4)" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <h2 id="field-ws-incidents-heading" style={{ margin: 0 }}>{t("field.ws.incidents.heading", "Incident reports for this visit")}</h2>
          <a className="btn btn-secondary btn-lg" href={incidentLogHref}>{t("field.ws.incidents.log", "Log incident")}</a>
        </div>
        {(visitIncidents ?? []).length ? (
          <ul style={{ marginBlockStart: "var(--space-2)" }}>
            {(visitIncidents ?? []).map(row => (
              <li key={row.id}>
                <bdi>{row.incident_type || t("field.ws.incidents.untitled", "Incident")}</bdi>
                {row.preliminary_incident_description ? <span className="t-caption"> · {row.preliminary_incident_description.slice(0, 100)}</span> : null}
              </li>
            ))}
          </ul>
        ) : <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>{t("field.ws.incidents.empty", "No incidents logged for this visit.")}</p>}
      </section>

      <Workspace
        userId={user.id}
        inspection={ins as never}
        items={items}
        serverResponses={(resp ?? []) as never}
        serverEvidence={(ev ?? []) as never}
        serverForms={(afRows ?? []) as never}
        serverViolations={(vios ?? []) as never}
        serverItemStates={(itemStateRows ?? []) as never}
        library={library}
        actionTemplates={((actionTemplateRows ?? []) as { id: string; template_key: string; title_en: string; title_ar: string }[]).map(row => ({
          id: row.id, key: row.template_key,
          title: (locale === "ar" && row.title_ar) ? row.title_ar : row.title_en,
        }))}
        serverContext={(ctxRow as { context?: Record<string, string> } | null)?.context ?? {}}
        vioConfig={vioConfig}
        evidenceLimits={settings.evidence ?? {}}
        actionDueDays={settings.sla?.action_due_calendar_days ?? 14}
        strings={strings}
        evidenceUrls={evidenceUrls}
        prev={prev}
        panel={panel}
        inspectionNo={inspectionNo}
        locale={locale === "ar" ? "ar" : "en"}
        cancellation={cancellation as never}
        cancelReasons={cancelReasons}
        journeySchemaAvailable={journeySchemaAvailable}
      />
      </div>
    </>
  );
}
