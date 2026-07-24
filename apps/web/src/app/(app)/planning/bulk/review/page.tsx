import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getPlanningAccess } from "@/lib/planning/access";
import ReviewClient, { type ReviewStrings } from "./ReviewClient";
import { loadBulkDraft } from "../actions";
import { IconBlocked } from "@/app/icons";
import "./review.css";

// CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish (staged workspace).
// Mounted on the governed /planning/bulk/review route (relocation approved:
// governance/HUMAN_APPROVALS.yaml gate CD-021-P02-relocation-approval). The
// targeting screen (CD-024, SCR-WEB-110) selects WHICH factories; this screen
// reviews the staged plan, surfaces every blocker bound to its object, shows the
// Publish Consequence Ledger, and publishes atomically via publish_bulk_plan.
// /planning/plans/:id stays read-only and is only linked after a successful commit.
// M6 — ?plan=<id> resumes a persisted bulk draft (visit_plans method 'bulk',
// status 'draft'): the server loads it here and the workspace hydrates from it,
// falling back to the browser-held selection when no draft is referenced.
export default async function BulkReview({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planParam } = await searchParams;
  const { t, locale } = await useT();

  // RBAC-007 / M6 — capability gate (planning.create.bulk), the canonical
  // planning access model instead of a hand-rolled role read. Navigation
  // visibility is never authorization; RLS remains the data boundary and the
  // guarded RPC re-checks its own Planner role at publish (documented
  // asymmetry: the Reviewer persona holds the capability and can stage,
  // validate and save drafts, but publish_bulk_plan enforces has_role).
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, ["planning.create.bulk"]);
  if (authError || access.error !== null) {
    console.error("[CD-025 bulk review authorization]", authError?.message ?? access.error);
    return (
      <Shell current="/planning" title={t("plan.review.title", "Plan review & publish")}>
        <div className="sq-banner sq-banner--critical" role="alert">{t("plan.bulk.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Try again.")}</div>
      </Shell>
    );
  }
  if (!user || !access.can("planning.create.bulk")) {
    return (
      <Shell current="/planning" title={t("plan.review.title", "Plan review & publish")}>
        <section className="panel cd-panelpad sq-permission">
          <div className="sq-state sq-state--inline">
            <span className="sq-state__glyph" aria-hidden="true"><IconBlocked size={24} /></span>
            <h4 tabIndex={-1}>{t("plan.review.unauth.title", "You don’t have access to review this plan")}</h4>
            <p className="t-caption">{t("plan.review.unauth.body", "This view requires the bulk-planning capability and matching scope. Navigation visibility is not authorization; RLS remains the boundary.")}</p>
            <a className="sq-link" href="/planning">{t("plan.review.unauth.back", "Back to planning")}</a>
          </div>
        </section>
      </Shell>
    );
  }

  // M6 — resume consumption. Only an OWN, still-draft bulk plan hydrates the
  // workspace; anything else (published, archived, another planner's, unknown
  // id) is reported honestly and the legacy browser-held path takes over.
  let initialDraft = null;
  let draftUnavailable = false;
  if (planParam) {
    const res = await loadBulkDraft(planParam);
    if (res.draft) initialDraft = res.draft;
    else draftUnavailable = true;
  }

  const strings: ReviewStrings = {
    loading: t("plan.review.loading", "Loading your selection…"),
    loadingNote: t("plan.review.loadingNote", "Validating factories, inspection checklist, Inspectors and duplicates…"),
    stagedBanner: t("plan.review.staged", "Staged review. No plan record exists yet — nothing is saved until you publish."),
    stagedSub: t("plan.review.stagedSub", "Selected factories carried from targeting · verifying sources"),
    unavailable: t("plan.review.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Return to targeting and try again."),
    emptyTitle: t("plan.review.emptyTitle", "No factories selected"),
    emptyBody: t("plan.review.emptyBody", "Select target factories on the targeting screen, then continue to review."),
    backToTargeting: t("plan.review.back", "Back to targeting"),
    scopeTitle: t("plan.review.scopeTitle", "Selection is no longer fully in scope"),
    scopeBody: t("plan.review.scopeBody", "{n} selected factory record(s) could not be read in your current scope. Nothing was silently removed or published; return to targeting and refresh the selection."),
    scopeReduced: t("plan.review.scopeReduced", "Removed {removed} duplicate factory record(s). {retained} retained — readiness re-checked."),

    method: t("plan.review.method", "Bulk plan — periodic compliance campaign"),
    freshnessPrefix: t("plan.review.freshness", "Sources last checked"),
    selected: t("plan.review.selected", "Selected"),
    retained: t("plan.review.retained", "Retained"),
    visits: t("plan.review.visits", "Proposed visits"),
    assignments: t("plan.review.assignments", "Assignments"),
    manual: t("plan.review.manual", "manual"),
    auto: t("plan.review.auto", "automatic"),
    packageLabel: t("plan.bulk.package", "Inspection checklists (optional — zero or more)"),
    packageHint: t("plan.review.packageHint", "No checklist selected — that is allowed. The inspector chooses an eligible checklist during preparation."),
    packageNone: t("plan.review.packageNone", "No checklist — chosen during preparation"),
    packageCount: t("plan.review.packageCount", "{n} checklist(s)"),
    priorityLabel: t("plan.review.priority", "Priority"),
    priorityNone: t("plan.review.priorityNone", "None (default)"),
    notBulkYet: t("plan.review.notBulkYet", "not yet available for bulk"),
    droppedH: t("plan.review.droppedH", "{n} row(s) were excluded at the authoritative publish re-check"),
    droppedD: t("plan.review.droppedD", "These rows became ineligible between the last check and the commit. They were NOT published; everything else committed atomically."),
    visitType: t("plan.bulk.visitType", "Visit type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    mode: t("plan.review.mode", "Mode"),
    physical: t("enum.physical", "Physical"),
    window: t("plan.bulk.window", "Window"),
    scope: t("plan.review.scope", "Scope"),

    configTitle: t("plan.review.configTitle", "Visit configuration (applied to every visit — M01-006/026)"),
    windowStart: t("plan.bulk.windowStart", "Window start"),
    windowEnd: t("plan.bulk.windowEnd", "Window end"),
    notes: t("plan.bulk.notes", "Notes (optional, applied to every visit in this plan)"),
    notesPlaceholder: t("plan.bulk.notesPlaceholder", "Anything inspectors or reviewers should know before these visits…"),

    readiness: t("plan.review.readiness", "Readiness"),
    blockedTag: t("plan.review.blockedTag", "Blocked"),
    readyTag: t("plan.review.readyTag", "Ready"),
    blockersN: t("plan.review.blockersN", "{n} items must be resolved before publishing"),
    clearAll: t("plan.review.clearAll", "All checks pass — the plan is ready to publish"),

    targetsH: t("plan.review.targetsH", "Targets & proposed visits"),
    selectedLabel: t("plan.review.selectedLabel", "selected"),
    retainedLabel: t("plan.review.retainedLabel", "retained"),
    colFactory: t("plan.bulk.colFactory", "Factory"),
    colCity: t("plan.review.colCity", "City"),
    colRisk: t("plan.bulk.colRisk", "Risk"),
    colVisit: t("plan.review.colVisit", "Proposed visit"),
    colAssign: t("plan.review.colAssign", "Assignment & evidence"),
    riskHigh: t("enum.high", "High"),
    riskMedium: t("enum.medium", "Medium"),
    riskLow: t("enum.low", "Low"),
    autoLabel: t("plan.review.autoLabel", "Automatic — chosen at publish"),
    autoNote: t("plan.review.autoNote", "First eligible Inspector available in the window, decided by the server at publish. Not promised beforehand."),
    excludedLozenge: t("plan.review.excluded", "Duplicate — excluded"),
    chooseInspector: t("plan.bulk.colInspector", "Inspector (M01-029)"),
    assignH: t("plan.review.assignH", "Assignment evidence"),
    manualNamed: t("plan.review.manualNamed", "Manual — named now"),
    autoChosen: t("plan.review.autoChosen", "Automatic — chosen at publish"),
    manualEvidenceNote: t("plan.review.manualEvidenceNote", "Named Inspectors are fixed into the plan. Overlaps in the window are flagged above and block publishing."),
    splitLine: t("plan.review.splitLine", "{manual} manual · {auto} automatic"),

    ledgerH: t("plan.review.ledgerH", "Publish consequence ledger"),
    ledgerLead: t("plan.review.ledgerLead", "Exactly what crossing the publish boundary will and will not do, bound to the current retained scope."),
    gCreate: t("plan.review.gCreate", "Will be created on successful commit"),
    gRef: t("plan.review.gRef", "Will be referenced for those visits"),
    gRecord: t("plan.review.gRecord", "Will be recorded or queued"),
    gNot: t("plan.review.gNot", "Will not happen at publication"),
    cPlan: t("plan.review.cPlan", "1 visit plan"),
    cPlanD: t("plan.review.cPlanD", "A single plan grouping every retained visit under one plan ID."),
    cVisits: t("plan.review.cVisits", "{n} visits"),
    cVisitsD: t("plan.review.cVisitsD", "One physical periodic-compliance visit per retained factory."),
    cAssign: t("plan.review.cAssign", "{n} assignments"),
    cAssignD: t("plan.review.cAssignD", "One Inspector assignment per visit."),
    rType: t("plan.review.rType", "Periodic compliance · Physical"),
    rTypeD: t("plan.review.rTypeD", "Visit type and execution mode applied to every visit."),
    rWin: t("plan.review.rWin", "Shared inspection window"),
    rWinD: t("plan.review.rWinD", "The single window every visit in this campaign shares."),
    rMethod: t("plan.review.rMethod", "{manual} manual · {auto} automatic assignees"),
    rMethodD: t("plan.review.rMethodD", "Manual Inspectors are named now; automatic Inspectors are chosen server-side at publish."),
    recAudit: t("plan.review.recAudit", "Audit mutations recorded"),
    recAuditD: t("plan.review.recAuditD", "Plan, visit and assignment inserts are captured by the append-only table triggers with actor and timestamp (FND-003)."),
    recNotif: t("plan.review.recNotif", "{n} assignment notification records queued"),
    recNotifD: t("plan.review.recNotifD", "Queued for sending only — created inside the transaction. Delivery, receipt and acceptance are not proven here (FND-004)."),
    notStart: t("plan.review.notStart", "No inspection starts"),
    notStartD: t("plan.review.notStartD", "Publishing schedules visits; it does not begin any inspection."),
    notDeliver: t("plan.review.notDeliver", "No message is delivered or accepted"),
    notDeliverD: t("plan.review.notDeliverD", "Notification rows are queued; provider delivery and Inspector acceptance are separate, unproven events."),
    notDrop: t("plan.review.notDrop", "No factory is silently dropped"),
    notDropD: t("plan.review.notDropD", "Excluded factories are named explicitly; excluded scope never disappears."),
    notPartial: t("plan.review.notPartial", "No partial result is called success"),
    notPartialD: t("plan.review.notPartialD", "All-or-nothing: any guard or write failure rolls the whole transaction back."),
    notFinal: t("plan.review.notFinal", "A committable retained scope is not final yet — resolve the blockers to lock the counts."),

    correctH: t("plan.review.correctH", "Corrections & publish"),
    backConfig: t("plan.review.backConfig", "Back to targeting & assignment"),
    backConfigD: t("plan.review.backConfigD", "Return to targeting with this selection preserved."),
    willRecheck: t("plan.review.willRecheck", "On publish the server re-checks role, inspection checklist status, duplicates, Inspector eligibility and assignment overlap inside one transaction, then commits all-or-nothing."),
    disabledPrefix: t("plan.review.disabledPrefix", "Disabled: "),
    allClear: t("plan.review.allClearNote", "All checks pass — the server will commit all-or-nothing."),
    removeExcluded: t("plan.review.removeExcluded", "Remove excluded factories"),
    publishReady: t("plan.review.publishReady", "Publish plan and create {n} visits"),
    publishBlocked: t("plan.review.publishBlocked", "Publish blocked — resolve {n} items"),
    publishing: t("plan.bulk.publishing", "Publishing…"),
    checking: t("plan.review.checking", "Checking readiness…"),
    fix: t("plan.review.fix", "Fix"),
    change: t("plan.review.change", "Change"),
    review: t("plan.review.reviewAction", "Review"),
    remove: t("plan.review.remove", "Remove"),
    skipToPublish: t("plan.review.skip", "Skip to publish action"),

    publishingTitle: t("plan.review.publishingTitle", "Publishing…"),
    publishingBody: t("plan.review.publishingBody", "The server is validating and committing the plan, its visits and assignments in one transaction. Do not close this page."),
    publishingSub: t("plan.review.publishingSub", "‘Published’ is not shown until the transaction returns an authoritative result."),
    failTitle: t("plan.review.failTitle", "Publishing failed — nothing was published"),
    failBody: t("plan.review.failBody", "Nothing was published. The plan and visits were not created."),
    failSub: t("plan.review.failSub", "Technical details are logged server-side only."),
    tryAgain: t("plan.review.tryAgain", "Try again"),
    successTitle: t("plan.review.successTitle", "Plan published"),
    successBody: t("plan.review.successBody", "The authoritative transaction committed in full."),
    successSub: t("plan.review.successSub", "Notifications are queued for sending only — no delivery, acceptance or inspection start. Zero completed visits and zero drafts at this moment."),
    sPlan: t("plan.review.sPlan", "Plan"),
    sVisits: t("plan.review.sVisits", "Visits published"),
    sAssign: t("plan.review.sAssign", "Assignments"),
    sNotif: t("plan.review.sNotif", "Notifications queued"),
    goVisits: t("plan.review.goVisits", "Go to visits"),
    openPlan: t("plan.review.openPlan", "Open the published plan (read-only)"),

    // M6 — eligibility partition + acknowledgement + persisted drafts
    eligH: t("plan.review.elig.h", "Eligibility"),
    eligTotal: t("plan.review.elig.total", "Total selected"),
    eligEligible: t("plan.review.elig.eligible", "Eligible"),
    eligIneligible: t("plan.review.elig.ineligible", "Ineligible"),
    eligToCreate: t("plan.review.elig.toCreate", "To create"),
    eligMissingLoc: t("plan.review.elig.missingLoc", "Missing location"),
    eligConflicts: t("plan.review.elig.conflicts", "Active conflicts"),
    eligManualOverride: t("plan.review.elig.manualOverride", "Manual override required"),
    reasonDup: t("plan.review.elig.reasonDup", "duplicate — active visit (M02-012)"),
    reasonScope: t("plan.review.elig.reasonScope", "out of scope"),
    reasonLocation: t("plan.review.elig.reasonLocation", "missing official location"),
    reasonInspector: t("plan.review.elig.reasonInspector", "inspector conflict"),
    ackRequired: t("plan.review.elig.ackRequired", "{n} selected row(s) are ineligible. Acknowledge below to proceed with the eligible subset only, or go back and adjust the selection."),
    ackLabel: t("plan.review.elig.ackLabel", "Proceed with the {n} eligible factories only — ineligible rows are named above and will not be published."),
    saveDraft: t("plan.review.saveDraft", "Save draft"),
    savingDraft: t("plan.review.savingDraft", "Saving draft…"),
    draftSaved: t("plan.review.draftSaved", "Draft saved · {ref} (v{n})"),
    draftSaveFailed: t("plan.review.draftSaveFailed", "The draft could not be saved. Your working state is unchanged — you can retry or continue without saving."),
    draftBanner: t("plan.review.draftBanner", "Resumed from draft {ref} — saved working state; readiness is re-checked live."),
    draftUnavailable: t("plan.review.draftUnavailable", "The referenced draft could not be loaded — it may have been published, archived or created by someone else. Falling back to the browser-held selection."),
    discardDraft: t("plan.review.discardDraft", "Discard draft"),

    // CD-024 — Assignment Evidence Ledger + per-row evidence cells
    evTitle: t("plan.review.ev.title", "Assignment evidence ledger"),
    evLead: t("plan.review.ev.lead", "Focus a factory row (or choose “Review evidence”) to see exactly what is verified, what is not evaluated, what blocks the assignment, and what is checked again just before publishing — for that candidate only. No score, rank or confidence is shown."),
    evReview: t("plan.review.ev.review", "Review evidence"),
    ecInPool: t("plan.review.ec.inPool", "in pool"),
    ecOverlaps: t("plan.review.ec.overlaps", "{n} overlaps in window"),
    ecSkills: t("plan.review.ec.skills", "skills/capacity: not evaluated"),
    ecAuto: t("plan.review.ec.auto", "automatic — overlap not re-checked for auto (known gap)"),
    ecBlockedN: t("plan.review.ec.blockedN", "booked on {n} overlapping visit(s)"),
    ecFail: t("plan.review.ec.fail", "overlap check unavailable — blocked, not “no conflict”"),
    ecSetWindow: t("plan.review.ec.setWindow", "set an inspection window to check overlap"),
    ev: {
      noneTitle: t("plan.review.ev.noneTitle", "No candidate in focus"),
      noneBody: t("plan.review.ev.noneBody", "Nothing for this candidate yet. Focus a factory row or choose “Review evidence” to reflect its facts here. Blocked picks are shown on their own ledger with the exact visit and time."),
      cVerified: t("plan.review.ev.cVerified", "Verified now"),
      cNotEval: t("plan.review.ev.cNotEval", "Not evaluated"),
      cBlocks: t("plan.review.ev.cBlocks", "Blocks assignment"),
      cChecked: t("plan.review.ev.cChecked", "Checked again before publish"),
      vRole: t("plan.review.ev.vRole", "Holds the Inspector role (in the eligible pool)"),
      vOverlap0: t("plan.review.ev.vOverlap0", "No overlapping active visit in the window (overlap query ran)"),
      vPkg: t("plan.review.ev.vPkg", "Inspection checklist is currently active or locked"),
      neList: t("plan.review.ev.neList", "Skills · work hours · capacity · territory · proximity · travel time — no Saqeel source, not evaluated"),
      neAuto: t("plan.review.ev.neAuto", "Automatic pick — the server’s Inspector is chosen at publish and its window overlap is NOT checked for auto (known gap)"),
      neWindow: t("plan.review.ev.neWindow", "Overlap not evaluated — set a valid inspection window first"),
      bOverlap: t("plan.review.ev.bOverlap", "Already booked on {n} overlapping visit(s) — e.g. {label}, {window}"),
      bNotPool: t("plan.review.ev.bNotPool", "Not in the eligible Inspector pool"),
      bFail: t("plan.review.ev.bFail", "Overlap check could not run — publishing is blocked (not “no conflict”)"),
      bNone: t("plan.review.ev.bNone", "Nothing blocks this candidate right now"),
      checked: t("plan.review.ev.checked", "Eligibility, double-booking and active visits are re-checked just before the plan is written. A change landing between that check and the write is not caught — the atomic publish itself re-validates nothing."),
      focusedFor: t("plan.review.ev.focusedFor", "Assignment evidence for {name} ({code})"),
    },

    bl: {
      duplicate: { title: t("plan.review.bl.dup.t", "Active periodic visit already exists — cannot create a duplicate"), detail: t("plan.review.bl.dup.d", "{targets}") },
      overlap: { title: t("plan.review.bl.ov.t", "Inspector is already booked in this window"), detail: t("plan.review.bl.ov.d", "{targets}") },
      coverage: { title: t("plan.review.bl.cov.t", "{n} visits have no eligible Inspector available in the window"), detail: t("plan.review.bl.cov.d", "Widen the window or assign an Inspector manually.") },
      capacity: { title: t("plan.review.bl.cap.t", "No day in the window has remaining daily capacity for the assigned Inspector"), detail: t("plan.review.bl.cap.d", "{targets}") },
      nopackage: { title: t("plan.review.bl.nopkg.t", "No inspection checklist selected"), detail: t("plan.review.bl.nopkg.d", "Allowed (PLN-CON-003): the inspector chooses an eligible checklist during preparation. Publishing proceeds without one.") },
      packageInvalid: { title: t("plan.review.bl.pkginv.t", "Selected inspection checklist is no longer active at the authoritative check"), detail: t("plan.review.bl.pkginv.d", "Revalidate and choose a currently active version before publishing.") },
      nopool: { title: t("plan.review.bl.nopool.t", "No Inspector exists in the Inspector role pool"), detail: t("plan.review.bl.nopool.d", "Automatic assignment cannot be derived — a legitimate empty pool, not a source failure.") },
      configMissing: { title: t("plan.review.bl.cfg.t", "Mandatory configuration is missing"), detail: t("plan.review.bl.cfg.d", "Set the visit type, a valid window (end after start) and an inspection checklist.") },
      windowImplausible: { title: t("plan.review.bl.win.t", "Visit window date looks like a data-entry error"), detail: t("plan.review.bl.win.d", "Check for a mistyped year — the date is outside the plausible range (DEF-DATA-005).") },
      srcFactory: { title: t("plan.review.bl.srcf.t", "Factory/target source could not be verified"), detail: t("plan.review.bl.srcf.d", "Not evaluated — blocks safely rather than showing false emptiness.") },
      srcPackage: { title: t("plan.review.bl.srcp.t", "Inspection checklist source is unavailable"), detail: t("plan.review.bl.srcp.d", "Distinct from ‘no inspection checklist’ — the state is not evaluated, not empty.") },
      srcInspector: { title: t("plan.review.bl.srci.t", "Inspector source is unavailable"), detail: t("plan.review.bl.srci.d", "Distinct from ‘empty pool’ — an empty pool cannot be confirmed.") },
      srcDuplicate: { title: t("plan.review.bl.srcd.t", "Duplicate / overlap check could not run"), detail: t("plan.review.bl.srcd.d", "Distinct from ‘verified zero conflicts’ — publish is not allowed without the check.") },
    },
  };

  return (
    <Shell current="/planning" title={t("plan.review.title", "Plan review & publish")}
      context={<span className="badge badge-info">{t("plan.review.context", "SCR-WEB-150 · review · publish")}</span>}>
      <ReviewClient strings={strings} initialDraft={initialDraft} draftUnavailable={draftUnavailable} locale={locale} />
    </Shell>
  );
}
