import Link from "next/link";
import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ActionForm from "@/app/(app)/admin/compliance-requests/ActionForm";
import {
  decideComplianceRequestComponent,
  publishComplianceRequest,
  rejectComplianceRequest,
  returnComplianceRequest,
} from "@/app/(app)/admin/compliance-requests/actions";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  request_number: string;
  title: string;
  request_type: string;
  owner_id: string;
  submitted_at: string | null;
  current_revision: number;
  status: string;
  correlation_id: string;
  audit_references: unknown;
  publication_audit_reference: number | null;
};

type ComponentRow = {
  id: string;
  request_id: string;
  revision_number: number;
  entity_kind: string;
  component_status: string;
  target_entity_id: string | null;
  current_value_snapshot: Record<string, unknown> | null;
  proposed_value_snapshot: Record<string, unknown>;
  component_comments: string | null;
  decision_comments: string | null;
  decided_by: string | null;
  decided_at: string | null;
};

type DependencyRow = {
  parent_component_id: string;
  child_component_id: string;
};

type DecisionRow = {
  id: string;
  component_id: string | null;
  decision: string;
  comments: string | null;
  decided_by: string;
  decided_at: string;
};

type PublicationRow = {
  id: string;
  component_id: string;
  version_id: string;
  published_at: string;
};

const DECIDED_STATUSES = new Set(["approved", "rejected", "auto_rejected", "published"]);
const STEPS = ["overview", "regulation", "inspection_item", "violation", "penalty", "summary"] as const;

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function changedFields(component: ComponentRow) {
  const current = component.current_value_snapshot ?? {};
  const proposed = component.proposed_value_snapshot ?? {};
  return Array.from(new Set([...Object.keys(current), ...Object.keys(proposed)])).map(field => ({
    field,
    current: current[field],
    proposed: proposed[field],
    changed: JSON.stringify(current[field]) !== JSON.stringify(proposed[field]),
  }));
}

function statusClass(status: string) {
  if (status === "approved" || status === "published") return "badge badge-completed";
  if (status === "rejected" || status === "auto_rejected") return "badge badge-critical";
  if (status === "returned") return "badge badge-warning";
  return "badge badge-pending badge-warning";
}

export default async function ApprovalQueue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = await supabaseServer();
  const [{ locale, t }, sp, userRead] = await Promise.all([useT(), searchParams, getServerUser()]);
  const user = userRead.data.user;
  const current = sp.__shellRoute === "/admin/compliance-approvals"
    ? "/admin/compliance-approvals"
    : "/compliance/approvals";

  const [requestRead, roleRead] = user
    ? await Promise.all([
        sb.from("compliance_configuration_requests")
          .select("id,request_number,title,request_type,owner_id,submitted_at,current_revision,status,correlation_id,audit_references,publication_audit_reference")
          .in("status", ["pending_review", "partially_approved", "approved"])
          .order("submitted_at", { ascending: true }),
        sb.from("user_roles").select("role_key").eq("user_id", user.id),
      ])
    : [{ data: [], error: userRead.error ?? new Error("approval_queue_unauthorized") }, { data: [], error: null }];

  const scopedRows = (requestRead.data ?? []) as RequestRow[];
  const rows = user ? scopedRows.filter(row => row.owner_id !== user.id) : [];
  const requestIds = rows.map(row => row.id);
  const componentRead = requestIds.length
    ? await sb.from("compliance_request_components")
        .select("id,request_id,revision_number,entity_kind,component_status,target_entity_id,current_value_snapshot,proposed_value_snapshot,component_comments,decision_comments,decided_by,decided_at")
        .in("request_id", requestIds)
    : { data: [], error: null };
  const components = (componentRead.data ?? []) as ComponentRow[];

  const requestedId = typeof sp.request === "string" ? sp.request : null;
  const selectedRequest = rows.find(row => row.id === requestedId) ?? rows[0] ?? null;
  const selectedComponents = selectedRequest
    ? components.filter(component =>
        component.request_id === selectedRequest.id
        && component.revision_number === selectedRequest.current_revision)
    : [];

  const [dependencyRead, decisionRead, publicationRead] = selectedRequest
    ? await Promise.all([
        sb.from("compliance_request_component_dependencies")
          .select("parent_component_id,child_component_id")
          .eq("request_id", selectedRequest.id)
          .eq("revision_number", selectedRequest.current_revision),
        sb.from("compliance_request_decisions")
          .select("id,component_id,decision,comments,decided_by,decided_at")
          .eq("request_id", selectedRequest.id)
          .eq("revision_number", selectedRequest.current_revision)
          .order("decided_at", { ascending: false }),
        sb.from("compliance_request_publications")
          .select("id,component_id,version_id,published_at")
          .eq("request_id", selectedRequest.id)
          .eq("revision_number", selectedRequest.current_revision)
          .order("published_at", { ascending: false }),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  const dependencies = (dependencyRead.data ?? []) as DependencyRow[];
  const decisions = (decisionRead.data ?? []) as DecisionRow[];
  const publications = (publicationRead.data ?? []) as PublicationRow[];
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const canReview = !!user
    && !!selectedRequest
    && selectedRequest.owner_id !== user.id
    && (roles.has("compliance_admin") || roles.has("reviewer"));
  const readError = requestRead.error ?? roleRead.error ?? componentRead.error;
  const selectedReadError = dependencyRead.error ?? decisionRead.error ?? publicationRead.error;
  const allDecided = selectedComponents.length > 0
    && selectedComponents.every(component => DECIDED_STATUSES.has(component.component_status));
  const publishable = canReview
    && !readError
    && !selectedReadError
    && allDecided
    && !!selectedRequest
    && ["approved", "partially_approved"].includes(selectedRequest.status);
  const packageReviewable = canReview
    && !readError
    && !selectedReadError
    && !!selectedRequest
    && ["pending_review", "partially_approved"].includes(selectedRequest.status);
  const correlationId = readError ? crypto.randomUUID() : null;

  if (readError) {
    console.error(`[compliance-approval-queue:${correlationId}]`, readError.message);
  }

  const label = (value: string) => value
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const selectedById = new Map(selectedComponents.map(component => [component.id, component]));

  return (
    <Shell current={current} title={t("approval.queue.title", "Approval Queue")}>
      <main className="sq-content" data-saqeel-screen="APQ-S01" data-screen-id="APQ-S01">
        <div className="row">
          <span className="badge badge-info">{t("approval.queue.configuration", "Compliance configuration")}</span>
          <span className="badge badge-warning">{t("approval.queue.makerChecker", "Maker-checker enforced")}</span>
          <span className="badge badge-pending">{rows.length} {t("approval.queue.inScope", "in scope")}</span>
        </div>

        <div className="alert alert-warning" role="note">
          <div>
            <strong>{t("approval.queue.scoringHold", "CR-471/472 remain Not configured.")}</strong>
            <p>{t("approval.queue.scoringHoldBody", "Item scoring and score-exclusion objects are rejected by the governed request contract.")}</p>
          </div>
        </div>

        {!user ? (
          <section className="panel" role="alert">
            <div className="panel-header">
              <h2 className="panel-title">{t("approval.queue.unauthorized", "Approval Queue access denied")}</h2>
              <span className="badge badge-critical">{t("common.unauthorized", "Unauthorized")}</span>
            </div>
            <div className="panel-body">
              <p>{t("approval.queue.unauthorizedBody", "Sign in with a governed reviewer role. No queue data or action controls are exposed.")}</p>
            </div>
          </section>
        ) : readError ? (
          <section className="panel" role="alert">
            <div className="panel-header">
              <h2 className="panel-title">{t("approval.queue.unavailable", "Approval Queue unavailable")}</h2>
              <span className="badge badge-critical">{t("common.error", "Error")}</span>
            </div>
            <div className="panel-body stack">
              <p>{t("approval.queue.unavailableBody", "No workload, eligibility or decision state has been inferred.")}</p>
              <p className="id-code">{correlationId}</p>
              <Link className="btn btn-secondary" href="/compliance/approvals">{t("common.retry", "Retry")}</Link>
            </div>
          </section>
        ) : (
          <>
            <ol className="steps" aria-label={t("approval.queue.sequence", "Review sequence")}>
              {STEPS.map((step, index) => {
                const relevant = step === "overview" || step === "summary"
                  ? selectedComponents
                  : selectedComponents.filter(component => component.entity_kind === step);
                const done = relevant.filter(component => DECIDED_STATUSES.has(component.component_status)).length;
                const isDone = step === "overview" || (relevant.length > 0 && done === relevant.length);
                const isCurrent = step === "overview";
                return (
                  <li className={`step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`} key={step}>
                    <span className="step-dot">{index + 1}</span>
                    <span>{label(step)} · {step === "overview"
                      ? t("approval.queue.read", "Read")
                      : `${done}/${relevant.length}`}</span>
                    {index < STEPS.length - 1 ? <span className="step-line" aria-hidden="true" /> : null}
                  </li>
                );
              })}
            </ol>

            <div className="sq-grid-2">
              <section className="panel" aria-labelledby="approval-request-list">
                <div className="panel-header">
                  <h2 className="panel-title" id="approval-request-list">{t("approval.queue.requests", "Requests")}</h2>
                  <span className="badge badge-pending">{rows.length}</span>
                </div>
                <div className="panel-body stack">
                  {rows.map(row => {
                    const currentComponents = components.filter(component =>
                      component.request_id === row.id
                      && component.revision_number === row.current_revision);
                    const decided = currentComponents.filter(component =>
                      DECIDED_STATUSES.has(component.component_status)).length;
                    const selected = row.id === selectedRequest?.id;
                    return (
                      <article className="panel" key={row.id}>
                        <div className="panel-header">
                          <span className="id-code">{row.request_number}</span>
                          <span className={statusClass(row.status)}>{label(row.status)}</span>
                        </div>
                        <div className="panel-body stack">
                          <h3>{row.title}</h3>
                          <dl className="desc">
                            <dt>{t("approval.queue.type", "Type")}</dt><dd>{label(row.request_type)}</dd>
                            <dt>{t("approval.queue.revision", "Revision")}</dt><dd>{row.current_revision}</dd>
                            <dt>{t("approval.queue.progress", "Progress")}</dt><dd>{decided}/{currentComponents.length}</dd>
                            <dt>{t("approval.queue.submitted", "Submitted")}</dt>
                            <dd>{row.submitted_at ? new Date(row.submitted_at).toLocaleString(locale) : t("common.unavailable", "Unavailable")}</dd>
                          </dl>
                          <Link
                            className={`btn ${selected ? "btn-primary" : "btn-secondary"}`}
                            aria-current={selected ? "true" : undefined}
                            href={`/compliance/approvals?request=${row.id}`}
                          >
                            {selected ? t("approval.queue.selected", "Selected") : t("approval.queue.open", "Open review")}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                  {rows.length === 0 ? (
                    <div className="empty" role="status">
                      <h2 className="empty-title">{t("approval.queue.empty", "No eligible requests in your scope")}</h2>
                      <p>{t("approval.queue.emptyBody", "The governed read succeeded and returned no maker-checker assignments.")}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="panel" aria-labelledby="approval-object-review">
                <div className="panel-header">
                  <h2 className="panel-title" id="approval-object-review">{t("approval.queue.objectReview", "Object review")}</h2>
                  {selectedRequest ? <span className="badge badge-info">{selectedRequest.request_number}</span> : null}
                </div>
                <div className="panel-body stack">
                  {!selectedRequest ? (
                    <p>{t("approval.queue.noSelection", "No request selected.")}</p>
                  ) : selectedReadError ? (
                    <div className="alert alert-critical" role="alert">
                      <strong>{t("approval.queue.objectUnavailable", "Object review unavailable. Package actions are disabled.")}</strong>
                    </div>
                  ) : selectedComponents.length === 0 ? (
                    <div className="empty" role="status">
                      <h3 className="empty-title">{t("approval.queue.noObjects", "No objects in this revision")}</h3>
                    </div>
                  ) : selectedComponents.map(component => {
                    const parents = dependencies
                      .filter(dependency => dependency.child_component_id === component.id)
                      .map(dependency => selectedById.get(dependency.parent_component_id))
                      .filter(Boolean) as ComponentRow[];
                    const fields = changedFields(component);
                    const publication = publications.find(row => row.component_id === component.id);
                    const changeType = component.target_entity_id
                      ? t("approval.queue.modified", "Modified")
                      : t("approval.queue.created", "Created");
                    return (
                      <article className="panel" key={component.id}>
                        <div className="panel-header">
                          <div className="row">
                            <span className="id-code">{label(component.entity_kind)}</span>
                            <span className="badge badge-info">{changeType}</span>
                          </div>
                          <span className={statusClass(component.component_status)}>{label(component.component_status)}</span>
                        </div>
                        <div className="panel-body stack">
                          <dl className="desc">
                            {fields.map(field => (
                              <div key={field.field}>
                                <dt>{field.field} {field.changed ? <span className="badge badge-warning">{t("approval.queue.changed", "Changed")}</span> : null}</dt>
                                <dd>
                                  <strong>{t("approval.queue.current", "Current")}:</strong> {displayValue(field.current)}
                                  <br />
                                  <strong>{t("approval.queue.proposed", "Proposed")}:</strong> {displayValue(field.proposed)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <div className="alert alert-info">
                            <div>
                              <strong>{t("approval.queue.dependencies", "Dependencies")}</strong>
                              <p>{parents.length
                                ? parents.map(parent => label(parent.entity_kind)).join(" · ")
                                : t("approval.queue.noDependencies", "No recorded parent dependency.")}</p>
                            </div>
                          </div>
                          <div className="alert alert-warning">
                            <div>
                              <strong>{t("approval.queue.impact", "Impact analysis")}</strong>
                              <p>{t("approval.queue.impactUnavailable", "Not configured — no persisted impact-analysis receipt is available.")}</p>
                            </div>
                          </div>
                          {publication ? (
                            <div className="alert alert-success">
                              <div>
                                <strong>{t("approval.queue.publishedVersion", "Published immutable version")}</strong>
                                <p className="id-code">{publication.version_id} · {new Date(publication.published_at).toLocaleString(locale)}</p>
                              </div>
                            </div>
                          ) : null}
                          {canReview && component.component_status === "pending_review" ? (
                            <ActionForm action={decideComplianceRequestComponent} className="stack">
                              <input type="hidden" name="request_id" value={selectedRequest.id} />
                              <input type="hidden" name="component_id" value={component.id} />
                              <label className="field">
                                <span>{t("approval.queue.decisionComment", "Decision comment")}</span>
                                <textarea className="input" name="comments" rows={3} />
                              </label>
                              <div className="row">
                                <button className="btn btn-primary" name="decision" value="approve">
                                  {t("approval.queue.approveObject", "Approve object")}
                                </button>
                                <button className="btn btn-secondary" type="button" disabled title={t("approval.queue.returnObjectHold", "Object-level Return is not configured by the backend contract.")}>
                                  {t("approval.queue.returnObject", "Return object")}
                                </button>
                                <button className="btn btn-danger" name="decision" value="reject">
                                  {t("approval.queue.rejectObject", "Reject object")}
                                </button>
                              </div>
                            </ActionForm>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="panel" aria-labelledby="approval-decision">
                <div className="panel-header">
                  <h2 className="panel-title" id="approval-decision">{t("approval.queue.packageDecision", "Package decision")}</h2>
                  <span className={allDecided ? "badge badge-completed" : "badge badge-pending badge-warning"}>
                    {allDecided ? t("approval.queue.ready", "Ready") : t("approval.queue.blocked", "Blocked")}
                  </span>
                </div>
                <div className="panel-body stack">
                  {!selectedRequest ? (
                    <p>{t("approval.queue.noSelection", "No request selected.")}</p>
                  ) : !canReview ? (
                    <div className="alert alert-info" role="note">
                      <strong>{t("approval.queue.readOnly", "Read-only. Your role cannot decide or publish this request.")}</strong>
                    </div>
                  ) : (
                    <>
                      <div className={allDecided ? "alert alert-success" : "alert alert-warning"}>
                        <div>
                          <strong>{allDecided
                            ? t("approval.queue.everyObjectDecided", "Every object carries a terminal decision.")
                            : t("approval.queue.pendingObjects", "Package publication remains blocked while an object is pending or returned.")}</strong>
                          <p>{t("approval.queue.databaseGate", "The database rechecks this gate before publication.")}</p>
                        </div>
                      </div>
                      <ActionForm action={publishComplianceRequest} className="stack">
                        <input type="hidden" name="request_id" value={selectedRequest.id} />
                        <button className="btn btn-primary" type="submit" disabled={!publishable}>
                          {t("approval.queue.publish", "Publish approved configuration")}
                        </button>
                      </ActionForm>
                      <ActionForm action={returnComplianceRequest} className="stack">
                        <input type="hidden" name="request_id" value={selectedRequest.id} />
                        <label className="field">
                          <span>{t("approval.queue.returnReason", "Return reason")}</span>
                          <textarea className="input" name="comments" required rows={3} />
                        </label>
                        <button className="btn btn-secondary" type="submit" disabled={!packageReviewable}>
                          {t("approval.queue.returnPackage", "Return package")}
                        </button>
                      </ActionForm>
                      <ActionForm action={rejectComplianceRequest} className="stack">
                        <input type="hidden" name="request_id" value={selectedRequest.id} />
                        <label className="field">
                          <span>{t("approval.queue.rejectionReason", "Rejection reason")}</span>
                          <textarea className="input" name="comments" required rows={3} />
                        </label>
                        <button className="btn btn-danger" type="submit" disabled={!packageReviewable}>
                          {t("approval.queue.rejectPackage", "Reject package")}
                        </button>
                      </ActionForm>
                    </>
                  )}
                  {selectedRequest ? (
                    <dl className="desc">
                      <dt>{t("approval.queue.correlation", "Correlation")}</dt><dd className="id-code">{selectedRequest.correlation_id}</dd>
                      <dt>{t("approval.queue.auditReceipts", "Audit receipts")}</dt>
                      <dd>{Array.isArray(selectedRequest.audit_references) ? selectedRequest.audit_references.length : t("common.unavailable", "Unavailable")}</dd>
                      <dt>{t("approval.queue.publicationReceipt", "Publication receipt")}</dt>
                      <dd>{selectedRequest.publication_audit_reference ?? t("approval.queue.notPublished", "Not published")}</dd>
                    </dl>
                  ) : null}
                </div>
              </section>
            </div>

            <section className="panel" aria-labelledby="approval-history">
              <div className="panel-header">
                <h2 className="panel-title" id="approval-history">{t("approval.queue.history", "Immutable decision history")}</h2>
                <span className="badge badge-info">{decisions.length + publications.length}</span>
              </div>
              <div className="panel-body">
                <ul className="timeline">
                  {decisions.map(decision => (
                    <li key={decision.id}>
                      <span className="tl-dot" aria-hidden="true" />
                      <strong>{label(decision.decision)}</strong>
                      <p className="tl-meta">
                        {decision.component_id ? `${t("approval.queue.object", "Object")} ${decision.component_id.slice(0, 8)}` : t("approval.queue.package", "Package")}
                        {" · "}{new Date(decision.decided_at).toLocaleString(locale)}
                        {" · "}<bdi>{decision.decided_by}</bdi>
                      </p>
                      {decision.comments ? <p>{decision.comments}</p> : null}
                    </li>
                  ))}
                  {publications.map(publication => (
                    <li key={publication.id}>
                      <span className="tl-dot is-accent" aria-hidden="true" />
                      <strong>{t("approval.queue.versionPublished", "Immutable version published")}</strong>
                      <p className="tl-meta"><bdi>{publication.version_id}</bdi> · {new Date(publication.published_at).toLocaleString(locale)}</p>
                    </li>
                  ))}
                  {decisions.length + publications.length === 0 ? (
                    <li><span className="tl-dot" aria-hidden="true" /><span>{t("approval.queue.noHistory", "No decisions or publications recorded.")}</span></li>
                  ) : null}
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}
