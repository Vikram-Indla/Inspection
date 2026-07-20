import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import Wizard, { type WizardStrings, type GradedFactory } from "./Wizard";
import { findDuplicateActiveVisits } from "./duplicate";

export const dynamic = "force-dynamic";

// CD-022 — server-side identifier + name search (name search is NEW; the
// prior runtime only matched CR/factory_code/license_number client-side over
// the full table). EXACT = governed identifier equality only (no scoring).
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

export default async function SinglePlanning({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const searching = q.length >= 3;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();

  // SCR-WEB-120 is Planner-only (per IMPLEMENTATION_MANIFEST_CD-022.yaml
  // persona: Planner). Shell.tsx only enforces "signed in at all" and
  // shell-navigation.ts explicitly documents itself as non-enforcing (it
  // just hides the nav link) — this page-level check is the actual boundary
  // for the UI state shown; the write path is separately RLS-gated
  // (has_role('planner') on visit_plans/visits inserts) regardless.
  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  const { data: myRoles, error: rolesError } = user
    ? await getUserRoles(user.id)
    : { data: [] as { role_key: string }[], error: null };
  if (userError || rolesError) {
    console.error("[CD-022 single-planning authorization]", userError?.message ?? rolesError?.message);
    return (
      <Shell current="/planning" title={t("plan.single.title", "Single visit planning")}>
        <div className="ax-banner ax-banner--critical" role="alert">
          {tr("plan.single.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Try again.", "بيانات التخطيط غير متاحة مؤقتًا (ERR-OPS-001). حاول مرة أخرى.")}
        </div>
      </Shell>
    );
  }
  const isPlanner = (myRoles ?? []).some(r => r.role_key === "planner");
  if (!isPlanner) {
    return (
      <Shell current="/planning" title={t("plan.single.title", "Single visit planning")}>
        <EmptyState glyph="⛔" title={tr("plan.single.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("plan.single.unauthorized.body", "Single Visit Planning (SCR-WEB-120) is available to the Planner role only.", "تخطيط الزيارة الفردية (SCR-WEB-120) متاح لدور المخطط فقط.")} />
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
    console.error("[CD-022 single-planning configuration]", packageRead.error?.message ?? inspectorRead.error?.message ?? otpRead.error?.message);
    return (
      <Shell current="/planning" title={t("plan.single.title", "Single visit planning")}>
        <div className="ax-banner ax-banner--critical" role="alert">
          {tr("plan.single.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Try again.", "بيانات التخطيط غير متاحة مؤقتًا (ERR-OPS-001). حاول مرة أخرى.")}
        </div>
      </Shell>
    );
  }
  const pkgs = packageRead.data;
  const inspRoles = inspectorRead.data;
  const otpEngine = otpRead.data;
  const inspectors = (inspRoles ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const virtualEligible = !!otpEngine;

  // Server-side search: a broad DB-side ilike/eq net across the four
  // identifier+name fields (RLS-scoped, no service-role bypass), narrowed to
  // the precise EXACT/SIMILAR-NAME rule in JS afterward. Replaces the prior
  // client-side filter over the entire unpaginated factories table.
  let graded: GradedFactory[] = [];
  let registryUnavailable = false;
  if (searching) {
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
      console.error("[CD-022 single-planning search]", searchError.message);
      registryUnavailable = true;
    }
    const dupChecks = await Promise.all((candidates ?? []).map(f => findDuplicateActiveVisits(sb, f.id)));
    if (dupChecks.some(read => read.unavailable)) {
      registryUnavailable = true;
    }
    graded = (candidates ?? [])
      .map((f, i) => ({ f, grade: gradeCandidate(f, q), dups: dupChecks[i] }))
      .filter((r): r is { f: NonNullable<typeof candidates>[number]; grade: "exact" | "similar_name"; dups: Awaited<ReturnType<typeof findDuplicateActiveVisits>> } => r.grade !== null && !registryUnavailable)
      .map(({ f, grade, dups }) => ({
        id: f.id, factory_code: f.factory_code, name: f.name, cr_number: f.cr_number, license_number: f.license_number,
        region: f.region, city: f.city, risk_band: f.risk_band, risk_score: f.risk_score,
        official_lat: f.official_lat, official_lng: f.official_lng, geofence_radius_m: f.geofence_radius_m,
        source_synced_at: (f as unknown as { source_synced_at: string | null }).source_synced_at,
        grade,
        degraded: !f.license_number || f.official_lat == null || f.official_lng == null,
        duplicate: dups.visits.length > 0,
        duplicateVisitId: dups.visits[0]?.id ?? null,
        duplicateVisitStatus: dups.visits[0]?.planning_status ?? null,
      }));
  }

  const strings: WizardStrings = {
    findFactory: t("plan.single.findFactory", "1 · Find factory — CR, code, Industrial License or name (M01-035)"),
    searchPlaceholder: t("plan.single.searchPlaceholder", "CR number, factory code, Industrial License or name"),
    noMatch: t("plan.single.noMatch", "No factory matches — check the number, or create an Immediate Visit (M01-045)."),
    registryUnavailable: t("plan.single.registryUnavailable", "The factory registry is temporarily unavailable — try your search again."),
    crPrefix: t("plan.single.crPrefix", "CR"),
    exactBadge: t("plan.single.exactBadge", "EXACT"),
    exactRule: t("plan.single.exactRule", "Matches a governed identifier exactly (CR, factory code or Industrial License)"),
    similarBadge: t("plan.single.similarBadge", "SIMILAR NAME"),
    similarRule: t("plan.single.similarRule", "Name matches — identifiers differ from your search"),
    degradedBadge: t("plan.single.degradedBadge", "DEGRADED RECORD"),
    degradedRule: t("plan.single.degradedRule", "Missing Industrial License or official coordinates"),
    duplicateWarning: t("plan.single.duplicateWarning", "An active visit already exists for this factory (M02-012) — shown as a warning here, blocked at publish"),
    duplicateOpenVisit: t("plan.single.duplicateOpenVisit", "Open existing visit"),
    duplicateStatusLabel: t("plan.single.duplicateStatusLabel", "status"),
    licenseStep: t("plan.single.licenseStep", "2 · Industrial License (M01-036)"),
    licenseSelect: t("plan.single.licenseSelect", "Select the Industrial License this visit is planned against"),
    licenseLabel: t("plan.single.licenseLabel", "Industrial license"),
    licenseNone: t("plan.single.licenseNone", "No Industrial License on record for this factory — the visit proceeds against the CR (M01-036)."),
    locationStep: t("plan.single.locationStep", "3 · Confirm location (M01-038)"),
    officialPin: t("plan.single.officialPin", "Official factory pin"),
    noOfficialPin: t("plan.single.noOfficialPin", "No official location on record — pin the visit location manually below."),
    plannerLat: t("plan.single.plannerLat", "Planner pin latitude (optional override)"),
    plannerLng: t("plan.single.plannerLng", "Planner pin longitude (optional override)"),
    plannerPin: t("plan.single.plannerPin", "Planner pin (this visit only — official pin is GIS Admin owned)"),
    locationConfirmed: t("plan.single.locationConfirmed", "Location confirmed — publish is blocked until confirmed (M01-038)"),
    mapLoading: t("plan.single.mapLoading", "Loading location map"),
    mapToggle: t("plan.single.mapToggle", "Map / Text"),
    textEquivalent: t("plan.single.textEquivalent", "Text equivalent of the location map"),
    riskContext: t("plan.single.riskContext", "Risk context (ENG-04 v1 · advisory — never drives selection)"),
    riskUnknown: t("plan.single.riskUnknown", "not recorded"),
    freshnessLabel: t("plan.single.freshnessLabel", "Registry sync"),
    freshnessNever: t("plan.single.freshnessNever", "no sync record"),
    factory360: t("plan.single.factory360", "Open Factory 360"),
    configStep: t("plan.single.configStep", "4 · Configure & assign"),
    visitType: t("plan.single.visitType", "Visit type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint-triggered"),
    packageLabel: t("plan.single.package", "Package (published only)"),
    mode: t("plan.single.mode", "Mode"),
    modePhysical: t("enum.physical", "Physical"),
    modeVirtual: t("enum.virtual", "Virtual"),
    modeIneligible: t("plan.single.modeIneligible", "not eligible (M03-011)"),
    windowStart: t("plan.single.windowStart", "Window start"),
    windowEnd: t("plan.single.windowEnd", "Window end"),
    inspector: t("plan.single.inspector", "Inspector (M01-040)"),
    selectOption: t("plan.single.select", "— select"),
    autoAssign: t("plan.single.autoAssign", "Auto-assign — first available inspector (M01-040)"),
    notes: t("plan.single.notes", "Notes (optional)"),
    notesPlaceholder: t("plan.single.notesPlaceholder", "Anything the inspector or reviewer should know before this visit…"),
    readinessTitle: t("plan.single.readinessTitle", "Readiness"),
    readyIdentity: t("plan.single.readyIdentity", "Identity confirmed"),
    readyLicense: t("plan.single.readyLicense", "License confirmed"),
    readyLocation: t("plan.single.readyLocation", "Location confirmed"),
    readyInspector: t("plan.single.readyInspector", "Inspector ready"),
    blockedTitle: t("plan.single.blocked", "Publishing blocked — work preserved (M01-041)"),
    publish: t("plan.single.publish", "Publish visit (one plan · one visit — M01-042)"),
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
    <Shell current="/planning" title={t("plan.single.title", "Single visit planning")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.single.context", "SCR-WEB-120 · identity confidence lens")}</span>}>
      <Wizard query={q} results={graded} registryUnavailable={registryUnavailable} packages={(pkgs ?? []) as never} inspectors={inspectors} strings={strings} virtualEligible={virtualEligible} />
    </Shell>
  );
}
