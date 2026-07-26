import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Startup, { type StartupStrings } from "./Startup";
import PreExecution, {
  type ActionFormTemplate,
  type ModeRule,
  type PreExecutionStrings,
  type PreparationDay,
  type PreparationDraft,
  type PreparationPackage,
} from "./PreExecution";
import { getWindowCapacity } from "@/lib/execution";
import CreatedToast from "@/components/CreatedToast";
import EmptyState from "@/components/EmptyState";
import PreInspectionPackSheet, { type PackData, type PackStrings } from "@/components/field/PreInspectionPackSheet";
import packageInfo from "../../../../../package.json";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./startup.module.css";
import packStyles from "../field-dashboard.module.css";

// BUG-2 fix — [visitId] sits beside static field/* routes (drafts, notifications,
// settings, …) with no more-specific match; Next.js still routes an unmatched
// literal like "notifications" or "xyz123notarealid" here and it was treated
// as a visitId, producing a misleading "Visit not found (M02-001)" after a
// wasted RLS-scoped DB round trip. This guard is a cheap, honest short-circuit
// on shape alone — it does not enumerate route names and never widens what a
// valid visit lookup can match.
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FieldVisit({ params, searchParams }: { params: Promise<{ visitId: string }>; searchParams: Promise<{ created?: string }> }) {
  const { visitId } = await params;
  const { created } = await searchParams;
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  // SAQEEL field chrome — the global <Shell> is replaced by the shared
  // <FieldHeader> (back arrow + language + theme). This is a focused execution
  // screen. It previously carried no bottom bar on the claim that the design
  // omits one — the design does not: SAQEEL PWA-Field Execution Shell,
  // Inspection Form and Preparation all load pwa-tabbar.js. Only the pre-auth
  // Login screen omits it. The bar now comes from the field layout.
  const tr = (k: string, en: string, ar: string) => (locale === "ar" ? ar : t(k, en));
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const back = (
    <Link href="/field/my-tasks" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );
  if (!UUID_SHAPE.test(visitId)) {
    return (
      <>
        <FieldHeader leading={back} title={t("field.start.notFoundTitle", "Not found")}
          langHref={langHref} langLabel={langLabel} />
        <div className={styles.page}>
          <EmptyState glyph="∅" title={t("field.start.notFound", "Visit not found")}
            body={t("field.start.notFoundDesc", "This visit does not exist or is outside your organizational scope (M02-001).")} />
        </div>
      </>
    );
  }
  // NB: visits.execution_date (20260721090000) is deliberately NOT in this
  // unconditional select — while the migration is unapplied the column is
  // absent and the whole read would 400, rendering "Visit not found". The
  // Pre-Execution panel reads it tolerantly via the preparation row below.
  const { data: v } = await sb.from("visits")
    .select("id, window_start, window_end, execution_mode, visit_type, priority, notes, planning_status, operational_state, package_version_id, planner_lat, planner_lng, immediate_creator_role, visit_location_source, factories(name, name_is_system_generated, factory_code, city, region, cr_number, license_number, official_lat, official_lng, geofence_radius_m, is_temporary, source), package_versions(id, version_label, definition, packages(code, title)), inspections(id, status, started_at)")
    .eq("id", visitId).single();
  const { data: engines } = await sb.from("engine_settings").select("engine, settings").in("engine", ["gis", "otp", "field"]);
  // Phase 3B — governed execution config (visit_modes for the Pre-Execution
  // panel). Separate tolerant read: a pending migration degrades to "modes
  // disabled" instead of breaking the whole page.
  const { data: execEngineRow } = await sb.from("engine_settings").select("settings").eq("engine", "execution").maybeSingle();
  const gis = engines?.find(e => e.engine === "gis")?.settings ?? {};
  const otpConfigured = !!engines?.find(e => e.engine === "otp");
  // M04-057 — governed cancellation reasons (engine_settings.field, 0020 seed).
  // Reason labels are configuration data, localized from the config itself.
  const fieldCfg = (engines?.find(e => e.engine === "field")?.settings ?? {}) as
    { cancellation_reasons?: { key: string; en: string; ar?: string }[]; geo_override_reasons?: { key: string; en: string; ar?: string }[] };
  const reasons = (fieldCfg.cancellation_reasons ?? []).map(r => ({
    key: r.key, label: (locale === "ar" && r.ar) ? r.ar : r.en,
  }));
  const overrideReasons = (fieldCfg.geo_override_reasons ?? []).map(r => ({
    key: r.key, label: (locale === "ar" && r.ar) ? r.ar : r.en,
  }));
  // F3 request flags — separate tolerant read so a pending 0020 (columns not
  // yet applied) degrades to hidden chips instead of breaking the whole page.
  const { data: flagRow } = await sb.from("visits")
    .select("cancellation_requested, return_requested")
    .eq("id", visitId).maybeSingle();
  const flags = {
    cancellationRequested: !!flagRow?.cancellation_requested,
    returnRequested: !!flagRow?.return_requested,
  };
  // Materialize elapsed requests before reading state. The database decision
  // guard independently checks the deadline, so this is usability/audit
  // maintenance rather than an authorization shortcut.
  const { error: expiryError } = await sb.rpc("expire_stale_geo_override_requests");
  if (expiryError) console.error("[field geo override expiry]", expiryError.message);
  // The request is an Operations workflow object. A missing forward migration
  // degrades to no server state; it never fabricates approval in the field UI.
  const { data: overrideRows } = await sb.from("geo_override_requests")
    .select("id, status, expires_at, decision_event_id")
    .eq("visit_id", visitId)
    .order("requested_at", { ascending: false })
    .limit(1);
  const initialOverride = overrideRows?.[0] ?? null;
  // TASK-EXECUTION-MODULE-001 · Phase 4B — journey schema probe (D-015). A
  // tolerant read on the Phase 4A table: while migration 20260721140000 is
  // not applied the probe fails and Startup keeps the EXACT legacy
  // direct-insert flow; once applied, the RPC path becomes available.
  const { error: journeyProbeError } = await sb.from("cancellation_requests").select("id").limit(1);
  const journeySchemaAvailable = !journeyProbeError;
  // Latest cancellation request + location corrections for this visit
  // (requester reads own; ops/planner/leadership read all — RLS is the
  // authority). Only read when the probe succeeded.
  let initialCancellation: { id: string; status: string; reason_key: string; requested_at: string; decision_reason: string | null } | null = null;
  let initialCorrections: { id: string; corrected_lat: number; corrected_lng: number; accuracy_m: number | null; reason: string; source: string; corrected_at: string; capture_context: string }[] = [];
  if (journeySchemaAvailable) {
    const { data: cancelRows } = await sb.from("cancellation_requests")
      .select("id, status, reason_key, requested_at, decision_reason")
      .eq("visit_id", visitId)
      .order("requested_at", { ascending: false })
      .limit(1);
    initialCancellation = ((cancelRows?.[0] ?? null) as { id: string; status: string; reason_key: string; requested_at: string; decision_reason: string | null } | null);
    const { data: correctionRows } = await sb.from("visit_location_corrections")
      .select("id, corrected_lat, corrected_lng, accuracy_m, reason, source, corrected_at, capture_context")
      .eq("visit_id", visitId)
      .order("corrected_at", { ascending: false })
      .limit(5);
    initialCorrections = (correctionRows ?? []) as unknown as typeof initialCorrections;
  }
  if (!v) {
    return (
      <>
        <FieldHeader leading={back} title={t("field.start.notFoundTitle", "Not found")}
          langHref={langHref} langLabel={langLabel} />
        <div className={styles.page}>
          <EmptyState glyph="∅" title={t("field.start.notFound", "Visit not found")}
            body={t("field.start.notFoundDesc", "This visit does not exist or is outside your organizational scope (M02-001).")} />
        </div>
      </>
    );
  }
  // TASK-EXECUTION-MODULE-001 · Phase 3B — Pre-Execution readiness data.
  // Tolerant reads: while the readiness schema (20260721120000) is not applied
  // the preparation read fails and the page serves the legacy startup flow
  // (no panel, no gate) instead of breaking the visit.
  const { data: assignment } = await sb.from("assignments")
    .select("inspector_id").eq("visit_id", visitId).limit(1).maybeSingle();
  const { data: prepRow, error: prepError } = await sb.from("visit_preparations")
    .select("visit_id, preparation_version, execution_date, confirmed_mode, package_version_id, form_config, confirmed_ready_at")
    .eq("visit_id", visitId).maybeSingle();
  const preparationAvailable = !prepError;
  let snapshot: { preparation_version: number; checksum: string; package_version_id?: string; definition?: unknown } | null = null;
  if (preparationAvailable && prepRow?.confirmed_ready_at) {
    const { data: snap } = await sb.from("visit_package_snapshots")
      .select("preparation_version, checksum, package_version_id, definition")
      .eq("visit_id", visitId)
      .order("preparation_version", { ascending: false }).limit(1).maybeSingle();
    snapshot = snap ?? null;
  }
  // Per-day daily-cap availability across the visit window (the SAME shared
  // counting service Planning publish evaluates, D-009).
  const windowStartDate = String(v.window_start).slice(0, 10);
  const windowEndDate = String(v.window_end).slice(0, 10);
  const todayDate = new Date().toISOString().slice(0, 10);
  let capacityByDate: Map<string, number> | null = null;
  let capacityNote: "ok" | "unavailable" | "truncated" = "unavailable";
  if (preparationAvailable && assignment?.inspector_id) {
    const cap = await getWindowCapacity(sb, assignment.inspector_id as string, windowStartDate, windowEndDate);
    if (cap.capacity) {
      capacityByDate = new Map(cap.capacity.days.map(d => [d.date, d.remaining]));
      capacityNote = cap.capacity.truncated ? "truncated" : "ok";
    }
  }
  const preparationDays: PreparationDay[] = [];
  {
    const start = Date.parse(`${windowStartDate}T00:00:00Z`);
    const end = Date.parse(`${windowEndDate}T00:00:00Z`);
    // Bounded to 62 days, mirroring the RPC scan cap (truncated flag above).
    for (let ms = start, i = 0; ms <= end && i < 62; ms += 86_400_000, i++) {
      const iso = new Date(ms).toISOString().slice(0, 10);
      preparationDays.push({ date: iso, label: iso, remaining: capacityByDate?.get(iso) ?? null, past: iso < todayDate });
    }
  }
  // Package summaries with D-007 optionality metadata extracted server-side:
  // a section is removable ONLY when the definition explicitly marks it
  // optional/removable and not mandatory; when no optionality metadata exists
  // at all the panel shows honest copy and no removal affordance.
  type DefSection = { key?: string; title_en?: string; title_ar?: string; title?: string; optional?: boolean; removable?: boolean; mandatory?: boolean };
  const summarizePackage = (row: { id: string; version_label: string; definition: unknown; packages: { code: string; title?: string | null } | null }): PreparationPackage => {
    const def = (row.definition ?? {}) as { sections?: DefSection[]; action_forms?: { template_id?: string; id?: string }[] };
    const raw = Array.isArray(def.sections) ? def.sections : [];
    const hasOptionalityMetadata = raw.some(sec => typeof sec?.optional === "boolean" || typeof sec?.removable === "boolean" || typeof sec?.mandatory === "boolean");
    return {
      id: row.id,
      code: row.packages?.code ?? "",
      title: row.packages?.title ?? row.packages?.code ?? "",
      versionLabel: row.version_label,
      sections: raw.map((sec, i) => ({
        key: String(sec?.key ?? `section_${i}`),
        title: (locale === "ar" && sec?.title_ar) ? sec.title_ar : (sec?.title_en ?? sec?.title ?? String(sec?.key ?? `Section ${i + 1}`)),
        removable: (sec?.optional === true || sec?.removable === true) && sec?.mandatory !== true,
      })),
      hasOptionalityMetadata,
      actionFormTemplateIds: (Array.isArray(def.action_forms) ? def.action_forms : [])
        .map(af => String(af?.template_id ?? af?.id ?? "")).filter(Boolean),
      hasSections: raw.length > 0,
    };
  };
  const plannedPackageRow = v.package_versions as unknown as { id: string; version_label: string; definition: unknown; packages: { code: string; title?: string | null } | null } | null;
  const plannedPackage = plannedPackageRow ? summarizePackage(plannedPackageRow) : null;
  // Eligible published package versions — loaded only when Planning left the
  // package unresolved (zero-or-more resolution, plan §7).
  let packageOptionRows: { id: string; version_label: string; definition: unknown; packages: { code: string; title?: string | null } | null }[] = [];
  if (!plannedPackageRow) {
    const { data: pkgRows } = await sb.from("package_versions")
      .select("id, version_label, definition, packages(code, title)")
      .eq("status", "published").order("published_at", { ascending: false }).limit(50);
    packageOptionRows = (pkgRows ?? []) as unknown as typeof packageOptionRows;
  }
  const packageOptions = packageOptionRows.map(summarizePackage);
  // Published Action Form configuration templates the inspector may add.
  const { data: actionFormRows } = await sb.from("configuration_templates")
    .select("id, title_en, title_ar, version_label")
    .eq("template_type", "action_form").eq("status", "published").limit(100);
  const actionFormTemplates: ActionFormTemplate[] = (actionFormRows ?? []).map(r => ({
    id: r.id as string,
    title: (locale === "ar" && (r.title_ar as string)) ? (r.title_ar as string) : (r.title_en as string),
    versionLabel: r.version_label as string,
  }));
  const factory = v.factories as unknown as { name: string; name_is_system_generated: boolean; official_lat: number | null; official_lng: number | null; is_temporary: boolean; source: string | null };
  const factoryName = factory.name_is_system_generated ? t("field.start.unregisteredFactory", "Unregistered factory") : factory.name;
  // TASK-EXECUTION-MODULE-001 · Phase 7 (§24, D-024) — unregistered immediate
  // identity is shown with the EXISTING temporary/unverified marker (same
  // condition and copy as the visit detail page, PLN-REQ-028): a manual-entry
  // factory is never presented as master data, here or in Pre-Execution.
  const factoryUnverifiedManual = factory.is_temporary === true && factory.source === "immediate_manual";
  const unverifiedManualLabel = locale === "ar"
    ? "إدخال يدوي غير موثّق — بانتظار المطابقة"
    : t("visit.detail.unverifiedManual", "Unverified manual entry — pending reconciliation");
  // F360IPAD-ENTRY-001 — assigned visit opens the iPad Factory 360 with the
  // visit's license selected, carrying a return context to this startup.
  const facIds = v.factories as unknown as { cr_number: string | null; license_number: string | null };
  const factory360Href = facIds.license_number
    ? `/field/factory-360?license_no=${encodeURIComponent(facIds.license_number)}&return=${encodeURIComponent(`/field/${v.id}`)}`
    : facIds.cr_number
      ? `/field/factory-360?cr_no=${encodeURIComponent(facIds.cr_number)}&return=${encodeURIComponent(`/field/${v.id}`)}`
      : null;
  const dispatchLat = v.planner_lat ?? factory.official_lat;
  const dispatchLng = v.planner_lng ?? factory.official_lng;
  const dispatchSource = v.visit_location_source === "official" ? "official" : "planned";
  // visits -> inspections is TO-ONE (object | null) — normalize defensively so
  // the client never regresses on the array/object shape.
  const rawInspections = v.inspections as unknown;
  // Phase 3B — Startup caches the package for offline use. When Planning left
  // the package unresolved and the inspector resolved it during preparation,
  // hand Startup that same version; once Ready, the frozen snapshot definition
  // (form_config applied) is what gets cached — the Ready contract is the
  // package the inspection runs against.
  const effectivePackageId = plannedPackageRow
    ? null
    : ((prepRow?.package_version_id as string | null) ?? (snapshot?.package_version_id as string | null) ?? null);
  const effectivePackageBase = plannedPackageRow
    ?? (effectivePackageId ? packageOptionRows.find(r => r.id === effectivePackageId) ?? null : null);
  const effectivePackageRow = effectivePackageBase
    ? (snapshot?.definition ? { ...effectivePackageBase, definition: snapshot.definition } : effectivePackageBase)
    : null;
  const vNorm = {
    ...v,
    dispatch_lat: dispatchLat,
    dispatch_lng: dispatchLng,
    dispatch_source: dispatchSource,
    factories: { ...(v.factories as object), name: factoryName },
    package_versions: effectivePackageRow,
    inspections: Array.isArray(rawInspections) ? (rawInspections[0] ?? null) : rawInspections ?? null,
  };
  // M03-011 — execution-mode eligibility evaluated from engine configuration + master data,
  // never invented: physical requires GIS-verifiable official coordinates (M04-004);
  // virtual requires the OTP engine to be configured for identity verification (0009).
  const physicalEligible = dispatchLat != null && dispatchLng != null;
  const virtualEligible = otpConfigured;
  // Phase 3B — governed visit-mode rules for the Pre-Execution panel:
  // engine_settings.execution.visit_modes decides availability AND the legacy
  // inputs must hold (coordinates for physical, OTP engine for virtual).
  // self_assessment is release-gated off and never offered.
  const execCfg = (execEngineRow?.settings ?? {}) as { visit_modes?: Record<string, { enabled?: boolean }> };
  const visitModes = execCfg.visit_modes ?? {};
  const modeRules: { physical: ModeRule; virtual: ModeRule } = {
    physical: {
      enabled: visitModes.physical?.enabled === true && physicalEligible,
      reason: visitModes.physical?.enabled !== true
        ? t("field.prep.modeOffConfig", "Turned off by configuration")
        : !physicalEligible ? t("field.prep.modeNeedsCoords", "Physical needs a planner or official factory location") : null,
    },
    virtual: {
      enabled: visitModes.virtual?.enabled === true && virtualEligible,
      reason: visitModes.virtual?.enabled !== true
        ? t("field.prep.modeOffConfig", "Turned off by configuration")
        : !virtualEligible ? t("field.prep.modeNeedsOtp", "Virtual needs the OTP identity-verification engine") : null,
    },
  };
  const prepFormConfig = (prepRow?.form_config ?? {}) as { removed_optional_section_keys?: unknown; added_action_form_template_ids?: unknown; notify_factory?: unknown };
  const preparationDraft: PreparationDraft | null = prepRow ? {
    executionDate: (prepRow.execution_date as string | null) ?? null,
    confirmedMode: prepRow.confirmed_mode === "virtual" ? "virtual" : prepRow.confirmed_mode === "physical" ? "physical" : null,
    packageVersionId: (prepRow.package_version_id as string | null) ?? null,
    removedSectionKeys: Array.isArray(prepFormConfig.removed_optional_section_keys) ? prepFormConfig.removed_optional_section_keys.map(String) : [],
    addedTemplateIds: Array.isArray(prepFormConfig.added_action_form_template_ids) ? prepFormConfig.added_action_form_template_ids.map(String) : [],
    notifyFactory: prepFormConfig.notify_factory === true,
  } : null;
  // The readiness gate applies only while the visit is pre-journey. The
  // inspections row may exist from Ready (started_at NULL, D-008) — actual
  // start is marked by started_at. Post-journey states keep the legacy flow.
  const normalizedInspection = vNorm.inspections as { id: string; status: string; started_at: string | null } | null;
  const inspectionStarted = !!normalizedInspection && normalizedInspection.status !== "not_started" && normalizedInspection.started_at != null;
  const opState = String(v.operational_state ?? "new");
  const visitReady = preparationAvailable && !!prepRow?.confirmed_ready_at && opState === "prepared";
  const showPreparation = preparationAvailable && !inspectionStarted && (opState === "new" || opState === "prepared");
  const preparationGated = showPreparation && !visitReady;
  const strings: StartupStrings = {
    mapLoading: t("field.start.mapLoading", "Loading geofence map"),
    readiness: t("field.start.readiness", "Readiness (SCR-IPAD-610)"),
    window: t("field.start.window", "Window"),
    packageLine: t("field.start.package", "Package"),
    packageCached: t("field.start.packageCached", "— cached, version-locked"),
    journeySession: t("field.start.journeySession", "Journey session"),
    geofenceCheck: t("field.start.geofenceCheck", "Geofence check-in (≤{acc}m accuracy, {fence}m fence — live config)"),
    geofenceHeading: t("field.start.geofenceHeading", "Geofence — {name}"),
    insideFence: t("field.start.insideFence", "inside fence · {d} m"),
    outsideFence: t("field.start.outsideFence", "outside fence · {d} m"),
    fenceCaption: t("field.start.fenceCaption", "Fence {fence} m {source} · accuracy gate ≤{acc} m (ERR-GEO-001)"),
    factoryOverride: t("field.start.factoryOverride", "(factory override — SB20)"),
    engineDefault: t("field.start.engineDefault", "(engine default — ENG-06)"),
    positionHint: t("field.start.positionHint", "· your position appears after step 3 check-in"),
    step1: t("field.start.step1", "1 · Download package"),
    step2: t("field.start.step2", "2 · Start journey"),
    step3: t("field.start.step3", "3 · Geofence check-in"),
    step4: t("field.start.step4", "4 · Start inspection"),
    resume: t("field.start.resume", "Resume inspection →"),
    officialLabel: t("field.start.officialLabel", "{name} — official location (FND-007)"),
    plannedLabel: t("field.start.plannedLabel", "{name} — visit location confirmed at planning (M01-046; not official master data)"),
    youLabel: t("field.start.youLabel", "You — ±{acc}m · {state} fence ({d}m)"),
    insideWord: t("enum.inside", "inside"),
    outsideWord: t("enum.outside", "outside"),
    logCached: t("field.start.logCached", "Package {version} cached & version-locked (M04-005/007)"),
    logJourneyBlocked: locale === "ar"
      ? "تعذر بدء الرحلة. تحقق من التكليف والاتصال ثم أعد المحاولة."
      : t("field.start.logJourneyBlockedSafe", "The journey could not be started. Check the assignment and connection, then try again."),
    logJourneyStarted: t("field.start.logJourneyStarted", "Journey started — telemetry active (STM-JRN-001)"),
    logAccuracyBlocked: t("field.start.logAccuracyBlocked", "BLOCKED: accuracy ±{acc}m > {max}m required (ERR-GEO-001) — retry or governed override"),
    logCheckinRejected: locale === "ar"
      ? "تعذر حفظ تسجيل الوصول. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logCheckinRejectedSafe", "Check-in could not be saved. Check the connection, then try again."),
    logArrivalRejected: locale === "ar"
      ? "تعذر حفظ الوصول. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logArrivalRejectedSafe", "Arrival could not be saved. Check the connection, then try again."),
    logOutside: t("field.start.logOutside", "OUTSIDE geofence ({d}m > {fence}m) — check-in recorded as outside; governed override required (ERR-GEO-002)"),
    logInside: t("field.start.logInside", "Checked in INSIDE fence ({d}m, ±{acc}m) — start allowed (STM-JRN-003)"),
    logStartBlocked: t("field.start.logStartBlocked", "Start blocked: {error}"),
    logInspectionCreateFailed: locale === "ar"
      ? "تعذر بدء التفتيش. تحقق من الجاهزية ثم أعد المحاولة."
      : t("field.start.logInspectionCreateFailed", "The inspection could not be started. Check readiness and try again."),
    // E3 — telemetry / arrival auto-detect / deviation / exception / pre-start / STM-OPS
    telemetryRow: t("field.start.telemetryRow", "Telemetry every {s}s while journeying — {n} points (ENG-06 · M04-021)"),
    liveDistance: t("field.start.liveDistance", "live · {d} m out · arrival radius {radius} m"),
    arrivalDetected: t("field.start.arrivalDetected", "arrival auto-detected (M04-037)"),
    liveLabel: t("field.start.liveLabel", "Live position ±{acc}m"),
    prestartHeading: t("field.start.prestartHeading", "Pre-start confirmations (M03-010)"),
    prestartRep: t("field.start.prestartRep", "Factory representative is present"),
    prestartLoc: t("field.start.prestartLoc", "Location confirmed — this is the correct factory"),
    logPrestartBlocked: t("field.start.logPrestartBlocked", "Start blocked: confirm representative present and location first (M03-010)"),
    logPrestartSaved: t("field.start.logPrestartSaved", "Pre-start confirmations persisted to journey session (M03-010)"),
    exceptionHeading: t("field.start.exceptionHeading", "Report exception (ENG-06 · FLD-GEO-005)"),
    exceptionPlaceholder: t("field.start.exceptionPlaceholder", "Describe the exception — mandatory"),
    exceptionSend: t("field.start.exceptionSend", "Record exception"),
    logExceptionSent: t("field.start.logExceptionSent", "Exception recorded at ±{acc}m — immutable geo event (FLD-GEO-005)"),
    logExceptionFailed: locale === "ar"
      ? "تعذر حفظ الاستثناء. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logExceptionFailedSafe", "The exception could not be saved. Check the connection, then try again."),
    logDeviation: t("field.start.logDeviation", "Route deviation recorded — {d} m beyond closest approach, sustained {s}s (ENG-06 route_deviation)"),
    logOpState: t("field.start.logOpState", "Operational state → {state} (STM-OPS)"),
    logOpBlocked: locale === "ar"
      ? "تعذر تحديث حالة الزيارة. تحقق من الجاهزية والاتصال ثم أعد المحاولة."
      : t("field.start.logOpBlockedSafe", "The visit state could not be updated. Check readiness and the connection, then try again."),
    logGpsFallback: t("field.start.logGpsFallback", "GPS unavailable — check-in remains blocked. Restore location access and retry (M04-049)."),
    // F3 — navigation launch (M04-016)
    mapsGeo: t("field.start.mapsGeo", "Open in device navigation"),
    mapsCaption: dispatchSource === "official"
      ? t("field.start.mapsCaption", "Launches the device navigation app with the official factory coordinates (M04-016 · FND-007)")
      : t("field.start.mapsCaptionImmediate", "Launches navigation with the location confirmed on this Immediate Visit; official factory master coordinates remain unchanged (M01-046 · FND-007)"),
    // F3 — journey progress % (M04-026)
    progressLabel: t("field.start.progressLabel", "Journey progress (M04-026)"),
    progressCaption: t("field.start.progressCaption", "{remaining} m remaining of {initial} m from first GPS fix — straight-line basis"),
    // F3 — expandable Factory / Visit confirmation cards (M04-054)
    cardsFactoryTitle: t("field.start.cardsFactoryTitle", "Factory card"),
    cardsVisitTitle: t("field.start.cardsVisitTitle", "Visit card"),
    lblCode: t("field.start.lblCode", "Factory code"),
    lblCity: t("field.start.lblCity", "City"),
    lblRegion: t("field.start.lblRegion", "Region"),
    lblCr: t("field.start.lblCr", "CR number"),
    lblLicense: t("field.start.lblLicense", "License number"),
    lblCoords: t("field.start.lblCoords", "Official coordinates"),
    lblFence: t("field.start.lblFence", "Geofence radius"),
    lblType: t("field.start.lblType", "Visit type"),
    lblMode: t("field.start.lblMode", "Execution mode"),
    lblWindow: t("field.start.lblWindow", "Visit window"),
    lblPackage: t("field.start.lblPackage", "Inspection package"),
    lblPriority: t("field.start.lblPriority", "Priority"),
    lblPlanningStatus: t("field.start.lblPlanningStatus", "Planning status"),
    lblPlannerNotes: t("field.start.lblPlannerNotes", "Notes"),
    // F3 — field cancellation request (M04-056/057/058)
    cancelHeading: t("field.start.cancelHeading", "Cancel visit (M04-056)"),
    cancelCaption: t("field.start.cancelCaption", "Cancellation is a request: planner/ops decide the actual cancel (RBAC — visits stay planner-owned). Reason list is governed configuration (M04-057)."),
    cancelSelectReason: t("field.start.cancelSelectReason", "Select cancellation reason — mandatory"),
    cancelCommentPlaceholder: t("field.start.cancelCommentPlaceholder", "Comments (mandatory for reason “Other”)"),
    cancelEvidenceLabel: t("field.start.cancelEvidenceLabel", "Photo evidence (optional, M04-058)"),
    cancelSubmit: t("field.start.cancelSubmit", "Request cancellation"),
    cancelRequestedChip: t("field.start.cancelRequestedChip", "cancellation requested — awaiting planner/ops"),
    cancelReasonsMissing: t("field.start.cancelReasonsMissing", "Cancellation reasons unavailable — engine_settings.field not seeded yet (0020 pending)."),
    logCancelEvidenceQueued: t("field.start.logCancelEvidenceQueued", "Cancellation evidence {name} queued (sha256 {sha}…) — syncs to the visit record (M04-058)"),
    logCancelSent: t("field.start.logCancelSent", "Cancellation requested — planner/ops notified; execution stopped (M04-056)"),
    logCancelFailed: locale === "ar"
      ? "تعذر إرسال طلب الإلغاء. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logCancelFailedSafe", "The cancellation request could not be sent. Check the connection, then try again."),
    // F3 — inspector return (M03-006)
    returnHeading: t("field.start.returnHeading", "Return visit (M03-006)"),
    returnCaption: t("field.start.returnCaption", "Blocked from proceeding (outside fence, no access, GPS)? Return the visit with a reason — the assignment moves to returned and the planner is notified."),
    returnPlaceholder: t("field.start.returnPlaceholder", "Return reason — mandatory"),
    returnSubmit: t("field.start.returnSubmit", "Return visit"),
    returnRequestedChip: t("field.start.returnRequestedChip", "return requested — planner notified"),
    logReturnSent: t("field.start.logReturnSent", "Visit returned — assignment set to returned, planner notified (M03-006)"),
    logReturnFailed: locale === "ar"
      ? "تعذر إرسال طلب الإرجاع. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logReturnFailedSafe", "The return request could not be sent. Check the connection, then try again."),
    // M03-005 — propose-window reschedule REQUEST (planners decide)
    rescheduleHeading: locale === "ar" ? "طلب إعادة جدولة (M03-005)" : t("field.start.rescheduleHeading", "Request reschedule (M03-005)"),
    rescheduleCaption: locale === "ar"
      ? "اقترح نافذة زيارة جديدة. هذا طلب فقط — يقرّره المخطّطون؛ لا تتغيّر زيارتك حتى الموافقة."
      : t("field.start.rescheduleCaption", "Propose a new visit window. This is a request only — planners decide; your visit is unchanged until they approve."),
    rescheduleStartLabel: locale === "ar" ? "البداية المقترحة" : t("field.start.rescheduleStartLabel", "Proposed start"),
    rescheduleEndLabel: locale === "ar" ? "النهاية المقترحة" : t("field.start.rescheduleEndLabel", "Proposed end"),
    rescheduleSubmit: locale === "ar" ? "إرسال الطلب" : t("field.start.rescheduleSubmit", "Send request"),
    rescheduleRequestedChip: locale === "ar" ? "تم إرسال الطلب إلى المخطّطين" : t("field.start.rescheduleRequestedChip", "Request sent to planners"),
    rescheduleInvalid: locale === "ar" ? "يجب أن تكون البداية المقترحة قبل النهاية." : t("field.start.rescheduleInvalid", "Proposed start must be before the proposed end."),
    logRescheduleSent: locale === "ar"
      ? "تم إرسال طلب إعادة الجدولة — أُشعِر المخطّطون؛ يقرّرون النافذة (M03-005)."
      : t("field.start.logRescheduleSent", "Reschedule request sent — planners notified; they decide the window (M03-005)."),
    logRescheduleFailed: locale === "ar"
      ? "تعذر إرسال طلب إعادة الجدولة. زيارتك دون تغيير — أعد المحاولة."
      : t("field.start.logRescheduleFailedSafe", "The reschedule request could not be sent. Your visit is unchanged — try again."),
    deviceInfo: t("field.start.deviceInfo", "Device information (M04-012)"),
    etaLabel: t("field.start.etaLabel", "Road-network ETA (M04-017/024)"),
    etaAvailable: t("field.start.etaAvailable", "{minutes} min · {distance} m · updated {at}"),
    etaUnavailable: t("field.start.etaUnavailable", "routing provider unavailable — navigation remains available"),
    etaStale: t("field.start.etaStale", "Offline — showing the last known route estimate as stale; it is not refreshed."),
    overrideHeading: t("field.start.overrideHeading", "Outside the planned location"),
    overrideBody: t("field.start.overrideBody", "You are {d} m from the planned point (fence {fence} m). Request Operations approval using the captured actual coordinates {lat}, {lng}. Check-in remains blocked until approval."),
    overrideReason: t("field.start.overrideReason", "Explanation — mandatory"),
    overrideReasonCode: t("field.start.overrideReasonCode", "Governed reason code — mandatory"),
    overrideEvidence: t("field.start.overrideEvidence", "Photo evidence — mandatory unless safety/security makes capture unsafe"),
    overrideSafetyException: t("field.start.overrideSafetyException", "Photo cannot be captured safely because of the selected safety/security condition"),
    overrideConfirm: t("field.start.overrideConfirm", "Request Operations override"),
    overrideCancel: t("common.cancel", "Cancel"),
    overridePending: t("field.start.overridePending", "Operations override pending — check-in remains blocked until an Operations Supervisor or Manager approves online."),
    overrideQueued: t("field.start.overrideQueued", "Override request safely queued — it will be sent with its captured GPS/evidence when online. Check-in remains blocked."),
    overrideApproved: t("field.start.overrideApproved", "Operations override approved — actual coordinates and decision are immutably recorded."),
    overrideClosed: t("field.start.overrideClosed", "This arrival attempt has already been rejected or expired. Check-in remains blocked; return the visit or contact Operations."),
    logOverrideQueued: t("field.start.logOverrideQueued", "Operations override requested with captured GPS/time and evidence — check-in remains blocked pending approval."),
    logOverrideOfflineQueued: t("field.start.logOverrideOfflineQueued", "Override request queued offline with captured GPS/evidence — it cannot self-approve or unlock check-in."),
    logOverrideEvidenceRequired: t("field.start.logOverrideEvidenceRequired", "A photo is mandatory unless the selected safety/security condition makes capture unsafe."),
    logOverrideFailed: t("field.start.logOverrideFailed", "The override could not be saved. Nothing was changed."),
    arrivalEvidenceHeading: t("field.start.arrivalEvidenceHeading", "Arrival evidence (M04-045)"),
    arrivalEvidenceCaption: t("field.start.arrivalEvidenceCaption", "Add a photo or comment. Evidence is linked to this exact arrival event and remains queued safely while offline."),
    arrivalPhoto: t("field.start.arrivalPhoto", "Arrival photo"),
    arrivalComment: t("field.start.arrivalComment", "Arrival comment"),
    arrivalSave: t("field.start.arrivalSave", "Save arrival evidence"),
    arrivalSaved: t("field.start.arrivalSaved", "Arrival evidence saved or queued for sync"),
    arrivalRequired: t("field.start.arrivalRequired", "arrival evidence is required by the active GIS configuration"),
    arrivalEvidenceNote: t("field.start.arrivalEvidenceNote", "Arrival note"),
    arrivalEvidenceFile: t("field.start.arrivalEvidenceFile", "Arrival photo (optional)"),
    arrivalEvidenceSubmit: t("field.start.arrivalEvidenceSubmit", "Queue arrival evidence"),
    arrivalEvidenceQueued: t("field.start.arrivalEvidenceQueued", "Arrival evidence queued — custody hash recorded; sync pending"),
    arrivalEvidenceMissing: t("field.start.arrivalEvidenceMissing", "Add a photo or note before queueing arrival evidence."),
    aiTitle: t("field.start.aiTitle", "AI preparation assistant"),
    aiDescription: t("field.start.aiDescription", "Daily, risk and preparation guidance from this visit's recorded facts. It never gates the journey or inspection start."),
    aiGenerate: t("field.start.aiGenerate", "Generate preparation brief"),
    aiUnavailable: t("field.start.aiUnavailable", "AI provider unavailable or offline — nothing was generated or changed."),
    aiEvidence: t("field.start.aiEvidence", "Source evidence"),
    aiAdvisory: t("field.start.aiAdvisory", "Advisory only · human decides"),
    // Phase 3B — readiness gate + unresolved-package placeholder
    preparationRequired: t("field.start.preparationRequired", "Complete preparation and confirm ready first — package download and journey start unlock after that."),
    packagePending: t("field.start.packagePending", "selected during preparation"),
    // Phase 4B — journey RPC path (active only when the schema probe succeeds)
    journeyOverdueWarning: t("field.start.journeyOverdueWarning", "This journey starts after the planned execution date, still inside the visit window. The delay is recorded."),
    correctionHeading: t("field.start.correctionHeading", "Corrected visit location"),
    correctionCaption: t("field.start.correctionCaption", "Report the correct on-site location for THIS visit only. The registered factory location and the planned location are never changed — both stay visible below with the correction (append-only record)."),
    correctionAffordance: t("field.start.correctionAffordance", "Report corrected location"),
    correctionReason: t("field.start.correctionReason", "Why is the location wrong? — mandatory"),
    correctionReasonPlaceholder: t("field.start.correctionReasonPlaceholder", "Describe what you found on site…"),
    correctionEvidence: t("field.start.correctionEvidence", "Photo evidence (optional)"),
    correctionSubmit: t("field.start.correctionSubmit", "Save corrected location"),
    correctionCancel: t("common.cancel", "Cancel"),
    correctionSaved: t("field.start.correctionSaved", "Corrected location recorded — arrival is now checked against it. The original location stays visible."),
    correctionFailed: locale === "ar"
      ? "تعذر حفظ الموقع المصحح. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.correctionFailedSafe", "The corrected location could not be saved. Check the connection, then try again."),
    correctionOriginalLabel: t("field.start.correctionOriginalLabel", "Planned / registered location"),
    correctionCorrectedLabel: t("field.start.correctionCorrectedLabel", "Corrected on-site location"),
    correctionMeta: t("field.start.correctionMeta", "recorded {at} · {context} · source {source}"),
    cancelPendingActive: t("field.start.cancelPendingActive", "Cancellation requested — awaiting Operations decision"),
    cancelApprovedCopy: t("field.start.cancelApprovedCopy", "Cancellation approved by Operations — this visit is cancelled. Everything captured so far is preserved for audit."),
    cancelRejectedCopy: t("field.start.cancelRejectedCopy", "Cancellation was rejected by Operations — the visit continues. Reason: {reason}"),
    logActiveCancelSent: t("field.start.logActiveCancelSent", "Cancellation requested — Operations will decide; the request is idempotent so retries are safe."),
  };
  // Phase 3B — Pre-Execution panel copy (plain language; error codes mapped to
  // governed copy, provider text never reaches the UI).
  const prepStrings: PreExecutionStrings = {
    heading: t("field.prep.heading", "Preparation — get ready for execution"),
    contextHeading: t("field.prep.contextHeading", "Visit and factory"),
    lblFactory: t("field.prep.lblFactory", "Factory"),
    lblVisitType: t("field.prep.lblVisitType", "Visit type"),
    lblWindow: t("field.prep.lblWindow", "Window"),
    lblPriority: t("field.prep.lblPriority", "Priority"),
    dateHeading: t("field.prep.dateHeading", "Execution date"),
    dateCaption: t("field.prep.dateCaption", "Pick a day inside the visit window. Days at your daily visit limit are marked as fully booked."),
    dayLeft: t("field.prep.dayLeft", "{n} left"),
    dayFull: t("field.prep.dayFull", "Fully booked"),
    availabilityUnknown: t("field.prep.availabilityUnknown", "Daily availability could not be loaded — the server re-checks it when you save."),
    truncatedNote: t("field.prep.truncatedNote", "This window is long — availability is shown for the first 62 days."),
    modeHeading: t("field.prep.modeHeading", "Visit mode"),
    plannedChip: t("field.prep.plannedChip", "planned by Planning"),
    physical: t("enum.physical", "physical"),
    virtual: t("enum.virtual", "virtual"),
    modeOffConfig: t("field.prep.modeOffConfig", "Turned off by configuration"),
    packageHeading: t("field.prep.packageHeading", "Inspection package"),
    packageByPlanning: t("field.prep.packageByPlanning", "selected by Planning"),
    packageChoose: t("field.prep.packageChoose", "Planning did not select a package for this visit — choose one of the published packages below."),
    packageNoSections: t("field.prep.packageNoSections", "no inspection sections — not selectable"),
    sectionsCount: t("field.prep.sectionsCount", "{n} sections"),
    formsHeading: t("field.prep.formsHeading", "Forms and Action Forms for this visit"),
    removeLabel: t("field.prep.removeLabel", "Remove for this visit"),
    optionalChip: t("field.prep.optionalChip", "optional"),
    noRemovableCopy: t("field.prep.noRemovableCopy", "This package does not mark any section as removable, so nothing can be removed. Mandatory content stays mandatory."),
    addedFormsLabel: t("field.prep.addedFormsLabel", "Add Action Forms for this visit"),
    noTemplatesCopy: t("field.prep.noTemplatesCopy", "No published Action Form templates are available to add."),
    notifyFactory: t("field.prep.notifyFactory", "Notify the factory about this visit"),
    save: t("field.prep.save", "Save preparation"),
    saved: t("field.prep.saved", "Preparation saved — nothing else changed. Confirm ready when you are done."),
    confirm: t("field.prep.confirm", "Confirm ready for execution"),
    readyTitle: t("field.prep.readyTitle", "Ready for execution"),
    readySnapshot: t("field.prep.readySnapshot", "Package snapshot v{n} · checksum {checksum}"),
    reopen: t("field.prep.reopen", "Change preparation"),
    reopenCaption: t("field.prep.reopenCaption", "Returns the visit to New — you will need to confirm ready again before the journey can start."),
    working: t("field.prep.working", "Working…"),
    genericError: t("field.prep.genericError", "The change could not be saved. Nothing was changed. Try again."),
    errors: {
      READINESS_DENIED: t("field.prep.err.denied", "Only the assigned inspector can prepare this visit."),
      READINESS_VISIT_STATE: t("field.prep.err.visitState", "This visit is not in a state that allows preparation."),
      READINESS_DATE_OUTSIDE_WINDOW: t("field.prep.err.dateWindow", "That date is outside the visit window."),
      READINESS_DATE_IN_PAST: t("field.prep.err.datePast", "That date is in the past."),
      READINESS_DAY_AT_CAPACITY: t("field.prep.err.capacity", "That day is fully booked for you — pick another day."),
      READINESS_MODE_INELIGIBLE: t("field.prep.err.mode", "That visit mode is not available for this visit."),
      READINESS_PACKAGE_REQUIRED: t("field.prep.err.pkgRequired", "Choose a package before confirming ready."),
      READINESS_PACKAGE_INELIGIBLE: t("field.prep.err.pkgIneligible", "That package is not available."),
      READINESS_SECTION_NOT_REMOVABLE: t("field.prep.err.mandatory", "Only sections marked optional in the package can be removed."),
      READINESS_DUPLICATE: t("field.prep.err.duplicate", "Duplicate entries are not allowed."),
      READINESS_CONFIG_INVALID: t("field.prep.err.config", "The form configuration is invalid."),
      READINESS_ACTION_FORM_INELIGIBLE: t("field.prep.err.form", "That Action Form is not available."),
      READINESS_REOPEN_REQUIRED: t("field.prep.err.reopenRequired", "Use Change preparation before editing a ready visit."),
      READINESS_LOCKED_AFTER_JOURNEY_START: t("field.prep.err.locked", "Preparation is locked once the journey has started."),
      READINESS_REOPEN_BLOCKED_BY_WORK: t("field.prep.err.workCaptured", "Change preparation is no longer possible — inspection work already exists."),
      READINESS_INCOMPLETE: t("field.prep.err.incomplete", "Pick the execution date, confirm the mode and resolve the package before confirming ready."),
      READINESS_WINDOW_INVALID: t("field.prep.err.window", "The visit window is invalid."),
    },
  };
  const modeWord = (m: string) => m === "virtual" ? t("enum.virtual", "virtual") : t("enum.physical", "physical");
  // CODEX 03 — Pre-Inspection Pack. Mounted in the preparation surface behind
  // its own "Open pack" trigger. Data is sourced strictly from what this route
  // already loads: visit identity, factory master (CR / licence / official
  // location) and the resolved package. The Factory 360 dossier (risk band,
  // compliance rate, previous-approval and repeat-finding lineage) is NOT
  // loaded on the preparation route, so those sections carry the component's
  // honest "unavailable"/"—" states rather than a fabricated value — exactly
  // the null contract the component declares (STR-KPI-002 / STR-KPI-011).
  // Reuses the file-level `tr` (EN/AR) helper declared with the header strings.
  const packOfficialLocation = factory.official_lat != null && factory.official_lng != null
    ? `${factory.official_lat.toFixed(5)}, ${factory.official_lng.toFixed(5)}`
    : null;
  const packLicenceUnavailable = tr("field.pack.licenceUnavailable", "Not recorded for this factory", "غير مسجّل لهذه المنشأة");
  const packData: PackData = {
    visitId: v.id,
    inspectionId: normalizedInspection?.id ?? null,
    visitRef: v.id.slice(0, 8),
    factoryName,
    packPolicyVersion: null,
    packageLabel: (effectivePackageRow as { version_label?: string | null } | null)?.version_label ?? null,
    packageVersionId: effectivePackageRow?.id ?? null,
    packageDefinition: effectivePackageRow?.definition ?? null,
    packageChecksum: snapshot?.checksum ?? null,
    packageStatus: v.planning_status ?? null,
    crNumber: facIds.cr_number,
    officialLocation: packOfficialLocation,
    licence: { value: facIds.license_number, unavailable: facIds.license_number ? null : packLicenceUnavailable },
    riskBand: null,
    riskScore: null,
    riskDrivers: null,
    health: { value: null, unavailable: tr("field.pack.healthUnavailable", "No governed Health Score source (STR-KPI-002)", "لا يوجد مصدر محكوم لدرجة الصحة (STR-KPI-002)") },
    previousApproved: null,
    returnedContext: null,
    compliance: null,
    repeatFindings: { value: null, unavailable: tr("field.pack.repeatUnavailable", "No governed violation lineage (STR-KPI-011)", "لا يوجد سجل مخالفات محكوم (STR-KPI-011)") },
    freshnessMinutes: null,
  };
  const packStrings: PackStrings = {
    openPack: tr("field.pack.open", "Open pre-inspection pack", "فتح حزمة ما قبل التفتيش"),
    title: tr("field.pack.title", "Pre-inspection pack", "حزمة ما قبل التفتيش"),
    close: t("common.close", "Close"),
    cached: tr("field.pack.cached", "cached for offline", "محفوظة للعمل دون اتصال"),
    freshness: tr("field.pack.freshness", "freshness {n} min", "حداثة {n} دقيقة"),
    reviewBlocker: tr("field.pack.reviewBlocker", "Review — {n} blocker(s)", "مراجعة — {n} عائق"),
    ready: tr("field.pack.ready", "Ready", "جاهزة"),
    sectionFactory: tr("field.pack.sectionFactory", "Factory", "المصنع"),
    sectionPackage: tr("field.pack.sectionPackage", "Package", "الحزمة"),
    sectionPrevious: tr("field.pack.sectionPrevious", "Previous inspection", "التفتيش السابق"),
    sectionRepeat: tr("field.pack.sectionRepeat", "Repeat findings", "المخالفات المتكررة"),
    sectionHealthRisk: tr("field.pack.sectionHealthRisk", "Health & risk", "الصحة والخطورة"),
    sectionDocuments: tr("field.pack.sectionDocuments", "Documents", "الوثائق"),
    crNumber: tr("field.pack.crNumber", "CR number", "رقم السجل التجاري"),
    licence: tr("field.pack.licence", "Licence", "الترخيص"),
    officialLocation: tr("field.pack.officialLocation", "Official location", "الموقع الرسمي"),
    provenance: tr("field.pack.provenance", "Provenance", "المصدر"),
    provenanceValue: tr("field.pack.provenanceValue", "Governed master data", "بيانات مرجعية محكومة"),
    distinctConcepts: tr("field.pack.distinctConcepts", "Health and Risk are distinct governed concepts.", "الصحة والخطورة مفهومان محكومان منفصلان."),
    documentsNote: tr("field.pack.documentsNote", "Licence documents open from the establishment dossier.", "تُفتح وثائق الترخيص من ملف المنشأة."),
    healthScore: tr("field.pack.healthScore", "Health score", "درجة الصحة"),
    riskScore: tr("field.pack.riskScore", "Risk score", "درجة الخطورة"),
    compliance: tr("field.pack.compliance", "{rate}% compliant · {c}/{e} eligible", "{rate}% ملتزم · {c}/{e} مؤهل"),
    noPrevious: tr("field.pack.noPrevious", "No previous approved inspection on record.", "لا يوجد تفتيش سابق معتمد مسجّل."),
    startReadiness: tr("field.pack.startReadiness", "Start readiness", "جاهزية البدء"),
    ackPackageCached: tr("field.pack.ackPackageCached", "Package cached for offline", "الحزمة محفوظة للعمل دون اتصال"),
    ackFactory360: tr("field.pack.ackFactory360", "Factory 360 snapshot reviewed", "تمت مراجعة لقطة المصنع 360"),
    ackRepeatReviewed: tr("field.pack.ackRepeatReviewed", "Repeat findings reviewed", "تمت مراجعة المخالفات المتكررة"),
    required: tr("field.pack.required", "required", "مطلوب"),
    downloadOffline: tr("field.pack.downloadOffline", "Download for offline", "تنزيل للعمل دون اتصال"),
    downloadingOffline: tr("field.pack.downloadingOffline", "Verifying download…", "جارٍ التحقق من التنزيل…"),
    downloadUnavailable: tr("field.pack.downloadUnavailable", "Not downloaded", "لم يتم التنزيل"),
    downloadFailed: tr("field.pack.downloadFailed", "Download failed — try again", "فشل التنزيل — حاول مرة أخرى"),
    retryDownload: tr("field.pack.retryDownload", "Download current package", "تنزيل الحزمة الحالية"),
    integrityVerified: tr("field.pack.integrityVerified", "Offline package verified", "تم التحقق من حزمة العمل دون اتصال"),
    integrityFailed: tr("field.pack.integrityFailed", "Cached package failed integrity check", "فشلت الحزمة المحفوظة في فحص السلامة"),
    packageOutdated: tr("field.pack.packageOutdated", "Cached package is outdated — download the current version", "الحزمة المحفوظة قديمة — نزّل الإصدار الحالي"),
    legacyUnverified: tr("field.pack.legacyUnverified", "Cached package needs verification", "تحتاج الحزمة المحفوظة إلى التحقق"),
    offlineUnavailable: tr("field.pack.offlineUnavailable", "Connect to download", "اتصل بالإنترنت للتنزيل"),
    packageVersion: tr("field.pack.packageVersion", "Version", "الإصدار"),
    packageHash: tr("field.pack.packageHash", "Authority checksum", "بصمة المرجع"),
    checkIn: tr("field.pack.checkIn", "Check in — startup", "تسجيل الوصول — البدء"),
    checkInBlocked: tr("field.pack.checkInBlocked", "Check in — review required", "تسجيل الوصول — مطلوب مراجعة"),
    startupNote: tr("field.pack.startupNote", "Opens the governed startup; check-in gates are enforced there.", "يفتح البدء المحكوم؛ تُطبَّق بوابات تسجيل الوصول هناك."),
  };
  return (
    <>
      <FieldHeader leading={back}
        title={tr("field.start.preparationTitle", "Visit Preparation", "التحضير للزيارة")}
        subtitle={<><bdi>{factoryName}</bdi> · <span className="id-code">{v.id.slice(0, 8)}</span></>}
        right={<span className="badge badge-info">{tr("field.start.preExecution", "Pre-execution", "قبل التنفيذ")}</span>}
        langHref={langHref} langLabel={langLabel} />
      <CreatedToast created={created}
        registeredMessage={t("field.start.createdToast", "Visit created and dispatched.")}
        unregisteredMessage={t("field.start.createdToastUnregistered", "Unregistered establishment recorded and visit dispatched.")} />
      <div className={styles.page}>
        <nav className={styles.lifecycle} aria-label={tr("field.start.lifecycle", "Visit lifecycle", "مراحل الزيارة")}>
          <a className={styles.lifecycleStep} href="#preparation" aria-current={showPreparation ? "step" : undefined}>
            <span className={styles.lifecycleIndex}>1</span>
            <span>{tr("field.start.preparationStage", "Preparation", "التحضير")}</span>
          </a>
          <a className={styles.lifecycleStep} href="#startup" aria-current={!showPreparation ? "step" : undefined}>
            <span className={styles.lifecycleIndex}>2</span>
            <span>{tr("field.start.journeyStage", "Journey & arrival", "الرحلة والوصول")}</span>
          </a>
        </nav>
        <div className={styles.quickActions}>
          {factory360Href && (
            <a className={styles.quickAction} href={factory360Href}>
              <span className={styles.quickActionIcon} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
              </span>
              <span className={styles.quickActionLabel}>{t("field.start.openFactory360", "Open Factory 360")}</span>
              <svg className={styles.quickActionChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m9 18 6-6-6-6" /></svg>
            </a>
          )}
          <Link href={`/field/${v.id}/travel`} prefetch={false} className={styles.quickAction}>
            <span className={styles.quickActionIcon} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            </span>
            <span className={styles.quickActionLabel}>{tr("field.start.openTravel", "Journey to site", "الرحلة إلى الموقع")}</span>
            <svg className={styles.quickActionChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
        {/* M03-011 — execution-mode eligibility from engine rules, with the why */}
        <div className={`panel ${styles.preparationCard}`}>
          <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("field.start.eligibilityHeading", "Execution mode eligibility (M03-011)")}</h4>
          <div className="stack" style={{ gap: 8 }}>
            <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`badge ${physicalEligible ? "badge-compliant" : "badge-critical"}`}>
                {physicalEligible ? t("field.start.eligible", "eligible") : t("field.start.notEligible", "not eligible")}
              </span>
              <span>{dispatchSource === "official"
                ? t("field.start.physicalRule", "Physical — using GIS-verified official coordinates for geofence arrival (M04-004 · ENG-06)")
                : t("field.start.physicalImmediateRule", "Physical Immediate Visit — using the location confirmed with the visit (M01-046); factory master coordinates remain unchanged (FND-007)")}</span>
              {v.execution_mode !== "virtual" && <span className="badge badge-info">{t("field.start.plannedMode", "planned mode")}</span>}
            </div>
            <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`badge ${virtualEligible ? "badge-compliant" : "badge-critical"}`}>
                {virtualEligible ? t("field.start.eligible", "eligible") : t("field.start.notEligible", "not eligible")}
              </span>
              <span>{t("field.start.virtualRule", "Virtual — requires OTP identity-verification engine configured (ENG · REF-011)")}</span>
              {v.execution_mode === "virtual" && <span className="badge badge-info">{t("field.start.plannedMode", "planned mode")}</span>}
            </div>
            <p className="t-caption">
              {t("field.start.eligibilityCaption", "This visit is planned as {mode}. Eligibility is evaluated from engine configuration and factory master data — not selectable here.").replace("{mode}", modeWord(v.execution_mode))}
            </p>
          </div>
        </div>
        {/* Phase 3B — Pre-Execution panel above the startup steps. While the
            readiness contract is incomplete, package download and journey
            start stay locked inside Startup (preparationGated) with the
            reason visible — never hidden. */}
        {showPreparation && (
          <div className={`panel ${styles.preparationCard}`}>
            <h4 style={{ marginBlockEnd: "var(--space-2)" }}>{packStrings.title}</h4>
            <p className="t-caption" style={{ marginBlockEnd: "var(--space-3)" }}>
              {tr("field.pack.hostCaption",
                "Review the governed pre-inspection briefing before you prepare and check in.",
                "راجع ملخّص ما قبل التفتيش المحكوم قبل التحضير وتسجيل الوصول.")}
            </p>
            <PreInspectionPackSheet
              data={packData}
              strings={packStrings}
              moduleClasses={{ packChipRow: packStyles.packChipRow, packReadiness: packStyles.packReadiness, packFooter: packStyles.packFooter, packBlocked: packStyles.packBlocked }}
              userId={user.id}
            />
          </div>
        )}
        {showPreparation && (
          <div id="preparation" className="sq-anchor-target">
          <PreExecution
            visitId={v.id}
            ready={visitReady}
            snapshot={snapshot ? { preparation_version: snapshot.preparation_version, checksum: snapshot.checksum } : null}
            context={{
              factoryName,
              factoryCode: (v.factories as unknown as { factory_code: string | null }).factory_code,
              visitType: v.visit_type,
              priority: v.priority,
              windowLabel: `${windowStartDate} → ${windowEndDate}`,
              unverifiedLabel: factoryUnverifiedManual ? unverifiedManualLabel : null,
            }}
            days={preparationDays}
            capacityNote={capacityNote}
            plannedMode={v.execution_mode === "virtual" ? "virtual" : "physical"}
            modeRules={modeRules}
            plannedPackage={plannedPackage}
            packageOptions={packageOptions}
            actionFormTemplates={actionFormTemplates}
            draft={preparationDraft}
            strings={prepStrings}
          />
          </div>
        )}
        {factoryUnverifiedManual && (
          <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge-warning">{unverifiedManualLabel}</span>
          </div>
        )}
        <div id="startup" className="sq-anchor-target">
          <Startup visit={vNorm as never} gis={gis as never} strings={strings} reasons={reasons} overrideReasons={overrideReasons} initialOverride={initialOverride as never} flags={flags} appVersion={packageInfo.version} locale={locale} userId={user.id} preparationGated={preparationGated}
            journeySchemaAvailable={journeySchemaAvailable}
            initialCancellation={initialCancellation as never}
            initialCorrections={initialCorrections as never} />
        </div>
      </div>
    </>
  );
}
