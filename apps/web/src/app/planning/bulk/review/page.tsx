import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ReviewClient, { type ReviewStrings } from "./ReviewClient";

export const dynamic = "force-dynamic";

// CD-021 P02 review step (SCR-WEB-120). Configuration + manual assignment
// relocated here from the SCR-WEB-110 targeting screen (approved:
// governance/HUMAN_APPROVALS.yaml gate CD-021-P02-relocation-approval).
export default async function BulkReview() {
  const { t } = await useT();

  // RBAC-007 — same Planner-only gate as the targeting screen (SCR-WEB-110);
  // this route only ever receives a client-held selection from that screen,
  // but it must independently refuse to render for any other role too.
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await sb.auth.getUser();
  const { data: myRoles, error: rolesError } = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  if (authError || rolesError) {
    console.error("[CD-021 bulk review authorization]", authError?.message ?? rolesError?.message);
    return (
      <Shell current="/planning" title={t("plan.bulk.review.title", "Bulk planning — review & publish")}>
        <div className="ax-banner ax-banner--critical" role="alert">{t("plan.bulk.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Try again.")}</div>
      </Shell>
    );
  }
  const isPlanner = (myRoles ?? []).some(r => r.role_key === "planner");
  if (!isPlanner) {
    return (
      <Shell current="/planning" title={t("plan.bulk.review.title", "Bulk planning — review & publish")}>
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">⛔</span>
          <h4>{t("plan.bulk.unauthorized.title", "Authorized role required")}</h4>
          <p className="ax-caption">{t("plan.bulk.unauthorized.body", "Bulk targeting (SCR-WEB-110) is available to the Planner role only.")}</p>
        </div></div>
      </Shell>
    );
  }

  const strings: ReviewStrings = {
    loading: t("plan.bulk.review.loading", "Loading your selection…"),
    unavailable: t("plan.bulk.review.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Return to targeting and try again."),
    emptyTitle: t("plan.bulk.review.emptyTitle", "No factories selected"),
    emptyBody: t("plan.bulk.review.emptyBody", "Select target factories on the targeting screen, then continue to review."),
    backToTargeting: t("plan.bulk.review.back", "Back to targeting"),
    configTitle: t("plan.bulk.review.configTitle", "Visit configuration (applied to every visit — M01-006/026)"),
    visitType: t("plan.bulk.visitType", "Visit type (shared — M01-006)"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    packageLabel: t("plan.bulk.package", "Package"),
    windowStart: t("plan.bulk.windowStart", "Window start"),
    windowEnd: t("plan.bulk.windowEnd", "Window end"),
    notes: t("plan.bulk.notes", "Notes (optional, applied to every visit in this plan)"),
    notesPlaceholder: t("plan.bulk.notesPlaceholder", "Anything inspectors or reviewers should know before these visits…"),
    assignTitle: t("plan.bulk.review.assignTitle", "Inspector assignment (M01-029) — leave on Auto for round-robin"),
    colFactory: t("plan.bulk.colFactory", "Factory"),
    colRisk: t("plan.bulk.colRisk", "Risk"),
    colInspector: t("plan.bulk.colInspector", "Inspector (M01-029)"),
    autoAssign: t("plan.bulk.autoAssign", "Auto (round-robin)"),
    duplicate: t("plan.bulk.duplicate", "duplicate — active visit (M02-012)"),
    doubleBooked: t("plan.bulk.review.doubleBooked", "also on {n} other visits in this window"),
    skipDuplicates: t("plan.bulk.skipDuplicates", "Skip conflicting factories at publish instead of blocking"),
    summaryTitle: t("plan.bulk.summaryTitle", "Campaign summary"),
    summarySelected: t("plan.bulk.summarySelected", "Selected factories"),
    summaryManual: t("plan.bulk.review.summaryManual", "Manual"),
    summaryAuto: t("plan.bulk.review.summaryAuto", "Auto"),
    blockedTitle: t("plan.bulk.blocked", "Publish blocked (all-or-nothing — P03)"),
    publish: t("plan.bulk.publish", "Publish plan — every visit gets its own ID sharing the plan ID (M01-002)"),
    publishing: t("plan.bulk.publishing", "Publishing…"),
    riskBands: { high: t("enum.high", "high"), medium: t("enum.medium", "medium"), low: t("enum.low", "low") },
  };
  return (
    <Shell current="/planning" title={t("plan.bulk.review.title", "Bulk planning — review & publish")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.bulk.review.context", "SCR-WEB-120 · configure · assign · publish")}</span>}>
      <ReviewClient strings={strings} />
    </Shell>
  );
}
