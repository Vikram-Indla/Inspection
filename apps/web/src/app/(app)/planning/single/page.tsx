import type { SupabaseClient } from "@supabase/supabase-js";
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { getPlanningAccess } from "@/lib/planning/access";
import {
  resolvePlanningTargets,
  resolveHandoffTarget,
  type ResolvedPortfolio,
} from "@/lib/planning/factory-resolver";
import Wizard, { type WizardStrings, type GradedFactory, type DraftConfig, type DraftInfo, type InitialSelection } from "./Wizard";
import { findDuplicateActiveVisits } from "./duplicate";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// CD-022 / PLN-REQ-020..024 — Single Planning against the canonical
// CR → Industrial Licence → Plant registry (factory-resolver.ts), with the
// legacy factories search preserved verbatim as the fallback (marked
// source:'legacy'). EXACT = governed identifier equality only (no scoring).
// SIMILAR NAME = the search term matched the entity's name, not any
// identifier — the differing identifier is always returned so the planner
// sees exactly what distinguishes the candidate. A query that matches
// neither exactly nor by name is not returned: partial/fuzzy identifier
// matching is deliberately not offered — identifiers are precise codes, and
// a coincidental substring match on a CR/license number is not a safe
// candidate to surface silently.
function gradeCandidate(f: { cr_number: string | null; factory_code: string | null; license_number: string | null; name: string }, q: string): "exact" | "similar_name" | null {
  const ql = q.toLowerCase();
  const identifierExact =
    (f.cr_number != null && f.cr_number === q) ||
    (f.factory_code != null && f.factory_code.toLowerCase() === ql) ||
    (f.license_number != null && f.license_number.toLowerCase() === ql);
  if (identifierExact) return "exact";
  if (f.name.toLowerCase().includes(ql)) return "similar_name";
  return null;
}

type LegacyFactoryRow = {
  id: string; factory_code: string | null; name: string; cr_number: string | null; license_number: string | null;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  official_lat: number | null; official_lng: number | null; geofence_radius_m: number | null;
  source_synced_at: string | null;
};

// One legacy factory by id (handoff prefill / draft-target hydration) with the
// same duplicate read the search path runs. Fail-closed: a read error is
// "unavailable", never a fabricated miss.
async function readLegacyFactory(sb: SupabaseClient, id: string): Promise<{ row: GradedFactory | null; unavailable: boolean }> {
  const { data: f, error } = await sb.from("factories")
    .select("id, factory_code, name, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, geofence_radius_m, source_synced_at")
    .eq("id", id).maybeSingle();
  if (error) {
    console.error("[ single-planning prefill factory read]", error.message);
    return { row: null, unavailable: true };
  }
  if (!f) return { row: null, unavailable: false };
  const dups = await findDuplicateActiveVisits(sb, f.id);
  if (dups.unavailable) return { row: null, unavailable: true };
  const row = f as LegacyFactoryRow;
  return {
    unavailable: false,
    row: {
      id: row.id, factory_code: row.factory_code, name: row.name, cr_number: row.cr_number, license_number: row.license_number,
      region: row.region, city: row.city, risk_band: row.risk_band, risk_score: row.risk_score,
      official_lat: row.official_lat, official_lng: row.official_lng, geofence_radius_m: row.geofence_radius_m,
      source_synced_at: row.source_synced_at,
      source: "legacy",
      grade: "exact",
      degraded: !row.license_number || row.official_lat == null || row.official_lng == null,
      duplicate: dups.visits.length > 0,
      duplicateVisitId: dups.visits[0]?.id ?? null,
      duplicateVisitStatus: dups.visits[0]?.planning_status ?? null,
    },
  };
}

type Sp = { q?: string; plan?: string; cr?: string; license?: string; plant?: string; factory?: string; source?: string };

export default async function SinglePlanning({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const searching = q.length >= 3;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();

  const unavailable = (
    <Shell current="/planning" title={t("plan.single.title", "Plan one visit")}>
      <div className="sq-banner sq-banner--critical" role="alert">
        {tr("plan.single.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Try again.", "بيانات التخطيط غير متاحة مؤقتًا (ERR-OPS-001). حاول مرة أخرى.")}
      </div>
    </Shell>
  );

  // PLN-REQ-007/008 — capability boundary, replacing the hand-rolled
  // planner-role check. planning_access_class() classifies the session;
  // has_planning_capability('planning.create.single') resolves explicit
  // grants plus the business-staff class default. Business planning staff
  // pass; inspector and admin classes are denied; any resolution failure
  // fails closed to the same denial (never a permissive fallback).
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError) {
    console.error("[ single-planning authorization]", userError.message);
    return unavailable;
  }
  const access = await getPlanningAccess(sb, ["planning.create.single", "planning.publish"]);
  if (access.error) {
    console.error("[ single-planning access resolution]", access.error);
    return unavailable;
  }
  if (!access.can("planning.create.single")) {
    return (
      <Shell current="/planning" title={t("plan.single.title", "Plan one visit")}>
        <EmptyState glyph="⛔" title={tr("plan.single.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("plan.single.unauthorized.body", "Plan one visit is available to authorized planning staff.", "تخطيط زيارة واحدة متاح لموظفي التخطيط المصرح لهم.")} />
      </Shell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [packageRead, inspectorRead, otpRead] = await Promise.all([
    sb.from("package_versions").select("id, version_label, packages(code, title)").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`).order("published_at", { ascending: false }),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
    sb.from("engine_settings").select("engine").eq("engine", "otp").maybeSingle(),
  ]);
  if (packageRead.error || inspectorRead.error || otpRead.error) {
    console.error("[ single-planning configuration]", packageRead.error?.message ?? inspectorRead.error?.message ?? otpRead.error?.message);
    return unavailable;
  }
  const pkgs = packageRead.data;
  const inspRoles = inspectorRead.data;
  const otpEngine = otpRead.data;
  const inspectors = (inspRoles ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const virtualEligible = !!otpEngine;

  let portfolios: ResolvedPortfolio[] = [];
  let graded: GradedFactory[] = [];
  let registryUnavailable = false;
  let initialSelection: InitialSelection = {};
  let handoff = false;
  let prefillMiss = false;
  let draft: DraftInfo | null = null;
  let draftConfig: DraftConfig = {};
  let sourceChannel = (sp.source ?? "").trim() || "planning.single";

  // ---------------------------------------------------------------------
  // Draft resume (PLN-REQ-020/022) — /planning/single?plan=<id> hydrates the
  // wizard from an own, active single-method draft (status draft/validated,
  // archived_at null). The payload carries target + config; nothing is
  // fabricated when the target no longer resolves (prefillMiss banner).
  const planParam = (sp.plan ?? "").trim();
  if (UUID.test(planParam) && user) {
    const { data: planRow, error: planError } = await sb.from("visit_plans")
      .select("id, plan_reference, status, draft_version, draft_payload, source_channel")
      .eq("id", planParam).eq("created_by", user.id).eq("method", "single")
      .in("status", ["draft", "validated"]).is("archived_at", null)
      .maybeSingle();
    if (planError) {
      console.error("[ single-planning draft read]", planError.message);
      return unavailable;
    }
    if (!planRow) {
      prefillMiss = true;
    } else {
      draft = { id: planRow.id, planReference: planRow.plan_reference, version: planRow.draft_version ?? 0 };
      if (planRow.source_channel) sourceChannel = planRow.source_channel;
      const payload = (planRow.draft_payload ?? {}) as {
        target?: { factory_id?: string; cr_number?: string | null; license_number?: string | null; canonical_license_number?: string | null; plant_number?: string | null; source?: string };
        config?: Record<string, string | string[] | null>;
      };
      const cfg = payload.config ?? {};
      const target = payload.target;
      const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : undefined);
      // M7 — zero-many packages hydrate from the array; the legacy singular
      // field (older drafts) still hydrates as a one-element selection.
      const cfgPkgIds = Array.isArray(cfg.package_version_ids)
        ? (cfg.package_version_ids as unknown[]).map(String).filter(id => UUID.test(id))
        : undefined;
      draftConfig = {
        visitType: str(cfg.visit_type),
        packageVersionIds: cfgPkgIds ?? (str(cfg.package_version_id) ? [str(cfg.package_version_id)!] : undefined),
        executionMode: str(cfg.execution_mode),
        windowStart: str(cfg.window_start),
        windowEnd: str(cfg.window_end),
        inspectorId: str(cfg.inspector_id),
        notes: str(cfg.notes),
        plannerLat: str(cfg.planner_lat),
        plannerLng: str(cfg.planner_lng),
        // Legacy targets re-confirm their licence through the same radio the
        // fresh flow uses; the saved value pre-checks it (canonical targets
        // need no separate confirmation — the licence IS the selection).
        licenseNumber: target?.license_number ?? undefined,
      };
      // A saved draft carries the immutable legacy publish identity alongside
      // its canonical CR/licence/plant context. Canonical registry reads are
      // useful enrichment, but must not strand a draft when that read is
      // temporarily unavailable: recover through the saved factory_id before
      // asking the planner to search again.
      if (target) {
        let resolved = false;
        if (target.source === "canonical" && (target.canonical_license_number || target.license_number || target.plant_number)) {
          const hit = await resolveHandoffTarget(sb, {
            cr: target.cr_number ?? undefined,
            license: (target.canonical_license_number ?? target.license_number) ?? undefined,
            plant: target.plant_number ?? undefined,
          });
          if (!hit.ok) {
            console.error("[ single-planning draft target resolve failed]");
            registryUnavailable = true;
          } else if (hit.portfolio) {
            portfolios = [hit.portfolio];
            if (hit.licence) initialSelection.licenceId = hit.licence.id;
            resolved = true;
          }
        }
        if (!resolved && target.factory_id && UUID.test(target.factory_id)) {
          const legacy = await readLegacyFactory(sb, target.factory_id);
          if (legacy.unavailable) registryUnavailable = true;
          else if (legacy.row) { graded = [legacy.row]; initialSelection.factoryId = legacy.row.id; }
          else prefillMiss = true;
        }
        // Older drafts may have canonical identifiers but no persisted legacy
        // factory id. They remain recoverable through the canonical resolver;
        // only show a miss once neither authoritative identity can resolve.
        if (!resolved && !initialSelection.factoryId && !registryUnavailable) prefillMiss = true;
      }
    }
  }

  // ---------------------------------------------------------------------
  // Factory 360 handoff prefill (PLN-REQ-024) — ?cr=&license=&plant= resolve
  // canonically (and preselect the pinned licence); ?factory= alone is the
  // legacy fallback. A disagreeing/unresolvable identifier set never picks a
  // best-effort target — the planner searches manually instead.
  const crParam = (sp.cr ?? "").trim();
  const licenseParam = (sp.license ?? "").trim();
  const plantParam = (sp.plant ?? "").trim();
  const factoryParam = (sp.factory ?? "").trim();
  if (!initialSelection.licenceId && !initialSelection.factoryId && !prefillMiss && (crParam || licenseParam || plantParam)) {
    handoff = true;
    const hit = await resolveHandoffTarget(sb, {
      cr: crParam || undefined,
      license: licenseParam || undefined,
      plant: plantParam || undefined,
    });
    if (!hit.ok) {
      console.error("[ single-planning handoff resolve failed]");
      registryUnavailable = true;
    } else if (hit.portfolio) {
      portfolios = [hit.portfolio];
      if (hit.licence) initialSelection.licenceId = hit.licence.id;
      // CR-only multi-licence handoff: the portfolio renders and the planner
      // must pick a licence/plant — CR-level continuation stays blocked.
    } else {
      prefillMiss = true;
    }
  }
  if (!initialSelection.licenceId && !initialSelection.factoryId && !prefillMiss && portfolios.length === 0 && UUID.test(factoryParam)) {
    handoff = true;
    const legacy = await readLegacyFactory(sb, factoryParam);
    if (legacy.unavailable) registryUnavailable = true;
    else if (legacy.row) { graded = [legacy.row]; initialSelection.factoryId = legacy.row.id; }
    else prefillMiss = true;
  }

  // ---------------------------------------------------------------------
  // Search: canonical CR/licence/plant resolver first (exact identifier
  // equality); an empty canonical result is the signal for the legacy
  // factories fallback (existing CD-022 behavior, marked source:'legacy').
  if (searching) {
    const canonical = await resolvePlanningTargets(sb, { q });
    if (!canonical.ok) {
      registryUnavailable = true;
    } else if (canonical.portfolios.length > 0) {
      portfolios = canonical.portfolios;
      graded = [];
    } else {
      // Server-side search: a broad DB-side ilike/eq net across the four
      // identifier+name fields (RLS-scoped, no service-role bypass), narrowed
      // to the precise EXACT/SIMILAR-NAME rule in JS afterward.
      const esc = q.replace(/[%_]/g, c => `\\${c}`);
      const { data: candidates, error: searchError } = await sb.from("factories")
        .select("id, factory_code, name, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, geofence_radius_m, source_synced_at")
        .or(`cr_number.eq.${q},factory_code.ilike.%${esc}%,license_number.ilike.%${esc}%,name.ilike.%${esc}%`)
        // Keep the bounded search deterministic and make a newly-created
        // registry record discoverable when live test/manual data contains
        // older matches for the same name fragment.
        .order("created_at", { ascending: false })
        .limit(50);
      if (searchError) {
        // eslint-disable-next-line no-console
        console.error("[ single-planning search]", searchError.message);
        registryUnavailable = true;
      }
      const dupChecks = await Promise.all((candidates ?? []).map(f => findDuplicateActiveVisits(sb, f.id)));
      if (dupChecks.some(read => read.unavailable)) {
        registryUnavailable = true;
      }
      graded = ((candidates ?? []) as LegacyFactoryRow[])
        .map((f, i) => ({ f, grade: gradeCandidate(f, q), dups: dupChecks[i] }))
        .filter((r): r is { f: LegacyFactoryRow; grade: "exact" | "similar_name"; dups: Awaited<ReturnType<typeof findDuplicateActiveVisits>> } => r.grade !== null && !registryUnavailable)
        .map(({ f, grade, dups }) => ({
          id: f.id, factory_code: f.factory_code, name: f.name, cr_number: f.cr_number, license_number: f.license_number,
          region: f.region, city: f.city, risk_band: f.risk_band, risk_score: f.risk_score,
          official_lat: f.official_lat, official_lng: f.official_lng, geofence_radius_m: f.geofence_radius_m,
          source_synced_at: f.source_synced_at,
          source: "legacy" as const,
          grade,
          degraded: !f.license_number || f.official_lat == null || f.official_lng == null,
          duplicate: dups.visits.length > 0,
          duplicateVisitId: dups.visits[0]?.id ?? null,
          duplicateVisitStatus: dups.visits[0]?.planning_status ?? null,
        }));
      portfolios = [];
    }
  }

  const strings: WizardStrings = {
    findFactory: t("plan.single.findFactory", "1 · Find factory — CR, Industrial License, plant or name"),
    searchPlaceholder: t("plan.single.searchPlaceholder", "CR number, Industrial License, plant number, factory code or name"),
    noMatch: t("plan.single.noMatch", "No factory matches — check the number and try again."),
    registryUnavailable: t("plan.single.registryUnavailable", "The Factory list is temporarily unavailable — try your search again."),
    crPrefix: t("plan.single.crPrefix", "CR"),
    exactBadge: t("plan.single.exactBadge", "EXACT"),
    exactRule: t("plan.single.exactRule", "Matches a governed identifier exactly (CR, factory code or Industrial License)"),
    similarBadge: t("plan.single.similarBadge", "SIMILAR NAME"),
    similarRule: t("plan.single.similarRule", "Name matches — identifiers differ from your search"),
    degradedBadge: t("plan.single.degradedBadge", "DEGRADED RECORD"),
    degradedRule: t("plan.single.degradedRule", "Missing Industrial License or official coordinates"),
    duplicateWarning: t("plan.single.duplicateWarning", "An active visit already exists for this factory — publishing will be blocked"),
    duplicateOpenVisit: t("plan.single.duplicateOpenVisit", "Open existing visit"),
    duplicateStatusLabel: t("plan.single.duplicateStatusLabel", "status"),
    portfolioStep: t("plan.single.portfolioStep", "2 · Select the Industrial License / plant"),
    crIdentity: t("plan.single.crIdentity", "Commercial Registration"),
    selectLicenceHint: t("plan.single.selectLicenceHint", "Every Industrial License and plant registered under this CR is listed — pick the one this visit targets."),
    licenceRequired: t("plan.single.licenceRequired", "Select one license / plant to continue — a single visit targets one plant, never the whole CR (CR-level planning is not eligible here)."),
    noLicences: t("plan.single.noLicences", "No Industrial License is recorded for this CR, so a single visit cannot be planned."),
    noFactoryLink: t("plan.single.noFactoryLink", "no linked factory record"),
    plantLabel: t("plan.single.plantLabel", "Plant"),
    selectedProfile: t("plan.single.selectedProfile", "Selected plant — registered profile (read-only)"),
    sourceLabel: t("plan.single.sourceLabel", "Source"),
    prefilledHandoff: t("plan.single.prefilledHandoff", "Target prefilled from Factory 360 — confirm the license / plant below."),
    prefillMiss: t("plan.single.prefillMiss", "The handed-off target could not be resolved — search for it manually below."),
    draftRestored: t("plan.single.draftRestored", "Draft restored — review the target and configuration, then continue."),
    saveDraft: t("plan.single.saveDraft", "Save draft"),
    savingDraft: t("plan.single.savingDraft", "Saving…"),
    draftSavedPrefix: t("plan.single.draftSavedPrefix", "Draft saved"),
    draftError: t("plan.single.draftError", "The draft could not be saved — your entries are preserved, try again."),
    licenseStep: t("plan.single.licenseStep", "2 · Industrial License"),
    licenseSelect: t("plan.single.licenseSelect", "Select the Industrial License this visit is planned against"),
    licenseLabel: t("plan.single.licenseLabel", "Industrial license"),
    licenseNone: t("plan.single.licenseNone", "No Industrial License is recorded for this factory — the visit will use the CR."),
    locationStep: t("plan.single.locationStep", "3 · Confirm location"),
    officialPin: t("plan.single.officialPin", "Official factory pin"),
    noOfficialPin: t("plan.single.noOfficialPin", "No official location on record — pin the visit location manually below."),
    plannerLat: t("plan.single.plannerLat", "Planner pin latitude (optional override)"),
    plannerLng: t("plan.single.plannerLng", "Planner pin longitude (optional override)"),
    plannerPin: t("plan.single.plannerPin", "Planner pin (this visit only — official pin is GIS Admin owned)"),
    locationConfirmed: t("plan.single.locationConfirmed", "Location confirmed"),
    mapLoading: t("plan.single.mapLoading", "Loading location map"),
    mapToggle: t("plan.single.mapToggle", "Map / Text"),
    textEquivalent: t("plan.single.textEquivalent", "Text equivalent of the location map"),
    riskContext: t("plan.single.riskContext", "Risk context ( v1 · advisory — never drives selection)"),
    riskUnknown: t("plan.single.riskUnknown", "not recorded"),
    freshnessLabel: t("plan.single.freshnessLabel", "Factory list sync"),
    freshnessNever: t("plan.single.freshnessNever", "no sync record"),
    factory360: t("plan.single.factory360", "Open Factory 360"),
    configStep: t("plan.single.configStep", "4 · Configure & assign"),
    visitType: t("plan.single.visitType", "Visit type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint-triggered"),
    packageLabel: t("plan.single.package", "Inspection checklists (optional — zero or more, active only)"),
    packageOptionalHint: t("plan.single.packageOptionalHint", "No checklist selected — that is allowed. The inspector chooses an eligible checklist during preparation."),
    mode: t("plan.single.mode", "Mode"),
    modePhysical: t("enum.physical", "Physical"),
    modeVirtual: t("enum.virtual", "Virtual"),
    modeIneligible: t("plan.single.modeIneligible", "Not eligible"),
    windowStart: t("plan.single.windowStart", "Window start"),
    windowEnd: t("plan.single.windowEnd", "Window end"),
    inspector: t("plan.single.inspector", "Inspector"),
    selectOption: t("plan.single.select", "— select"),
    autoAssign: t("plan.single.autoAssign", "Auto-assign — first available inspector"),
    notes: t("plan.single.notes", "Notes (optional)"),
    notesPlaceholder: t("plan.single.notesPlaceholder", "Anything the inspector or reviewer should know before this visit…"),
    readinessTitle: t("plan.single.readinessTitle", "Readiness"),
    readyIdentity: t("plan.single.readyIdentity", "Identity confirmed"),
    readyLicense: t("plan.single.readyLicense", "License confirmed"),
    readyLocation: t("plan.single.readyLocation", "Location confirmed"),
    readyInspector: t("plan.single.readyInspector", "Inspector ready"),
    blockedTitle: t("plan.single.blocked", "Publishing blocked — your work is preserved"),
    publish: t("plan.single.publish", "Publish visit"),
    publishing: t("plan.single.publishing", "Publishing…"),
    retry: t("plan.single.retry", "Retry — resumes safely, will not duplicate"),
    stepPlan: t("plan.single.stepPlan", "Plan created"),
    stepVisit: t("plan.single.stepVisit", "Visit created"),
    stepAssignment: t("plan.single.stepAssignment", "Inspector assigned"),
    stepStatus: t("plan.single.stepStatus", "Published"),
    stepNotification: t("plan.single.stepNotification", "Notification queued"),
    stepDone: t("plan.single.stepDone", "done"),
    stepFailed: t("plan.single.stepFailed", "failed"),
    stepPending: t("plan.single.stepPending", "not attempted"),
    riskBands: {
      high: t("enum.high", "high"),
      medium: t("enum.medium", "medium"),
      low: t("enum.low", "low"),
    },
  };
  return (
    <Shell current="/planning" title={t("plan.single.title", "Plan one visit")}
      context={<span className="sq-lozenge sq-lozenge--info">{t("plan.single.context", "Single visit planning")}</span>}>
      <Wizard
        query={q}
        portfolios={portfolios}
        results={graded}
        registryUnavailable={registryUnavailable}
        initialSelection={initialSelection}
        draft={draft}
        draftConfig={draftConfig}
        sourceChannel={sourceChannel}
        handoff={handoff}
        prefillMiss={prefillMiss}
        packages={(pkgs ?? []) as never}
        inspectors={inspectors}
        strings={strings}
        virtualEligible={virtualEligible}
        transitionsExecutable={access.can("planning.publish")}
        locale={locale === "ar" ? "ar" : "en"}
      />
    </Shell>
  );
}
