import type { SupabaseClient } from "@supabase/supabase-js";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import PlanningReadFailureState from "@/components/PlanningReadFailure";
import {
  getPlanningReadContract,
  planningAuthenticationFailure,
  planningDependencyFailure,
  type PlanningSingleReadData,
} from "@/lib/planning/read-contract";
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
  source: string | null; source_synced_at: string | null;
};

// One legacy factory by id (handoff prefill / draft-target hydration) with the
// same duplicate read the search path runs. Fail-closed: a read error is
// "unavailable", never a fabricated miss.
async function readLegacyFactory(sb: SupabaseClient, id: string): Promise<{ row: GradedFactory | null; unavailable: boolean }> {
  const { data: f, error } = await sb.from("factories")
    .select("id, factory_code, name, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, geofence_radius_m, source, source_synced_at")
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
      source_synced_at: row.source_synced_at, master_source: row.source,
      source: "legacy",
      grade: "exact",
      degraded: !row.license_number || row.official_lat == null || row.official_lng == null,
      duplicate: dups.visits.length > 0,
      duplicateVisitId: dups.visits[0]?.id ?? null,
      duplicateVisitStatus: dups.visits[0]?.planning_status ?? null,
    },
  };
}

type Sp = { q?: string; plan?: string; package?: string; cr?: string; license?: string; plant?: string; factory?: string; source?: string };

export default async function SinglePlanning({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const searching = q.length >= 3;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();

  // DM-006 / PLN-READ-CONTRACT — one SECURITY INVOKER RPC resolves the
  // Planner-only capability and the three configuration reads below. The
  // caller's table grants and RLS remain authoritative; a missing contract or
  // dependency becomes a correlated recovery state instead of a generic code.
  const contract = await getPlanningReadContract<PlanningSingleReadData>(sb, "single");
  if (!contract.ok) {
    if (contract.kind === "denied") {
      return (
        <Shell current="/planning" title={t("plan.single.title", "Plan a single visit")}>
          <EmptyState glyph="⛔" title={tr("plan.single.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة")}
            body={tr("plan.single.unauthorized.body", "Only planning staff can use Plan a single visit.", "تخطيط الزيارة المفردة متاح لموظفي التخطيط فقط.")} />
        </Shell>
      );
    }
    return (
      <Shell current="/planning" title={t("plan.single.title", "Plan a single visit")}>
        <PlanningReadFailureState
          failure={contract}
          title={t("plan.read.failure.title", "Planning access needs attention")}
          body={t("plan.read.failure.body", "Planning data is not available right now. Nothing was changed. Try again once access is fixed.")}
          referenceLabel={t("plan.read.failure.reference", "Support reference")}
          retryLabel={t("plan.read.failure.retry", "Retry")}
          retryHref="/planning/single"
        />
      </Shell>
    );
  }

  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError) {
    const failure = planningAuthenticationFailure();
    console.error(`[planning.read:${failure.correlationId}] verified session failed`, userError.message);
    return (
      <Shell current="/planning" title={t("plan.single.title", "Plan a single visit")}>
        <PlanningReadFailureState
          failure={failure}
          title={t("plan.read.session.title", "Session verification required")}
          body={t("plan.read.session.body", "Your secure session could not be verified. Nothing was changed. Sign in again, then retry.")}
          referenceLabel={t("plan.read.failure.reference", "Support reference")}
          retryLabel={t("plan.read.session.retry", "Sign in again")}
          retryHref="/login?next=/planning/single"
        />
      </Shell>
    );
  }

  const pkgs = contract.data.packages;
  const inspectors = contract.data.inspectors;
  const virtualEligible = contract.data.virtual_eligible;
  // The transition gate must use the same fail-closed capability resolver as
  // the server action. The read contract remains authoritative for page data,
  // but its cached projection must not contradict a current explicit grant
  // and leave a valid governed submission permanently disabled.
  const transitionAccess = await getPlanningAccess(sb, ["planning.submit_for_supervision"]);
  const transitionsExecutable = transitionAccess.error === null
    && transitionAccess.can("planning.submit_for_supervision");

  // A published Admin package can hand the Planner into this route with an
  // immutable version already selected. The prefill is deliberately ignored
  // when it is not in the Planner's current RLS-scoped read contract: a URL
  // must never make an inactive or unauthorized package selectable.
  const requestedPackageId = (sp.package ?? "").trim();
  const packagePrefill = UUID.test(requestedPackageId) && pkgs.some(pkg => pkg.id === requestedPackageId)
    ? requestedPackageId
    : undefined;

  let portfolios: ResolvedPortfolio[] = [];
  let graded: GradedFactory[] = [];
  let registryUnavailable = false;
  let initialSelection: InitialSelection = {};
  let handoff = false;
  let prefillMiss = false;
  let draft: DraftInfo | null = null;
  let draftConfig: DraftConfig = packagePrefill ? { packageVersionIds: [packagePrefill] } : {};
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
      const failure = planningDependencyFailure(contract.correlationId);
      return (
        <Shell current="/planning" title={t("plan.single.title", "Plan a single visit")}>
          <PlanningReadFailureState
            failure={failure}
            title={t("plan.read.failure.title", "Planning access needs attention")}
            body={t("plan.read.failure.body", "Planning data is not available right now. Nothing was changed. Try again once access is fixed.")}
            referenceLabel={t("plan.read.failure.reference", "Support reference")}
            retryLabel={t("plan.read.failure.retry", "Retry")}
            retryHref={`/planning/single?plan=${planParam}`}
          />
        </Shell>
      );
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
    } else if (UUID.test(factoryParam)) {
      // A Factory 360 link always carries its immutable legacy factory id as
      // well as any canonical CR/licence/plant identifiers. Canonical
      // provenance is preferred, but a temporarily incomplete canonical
      // projection must not strand a planner who opened a real governed
      // Factory 360 record. Recover the exact linked factory only; never pick
      // a similarly named or best-effort alternative.
      const legacy = await readLegacyFactory(sb, factoryParam);
      if (legacy.unavailable) registryUnavailable = true;
      else if (legacy.row) {
        graded = [legacy.row];
        initialSelection.factoryId = legacy.row.id;
      } else prefillMiss = true;
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
        .select("id, factory_code, name, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, geofence_radius_m, source, source_synced_at")
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
          source_synced_at: f.source_synced_at, master_source: f.source,
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

  // Keep the Admin → Planner handoff visible. The package is still validated
  // again by the submit action; this banner is evidence of the governed
  // preselection, not an authority bypass.
  const adminPackageHandoff = sourceChannel === "admin.packages" && packagePrefill
    ? pkgs.find(pkg => pkg.id === packagePrefill) ?? null
    : null;

  const strings: WizardStrings = {
    findFactory: t("plan.single.findFactory", "1 · Find factory — CR, Industrial License, plant or name"),
    searchPlaceholder: t("plan.single.searchPlaceholder", "CR number, Industrial License, plant number, factory code or name"),
    noMatch: t("plan.single.noMatch", "No factory matches — check the number and try again."),
    searching: t("plan.single.searching", "Searching the Factory list…"),
    registryUnavailable: t("plan.single.registryUnavailable", "The Factory list is not available right now — try your search again."),
    crPrefix: t("plan.single.crPrefix", "CR"),
    exactBadge: t("plan.single.exactBadge", "EXACT"),
    exactRule: t("plan.single.exactRule", "Matches an exact identifier (CR, factory code or Industrial License)"),
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
    licenceRequired: t("plan.single.licenceRequired", "Select one license / plant to continue — a single visit targets one plant, never the whole CR (CR-level planning is not allowed here)."),
    noLicences: t("plan.single.noLicences", "No Industrial License is recorded for this CR, so a single visit cannot be planned."),
    noFactoryLink: t("plan.single.noFactoryLink", "no linked factory record"),
    plantLabel: t("plan.single.plantLabel", "Plant"),
    selectedProfile: t("plan.single.selectedProfile", "Selected plant — registered profile (read-only)"),
    sourceLabel: t("plan.single.sourceLabel", "Source"),
    prefilledHandoff: t("plan.single.prefilledHandoff", "Target prefilled from Factory 360 — confirm the license / plant below."),
    adminPackageHandoff: t("plan.single.adminPackageHandoff", "Admin package handoff — published version preselected:"),
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
    officialAddress: t("plan.single.officialAddress", "Official address"),
    officialPin: t("plan.single.officialPin", "Official factory pin"),
    noOfficialPin: t("plan.single.noOfficialPin", "No official location is available from the external master source."),
    locationAuthority: t("plan.single.locationAuthority", "Senaei / external master source"),
    locationReadOnly: t("plan.single.locationReadOnly", "Read-only — location master data cannot be changed in Planning"),
    locationConfirmed: t("plan.single.locationConfirmed", "Location confirmed"),
    mapLoading: t("plan.single.mapLoading", "Loading location map"),
    mapToggle: t("plan.single.mapToggle", "Map / Text"),
    textEquivalent: t("plan.single.textEquivalent", "Text equivalent of the location map"),
    riskContext: t("plan.single.riskContext", "Risk context ( v1 · advisory — never drives selection)"),
    riskUnknown: t("plan.single.riskUnknown", "not recorded"),
    freshnessLabel: t("plan.single.freshnessLabel", "Factory list sync"),
    freshnessNever: t("plan.single.freshnessNever", "no sync record"),
    factory360: t("plan.single.factory360", "Open Factory 360"),
    configStep: t("plan.single.configStep", "4 · Configure & propose"),
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
    autoAssign: t("plan.single.autoAssign", "No preference — Supervisor assigns"),
    notes: t("plan.single.notes", "Notes (optional)"),
    notesPlaceholder: t("plan.single.notesPlaceholder", "Anything the Inspector or Supervisor should know before this visit…"),
    noMatchBody: t("plan.single.noMatchBody", "No registered factory matches that search within your access scope."),
    gateMet: t("plan.single.gateMet", "Met"),
    gateUnmet: t("plan.single.gateUnmet", "Not met"),
    gateOptional: t("plan.single.gateOptional", "Optional"),
    presetLabels: {
      today: t("common.scope.today", "Today"),
      last7Days: t("common.scope.last7Days", "Last 7 days"),
      last30Days: t("common.scope.last30Days", "Last 30 days"),
      last90Days: t("common.scope.last90Days", "Last 90 days"),
      lastYear: t("common.scope.lastYear", "Last year"),
      next7Days: t("common.scope.next7Days", "Next 7 days"),
      next30Days: t("common.scope.next30Days", "Next 30 days"),
    },
    window: t("plan.single.window", "Visit window"),
    windowStartTime: t("plan.single.windowStartTime", "Start time"),
    windowEndTime: t("plan.single.windowEndTime", "End time"),
    windowApply: t("plan.single.windowApply", "Apply window"),
    windowClear: t("plan.single.windowClear", "Clear"),
    windowEmpty: t("plan.single.windowEmpty", "No date chosen"),
    previousMonth: t("plan.single.previousMonth", "Previous month"),
    nextMonth: t("plan.single.nextMonth", "Next month"),
    windowHint: t("plan.single.windowHint", "The window must end after it starts."),
    noPackages: t("plan.single.noPackages", "No inspection package is published for this scope."),
    readinessTitle: t("plan.single.readinessTitle", "Readiness"),
    readyIdentity: t("plan.single.readyIdentity", "Identity confirmed"),
    readyLicense: t("plan.single.readyLicense", "License confirmed"),
    readyLocation: t("plan.single.readyLocation", "Location confirmed"),
    readyInspector: t("plan.single.readyInspector", "Inspector proposed (optional)"),
    blockedTitle: t("plan.single.blocked", "Submission blocked — your work is preserved"),
    publish: t("plan.single.publish", "Submit for supervision"),
    publishing: t("plan.single.publishing", "Submitting…"),
    retry: t("plan.single.retry", "Retry — resumes safely, will not duplicate"),
    stepPlan: t("plan.single.stepPlan", "Plan created"),
    stepVisit: t("plan.single.stepVisit", "Visit created"),
    stepAssignment: t("plan.single.stepAssignment", "Inspector proposed"),
    stepStatus: t("plan.single.stepStatus", "Awaiting Supervisor"),
    stepNotification: t("plan.single.stepNotification", "Supervisor notified"),
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
    <Shell current="/planning" title={t("plan.single.title", "Plan a single visit")}
      context={<StatusPill tone="info">{t("plan.single.context", "Single visit planning")}</StatusPill>}>
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
        adminPackageHandoff={adminPackageHandoff ? `${adminPackageHandoff.packages.code} · ${adminPackageHandoff.version_label}` : null}
        prefillMiss={prefillMiss}
        packages={(pkgs ?? []) as never}
        inspectors={inspectors}
        strings={strings}
        virtualEligible={virtualEligible}
        transitionsExecutable={transitionsExecutable}
        locale={locale === "ar" ? "ar" : "en"}
      />
    </Shell>
  );
}
