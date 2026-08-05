import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { resolvePortalState } from "@/lib/portal/self-assessment";
import { CreateRequest } from "./CreateRequest";
import { ReviewAction } from "./ReviewAction";

const MODES = ["off", "on"] as const;

const requestLabels = {
  visit: "Visit request",
  correction: "Correction request",
  objection: "Objection request",
} as const;

function statusClass(status: string) {
  if (status === "accepted") return "badge badge-compliant";
  if (status === "rejected") return "badge badge-critical";
  if (status === "returned") return "badge badge-warning";
  if (status === "in_review" || status === "submitted") return "badge badge-pending";
  return "badge badge-draft";
}

export default async function PortalPage({ searchParams }: {
  searchParams: Promise<{ tab?: string; type?: string; view?: string }>;
}) {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_EXTERNAL_PORTAL, MODES, "off") !== "on") {
    return (
      <Shell current="/portal" title={t("portal.title", "External portal")}>
        <NotYetBoundary title={t("portal.title", "External portal")} consequence={t("portal.off", "The external factory portal is not switched on here.")}
          seam={t("portal.offSeam", "Waiting on: the portal being switched on, and an agreed way to identify external representatives.")} notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }

  const state = resolvePortalState(await searchParams);
  const sb = await supabaseServer();
  const requestQuery = state.tab === "requests"
    ? sb.from("external_requests").select("id, request_type, status, subject, decision_reason, created_at").eq("request_type", state.type).order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });
  const assessmentQuery = state.tab === "self-assessment"
    ? sb.from("self_assessments").select("id, status, risk_signal_emitted, review_reason, created_at").order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });
  const [{ data: reqs, error: requestError }, { data: assessments, error: assessmentError }, { data: factory }] = await Promise.all([
    requestQuery,
    assessmentQuery,
    sb.from("factories").select("id").limit(1).maybeSingle(),
  ]);
  const error = requestError || assessmentError;

  const reviewStrings = {
    start: t("portal.review.start", "Start review"),
    decision: t("portal.review.decision", "Decision"),
    reason: t("portal.review.reason", "Reason"),
    apply: t("portal.review.apply", "Apply decision"),
    applying: t("portal.review.applying", "Applying…"),
    saved: t("portal.review.saved", "Decision saved"),
  };

  return (
    <Shell current="/portal" title={t("portal.title", "External portal")}>
      <div className="stack">
        <div className="alert alert-warning">
          <div><div className="alert-title">{t("portal.banner.title", "Internal compliance view")}</div>
            {t("portal.banner.body", "External representative identity and MFA remain held. This surface supports internal intake and review only; no external session is authorized.")}
          </div>
        </div>

        <nav className="tabs" aria-label={t("portal.tabs", "External request areas")}>
          <a className={`tab ${state.tab === "establishments" ? "is-active" : ""}`} aria-selected={state.tab === "establishments"} href="/portal?tab=establishments">{t("portal.establishments", "Establishments")}</a>
          <a className={`tab ${state.tab === "requests" && !state.review ? "is-active" : ""}`} aria-selected={state.tab === "requests" && !state.review} href="/portal?tab=requests&type=visit">{t("portal.requests", "Requests")}</a>
          <a className={`tab ${state.tab === "self-assessment" && !state.review ? "is-active" : ""}`} aria-selected={state.tab === "self-assessment" && !state.review} href="/portal?tab=self-assessment">{t("portal.selfAssessment", "Self-assessment")}</a>
          <a className={`tab ${state.review ? "is-active" : ""}`} aria-selected={state.review} href="/portal?tab=requests&type=visit&view=review">{t("portal.review", "Review")}</a>
        </nav>

        {state.tab === "establishments" && (
          <div className="panel"><div className="panel-header"><h2 className="panel-title">{t("portal.establishments", "Establishments and eligible services")}</h2><span className="badge badge-onhold">{t("portal.notConfigured", "Not configured")}</span></div>
            <div className="panel-body"><div className="alert alert-info"><div><div className="alert-title">{t("portal.decisionRequired", "Decision required")}</div>{t("portal.eligibilityHeld", "External representative identity, establishment links, and service eligibility rules are not configured. No eligibility is inferred.")}</div></div></div>
          </div>
        )}

        {state.tab === "requests" && (
          <>
            <div className="row">
              {(["visit", "correction", "objection"] as const).map((type) => <a key={type} className={`btn ${state.type === type ? "btn-primary" : "btn-secondary"}`} href={`/portal?tab=requests&type=${type}${state.review ? "&view=review" : ""}`}>{requestLabels[type]}</a>)}
            </div>
            <div className="panel"><div className="panel-header"><h2 className="panel-title">{requestLabels[state.type]} {state.review ? t("portal.review", "review") : t("portal.intake", "internal intake")}</h2><span className="badge badge-warning">{state.review ? t("portal.decisionRequired", "Decision required") : t("portal.externalHeld", "External access held")}</span></div>
              <div className="panel-body"><p className="t-caption">{state.review ? t("portal.reviewScope", "Only the records you are allowed to review are shown.") : t("portal.intakeScope", "This internal intake does not authorize an external representative or infer eligibility.")}</p></div>
            </div>
            {!state.review && <CreateRequest factoryId={factory?.id ?? null} requestType={state.type} strings={{
              type: t("portal.type", "Request type"), subject: t("portal.subject", "Subject"), create: t("portal.create", "Create internal intake"), creating: t("portal.creating", "Creating…"), created: t("portal.created", "Request created"), noFactory: t("portal.noFactory", "No factory in scope."),
            }} />}
            {error && <div className="alert alert-critical" role="alert"><div><div className="alert-title">{t("portal.error", "Couldn’t load portal data")}</div>{t("portal.errorSafe", "Nothing changed. Access or review scope is required.")}</div></div>}
            {!error && (reqs ?? []).length === 0 && <div className="empty"><div className="empty-title">{t("portal.empty.title", "No requests in scope")}</div><p>{t("portal.empty.body", "There is no matching request you can see.")}</p></div>}
            {(reqs ?? []).map((request) => <div key={request.id} className="panel"><div className="panel-header"><h3 className="panel-title">{request.subject || request.request_type}</h3><span className={statusClass(request.status)}>{request.status}</span></div>
              <div className="panel-body stack"><p className="t-caption">{new Date(request.created_at).toLocaleString()}</p>{request.decision_reason && <div className="alert alert-info">{request.decision_reason}</div>}{state.review && !["accepted", "rejected", "withdrawn"].includes(request.status) && <ReviewAction id={request.id} kind="request" status={request.status} strings={reviewStrings} />}</div></div>)}
          </>
        )}

        {state.tab === "self-assessment" && (
          <>
            <div className="panel"><div className="panel-header"><h2 className="panel-title">{state.review ? t("portal.selfReview", "Self-assessment review") : t("portal.selfAssessment", "Self-assessment")}</h2><span className="badge badge-onhold">{state.review ? t("portal.decisionRequired", "Decision required") : t("portal.externalHeld", "External access held")}</span></div>
              <div className="panel-body"><div className="alert alert-info"><div><div className="alert-title">{state.review ? t("portal.reviewScope", "Scoped internal review") : t("portal.notConfigured", "Not configured")}</div>{state.review ? t("portal.reviewScopeBody", "Only the submitted assessments you are allowed to review are shown.") : t("portal.selfHeld", "Assessment availability, required answers, scoring, and external evidence rules are not configured. No submission is fabricated.")}</div></div></div>
            </div>
            {error && <div className="alert alert-critical" role="alert">{t("portal.errorSafe", "Nothing changed. Access or review scope is required.")}</div>}
            {!error && (assessments ?? []).length === 0 && <div className="empty"><div className="empty-title">{t("portal.selfEmpty", "No self-assessments in scope")}</div><p>{t("portal.empty.body", "No matching submission is available in your scope.")}</p></div>}
            {(assessments ?? []).map((assessment) => <div key={assessment.id} className="panel"><div className="panel-header"><h3 className="panel-title">{t("portal.selfAssessment", "Self-assessment")}</h3><span className={statusClass(assessment.status)}>{assessment.status}</span></div>
              <div className="panel-body stack"><p className="t-caption">{new Date(assessment.created_at).toLocaleString()}</p>{assessment.review_reason && <div className="alert alert-info">{assessment.review_reason}</div>}{state.review && assessment.status === "submitted" && <ReviewAction id={assessment.id} kind="self-assessment" status={assessment.status} strings={reviewStrings} />}</div></div>)}
          </>
        )}
      </div>
    </Shell>
  );
}
