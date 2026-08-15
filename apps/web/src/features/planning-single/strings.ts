import type { DateRangePresetLabels } from "@/components/saqeel/date-range-picker/date-range-presets";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

export type Translate = (key: string, en: string) => string;

export type StepLabels = {
  readonly find: string;
  readonly licence: string;
  readonly location: string;
  readonly configure: string;
};

export type SingleVisitStrings = {
  readonly title: string;
  readonly context: string;
  readonly stepLabels: StepLabels;
  readonly findFactory: string;
  readonly preselected: string;
  readonly changeFactory: string;
  readonly searchFieldLabel: string;
  readonly searchPlaceholder: string;
  readonly searchPromptTitle: string;
  readonly searchPromptBody: string;
  readonly noMatch: string;
  readonly noMatchBody: string;
  readonly searching: string;
  readonly registryUnavailable: string;
  readonly crPrefix: string;
  readonly exactBadge: string;
  readonly exactRule: string;
  readonly similarBadge: string;
  readonly similarRule: string;
  readonly degradedBadge: string;
  readonly degradedRule: string;
  readonly duplicateWarning: string;
  readonly duplicateOpenVisit: string;
  readonly duplicateStatusLabel: string;
  readonly portfolioStep: string;
  readonly crIdentity: string;
  readonly selectLicenceHint: string;
  readonly licenceRequired: string;
  readonly noLicences: string;
  readonly noFactoryLink: string;
  readonly plantLabel: string;
  readonly selectedProfile: string;
  readonly sourceLabel: string;
  readonly prefilledHandoff: string;
  readonly adminPackageHandoff: string;
  readonly prefillMiss: string;
  readonly draftRestored: string;
  readonly saveDraft: string;
  readonly savingDraft: string;
  readonly draftSavedPrefix: string;
  readonly draftError: string;
  readonly licenseStep: string;
  readonly licenseSelect: string;
  readonly licenseLabel: string;
  readonly licenseNone: string;
  readonly locationStep: string;
  readonly officialAddress: string;
  readonly officialPin: string;
  readonly noOfficialPin: string;
  readonly locationAuthority: string;
  readonly locationReadOnly: string;
  readonly locationConfirmed: string;
  readonly mapToggle: string;
  readonly textEquivalent: string;
  readonly riskContext: string;
  readonly riskUnknown: string;
  readonly freshnessLabel: string;
  readonly freshnessNever: string;
  readonly factory360: string;
  readonly configStep: string;
  readonly visitType: string;
  readonly typePeriodic: string;
  readonly typeFollowUp: string;
  readonly typeComplaint: string;
  readonly packageLabel: string;
  readonly packageOptionalHint: string;
  readonly noPackages: string;
  readonly mode: string;
  readonly modePhysical: string;
  readonly modeVirtual: string;
  readonly modeIneligible: string;
  readonly window: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly windowStartTime: string;
  readonly windowEndTime: string;
  readonly windowApply: string;
  readonly windowClear: string;
  readonly windowEmpty: string;
  readonly windowHint: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly presetLabels: DateRangePresetLabels;
  readonly inspector: string;
  readonly autoAssign: string;
  readonly notes: string;
  readonly notesPlaceholder: string;
  readonly readinessTitle: string;
  readonly readyIdentity: string;
  readonly readyLicense: string;
  readonly readyLocation: string;
  readonly readyInspector: string;
  readonly gateMet: string;
  readonly gateUnmet: string;
  readonly gateOptional: string;
  readonly blockedTitle: string;
  readonly publish: string;
  readonly publishing: string;
  readonly retry: string;
  readonly stepPlan: string;
  readonly stepVisit: string;
  readonly stepAssignment: string;
  readonly stepStatus: string;
  readonly stepNotification: string;
  readonly stepDone: string;
  readonly stepFailed: string;
  readonly stepPending: string;
  readonly absent: string;
};

const TOTAL_STEPS = 4;

export function buildSingleVisitStrings(t: Translate, locale: Locale): SingleVisitStrings {
  const single = getMessages(locale).planning.single;
  const step = (current: number) => fill(single.step, { current, total: TOTAL_STEPS });
  return {
    title: t("plan.single.title", "Plan a single visit"),
    context: t("plan.single.context", "Single visit planning"),
    stepLabels: { find: step(1), licence: step(2), location: step(3), configure: step(4) },
    findFactory: single.findFactory,
    preselected: single.preselected,
    changeFactory: single.changeFactory,
    searchFieldLabel: single.searchFieldLabel,
    searchPlaceholder: single.searchPlaceholder,
    searchPromptTitle: single.searchPromptTitle,
    searchPromptBody: single.searchPromptBody,
    noMatch: t("plan.single.noMatch", "No factory matches — check the number and try again."),
    noMatchBody: t("plan.single.noMatchBody", "No registered factory matches that search within your access scope."),
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
    portfolioStep: single.portfolioStep,
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
    licenseStep: single.licenseStep,
    licenseSelect: t("plan.single.licenseSelect", "Select the Industrial License this visit is planned against"),
    licenseLabel: t("plan.single.licenseLabel", "Industrial license"),
    licenseNone: t("plan.single.licenseNone", "No Industrial License is recorded for this factory — the visit will use the CR."),
    locationStep: single.locationStep,
    officialAddress: t("plan.single.officialAddress", "Official address"),
    officialPin: t("plan.single.officialPin", "Official factory pin"),
    noOfficialPin: t("plan.single.noOfficialPin", "No official location is available from the external master source."),
    locationAuthority: t("plan.single.locationAuthority", "Senaei / external master source"),
    locationReadOnly: t("plan.single.locationReadOnly", "Read-only — location master data cannot be changed in Planning"),
    locationConfirmed: t("plan.single.locationConfirmed", "Location confirmed"),
    mapToggle: t("plan.single.mapToggle", "Map / Text"),
    textEquivalent: t("plan.single.textEquivalent", "Text equivalent of the location map"),
    riskContext: t("plan.single.riskContext", "Risk context ( v1 · advisory — never drives selection)"),
    riskUnknown: t("plan.single.riskUnknown", "not recorded"),
    freshnessLabel: t("plan.single.freshnessLabel", "Factory list sync"),
    freshnessNever: t("plan.single.freshnessNever", "no sync record"),
    factory360: t("plan.single.factory360", "Open Factory 360"),
    configStep: single.configStep,
    visitType: t("plan.single.visitType", "Visit type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint-triggered"),
    packageLabel: t("plan.single.package", "Inspection checklists (optional — zero or more, active only)"),
    packageOptionalHint: t("plan.single.packageOptionalHint", "No checklist selected — that is allowed. The inspector chooses an eligible checklist during preparation."),
    noPackages: t("plan.single.noPackages", "No inspection package is published for this scope."),
    mode: t("plan.single.mode", "Mode"),
    modePhysical: t("enum.physical", "Physical"),
    modeVirtual: t("enum.virtual", "Virtual"),
    modeIneligible: t("plan.single.modeIneligible", "Not eligible"),
    window: t("plan.single.window", "Visit window"),
    windowStart: t("plan.single.windowStart", "Window start"),
    windowEnd: t("plan.single.windowEnd", "Window end"),
    windowStartTime: t("plan.single.windowStartTime", "Start time"),
    windowEndTime: t("plan.single.windowEndTime", "End time"),
    windowApply: t("plan.single.windowApply", "Apply window"),
    windowClear: t("plan.single.windowClear", "Clear"),
    windowEmpty: t("plan.single.windowEmpty", "No date chosen"),
    windowHint: t("plan.single.windowHint", "The window must end after it starts."),
    previousMonth: t("plan.single.previousMonth", "Previous month"),
    nextMonth: t("plan.single.nextMonth", "Next month"),
    presetLabels: {
      today: t("common.scope.today", "Today"),
      last7Days: t("common.scope.last7Days", "Last 7 days"),
      last30Days: t("common.scope.last30Days", "Last 30 days"),
      last90Days: t("common.scope.last90Days", "Last 90 days"),
      lastYear: t("common.scope.lastYear", "Last year"),
      next7Days: t("common.scope.next7Days", "Next 7 days"),
      next30Days: t("common.scope.next30Days", "Next 30 days"),
    },
    inspector: t("plan.single.inspector", "Inspector"),
    autoAssign: t("plan.single.autoAssign", "No preference — Supervisor assigns"),
    notes: t("plan.single.notes", "Notes (optional)"),
    notesPlaceholder: t("plan.single.notesPlaceholder", "Anything the Inspector or Supervisor should know before this visit…"),
    readinessTitle: t("plan.single.readinessTitle", "Readiness"),
    readyIdentity: t("plan.single.readyIdentity", "Identity confirmed"),
    readyLicense: t("plan.single.readyLicense", "License confirmed"),
    readyLocation: t("plan.single.readyLocation", "Location confirmed"),
    readyInspector: t("plan.single.readyInspector", "Inspector proposed (optional)"),
    gateMet: t("plan.single.gateMet", "Met"),
    gateUnmet: t("plan.single.gateUnmet", "Not met"),
    gateOptional: t("plan.single.gateOptional", "Optional"),
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
    absent: "—",
  };
}

export type SingleAccessStrings = {
  readonly unauthorizedTitle: string;
  readonly unauthorizedBody: string;
  readonly failureTitle: string;
  readonly failureBody: string;
  readonly sessionTitle: string;
  readonly sessionBody: string;
  readonly sessionRetry: string;
  readonly referenceLabel: string;
  readonly retry: string;
};

export function buildSingleAccessStrings(t: Translate, locale: "ar" | "en"): SingleAccessStrings {
  const ar = (key: string, en: string, arabic: string) => locale === "ar" ? arabic : t(key, en);
  return {
    unauthorizedTitle: ar("plan.single.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة"),
    unauthorizedBody: ar(
      "plan.single.unauthorized.body",
      "Only planning staff can use Plan a single visit.",
      "تخطيط الزيارة المفردة متاح لموظفي التخطيط فقط.",
    ),
    failureTitle: t("plan.read.failure.title", "Planning access needs attention"),
    failureBody: t("plan.read.failure.body", "Planning data is not available right now. Nothing was changed. Try again once access is fixed."),
    sessionTitle: t("plan.read.session.title", "Session verification required"),
    sessionBody: t("plan.read.session.body", "Your secure session could not be verified. Nothing was changed. Sign in again, then retry."),
    sessionRetry: t("plan.read.session.retry", "Sign in again"),
    referenceLabel: t("plan.read.failure.reference", "Support reference"),
    retry: t("plan.read.failure.retry", "Retry"),
  };
}
