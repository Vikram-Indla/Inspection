import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Workspace, { type WorkspaceStrings, type WorkspacePanel, type PrevComparison } from "./Workspace";
import FactoryVerification, {
  type FactoryField, type FactoryProductRow, type FactoryMaterialRow,
  type FactoryLicense, type FactoryFieldEvidence, type FactoryVerificationStrings,
} from "./FactoryVerification";
import { contextFlags, type FormDef, type Item, type VioConfig } from "./runtime";

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
  const sb = await supabaseServer();
  const { data: ins } = await sb.from("inspections")
    .select("id, status, visit_id, package_versions(id, version_label, definition, packages(code, title)), visits(factory_id, visit_type, execution_mode, window_start, window_end, factories(name, factory_code, region, city, license_number, activity_class)), submission_versions(version_number), reviews(returned_sections, decision_reason, decided_at)")
    .eq("id", id).single();
  if (!ins) {
    return <Shell current="/field" title={t("field.ws.notFound", "Not found")}><div /></Shell>;
  }
  const packageVersion = ins.package_versions as unknown as { id: string; definition: { sections?: { items?: string[] }[]; item_snapshot?: Record<string, FrozenItemRow>; violation_snapshot?: Record<string, FrozenVCodeRow> } };
  const frozenDefinition = packageVersion.definition;
  const packageCodes = [...new Set((frozenDefinition.sections ?? []).flatMap(section => section.items ?? []))];
  const itemRead = packageCodes.length
    ? sb.from("inspection_items")
      .select("id, code, title, response_model, evidence_rule, score_excluded_on, score_weight, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)")
      .in("code", packageCodes)
    : Promise.resolve({ data: [] as ItemRow[], error: null });

  const [{ data: itemRows }, { data: resp }, { data: ev }, { data: vios }, { data: engines }] = await Promise.all([
    itemRead,
    sb.from("checklist_responses").select("item_id, response, updated_at").eq("inspection_id", id),
    sb.from("evidence").select("id, linked_type, linked_id, evidence_type, storage_path, captured_at").eq("inspection_id", id),
    sb.from("violations").select("id, violation_code_id").eq("inspection_id", id),
    sb.from("engine_settings").select("engine, settings").in("engine", ["evidence", "sla"]),
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
  // Merge lifecycle columns (0020) into the evidence rows the client sees.
  const evLife = Object.fromEntries(((evMeta ?? []) as { id: string; archived_at: string | null; superseded_by: string | null; deleted_at: string | null }[]).map(m => [m.id, m]));
  const evidenceRows = ([
    ...((ev ?? []) as { id: string; linked_type: string; linked_id: string; evidence_type: string; storage_path: string | null; captured_at: string | null }[]),
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
    sb.from("factories").select("name, cr_number, license_number, activity_class, region, city, employees_total, employees_saudi, capital_invested").eq("id", visitRow.factory_id).maybeSingle(),
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
    answered: t("field.ws.answered", "{a}/{b} answered · autosaved locally"),
    conflictHead: t("field.ws.conflictHead", "⚠ Conflict on {code} — explicit resolution (STM-SYNC-002, no silent overwrite)"),
    thisDevice: t("field.ws.thisDevice", "This device"),
    server: t("field.ws.server", "Server"),
    keepMine: t("field.ws.keepMine", "Keep mine"),
    keepServer: t("field.ws.keepServer", "Keep server"),
    returnedScope: t("field.ws.returnedScope", "Returned — correction scope: {sections}."),
    returnedNote: t("field.ws.returnedNote", "Only these sections are editable; resubmission creates the next immutable version (STM-COR-001/002)."),
    submittedTitle: t("field.ws.submittedTitle", "Submitted — immutable v1."),
    submittedBody: t("field.ws.submittedBody", "Content locked by the database (proven B3); corrections only via reviewer return."),
    lockedSection: t("field.ws.lockedSection", "Not in return scope — locked read-only (M06-043); DB also rejects edits."),
    mandatoryPhoto: t("field.ws.mandatoryPhoto", "📷 Mandatory photo"),
    submitBtn: t("field.ws.submitBtn", "Review & submit — immutable v1"),
    autoViolation: t("field.ws.autoViolation", "{code} → auto-violation {violation}{actionForm}{photo} (config-driven, non-overridable M09-026)"),
    plusActionForm: t("field.ws.plusActionForm", " + blocking action form"),
    plusPhoto: t("field.ws.plusPhoto", " + mandatory photo"),
    evidenceQueued: t("field.ws.evidenceQueued", "Evidence queued for {code} · sha256 {sha}… — linked, custody-stamped (ENG-07)"),
    blockers: t("field.ws.blockers", "Blockers: {items} unanswered (ERR-SUB-001 — state stays in progress)"),
    submitting: t("field.ws.submitting", "Submitting immutable v{v} (idempotency-protected)…"),
    queuedOffline: t("field.ws.queuedOffline", "Queued — will submit exactly once on reconnect (never claims submitted while unsynced)"),
    retryNow: t("field.ws.retryNow", "Retry now"),
    exitBtn: t("field.ws.exitBtn", "Save & exit"),
    exitTitle: t("field.ws.exitTitle", "Exit this inspection?"),
    exitSavedSynced: t("field.ws.exitSavedSynced", "All your answers are saved on this device and synced to the server. You can safely continue later from My Tasks."),
    exitSavedLocal: t("field.ws.exitSavedLocal", "All your answers are saved on this device and will sync automatically once you're back online. You can safely continue later from My Tasks."),
    exitConfirm: t("field.ws.exitConfirm", "Exit to My Tasks"),
    exitCancel: t("field.ws.exitCancel", "Stay"),
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
    panelPkg: t("field.ws.panel.pkg", "Package version (locked)"),
    prevSource: t("field.ws.prev.source", "Comparing against the factory's latest approved inspection {ref} · {date} (M04-136/137)"),
    prevLine: t("field.ws.prev.line", "Previous inspection: {value} · {n} evidence"),
    prevNoAnswer: t("field.ws.prev.noAnswer", "not answered"),
    evSyncedAlt: t("field.ws.ev.syncedAlt", "Synced evidence"),
    evArchived: t("field.ws.ev.archived", "Archived — replaced"),
    evReplace: t("field.ws.ev.replace", "Replace"),
    evDelete: t("field.ws.ev.delete", "Delete"),
    evDeletedMsg: t("field.ws.ev.deleted", "Evidence removed from the package — soft-deleted with reason, audit event recorded (M04-164)"),
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
      hint: t("field.ws.sig.hint", "Sign in the box below. The signature image, name and timestamp are stored inside the immutable submission version (DEC-009)."),
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
    <Shell current="/field" title={t("field.ws.title", "Inspection — {factory}").replace("{factory}", (ins.visits as unknown as { factories: { name: string } }).factories.name)}
      context={<span className="ax-version">{(ins.package_versions as unknown as { packages: { code: string }; version_label: string }).packages.code} · {(ins.package_versions as unknown as { version_label: string }).version_label} · {t("field.ws.locked", "locked")}</span>}>
      {/* SCR-IPAD-630 — factory-verification step precedes the checklist (M04-095) */}
      <FactoryVerification
        inspectionId={id}
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
      />
      <Workspace
        inspection={ins as never}
        items={items}
        serverResponses={(resp ?? []) as never}
        serverEvidence={(ev ?? []) as never}
        serverForms={(afRows ?? []) as never}
        serverViolations={(vios ?? []) as never}
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
      />
    </Shell>
  );
}
