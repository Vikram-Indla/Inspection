import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import ActionForm from "../ActionForm";
import {
  addComplianceRequestComponent, addComplianceRequestDependency, cancelComplianceRequest,
  decideComplianceRequestComponent, publishComplianceRequest, rejectComplianceRequest,
  returnComplianceRequest, reviseComplianceRequest, submitComplianceRequest,
  updateComplianceRequestDraft,
} from "../actions";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string; request_number: string; title: string; description: string | null; request_type: string;
  owner_id: string; created_at: string; submitted_at: string | null; current_revision: number; status: string;
  comments: string | null; return_reason: string | null; correlation_id: string; audit_references: unknown;
  publication_audit_reference: number | null;
};
type Revision = { id: string; revision_number: number; created_by: string; created_at: string; submitted_at: string | null; comments: string | null; return_reason: string | null };
type Component = {
  id: string; revision_number: number; entity_kind: string; target_entity_id: string | null; component_status: string;
  current_value_snapshot: Record<string, unknown> | null; proposed_value_snapshot: Record<string, unknown>;
  component_comments: string | null; decision_comments: string | null; decided_by: string | null; decided_at: string | null;
};
type Dependency = { id: string; revision_number: number; parent_component_id: string; child_component_id: string };
type Decision = { id: string; revision_number: number; component_id: string | null; decision: string; comments: string | null; decided_by: string; decided_at: string };
type Publication = { id: string; revision_number: number; component_id: string; published_at: string; version_id: string };

const label = (value: string) => value.split("_").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
const json = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

export default async function ComplianceRequestWorkspace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const fromQueue = sp.from === "approval-queue";
  const shellCurrent = fromQueue ? "/admin/compliance-approvals" : "/admin/compliance-requests";
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const [requestRead, revisionRead, componentRead, dependencyRead, decisionRead, publicationRead, roleRead] = await Promise.all([
    sb.from("compliance_configuration_requests").select("id,request_number,title,description,request_type,owner_id,created_at,submitted_at,current_revision,status,comments,return_reason,correlation_id,audit_references,publication_audit_reference").eq("id", id).maybeSingle(),
    sb.from("compliance_request_revisions").select("id,revision_number,created_by,created_at,submitted_at,comments,return_reason").eq("request_id", id).order("revision_number", { ascending: false }),
    sb.from("compliance_request_components").select("id,revision_number,entity_kind,target_entity_id,component_status,current_value_snapshot,proposed_value_snapshot,component_comments,decision_comments,decided_by,decided_at").eq("request_id", id).order("created_at"),
    sb.from("compliance_request_component_dependencies").select("id,revision_number,parent_component_id,child_component_id").eq("request_id", id),
    sb.from("compliance_request_decisions").select("id,revision_number,component_id,decision,comments,decided_by,decided_at").eq("request_id", id).order("decided_at", { ascending: false }),
    sb.from("compliance_request_publications").select("id,revision_number,component_id,published_at,version_id").eq("request_id", id).order("published_at", { ascending: false }),
    user ? sb.from("user_roles").select("role_key").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);
  const readFailed = [requestRead.error, revisionRead.error, componentRead.error, dependencyRead.error, decisionRead.error, publicationRead.error, roleRead.error].some(Boolean);
  const request = requestRead.data as RequestRow | null;
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const isOwner = !!user && request?.owner_id === user.id;
  const canWrite = roles.has("admin");
  const canReview = !!user && (roles.has("admin") || roles.has("supervisor")) && !isOwner;
  const revisions = (revisionRead.data ?? []) as Revision[];
  const components = (componentRead.data ?? []) as Component[];
  const dependencies = (dependencyRead.data ?? []) as Dependency[];
  const decisions = (decisionRead.data ?? []) as Decision[];
  const publications = (publicationRead.data ?? []) as Publication[];

  if (readFailed) return (
    <Shell current={shellCurrent} title="Compliance Configuration Request">
      <div className="panel"><div className="saqeel-state" role="alert"><span className="saqeel-state__glyph" aria-hidden="true">⚠</span><h4>Request page can&apos;t load</h4><p className="t-caption">One or more reads failed. No status, revision, component, or decision is shown.</p><a className="sq-link" href={`/admin/compliance-requests/${id}`}>Retry</a></div></div>
    </Shell>
  );
  if (!request) return (
    <Shell current={shellCurrent} title="Compliance Configuration Request">
      <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">🔎</span><h4>Request not found or outside your scope</h4><p className="t-caption">The read returned no request. No configuration content was loaded.</p><Link className="sq-link" href="/admin/compliance-requests">Return to list</Link></div></div>
    </Shell>
  );

  const currentComponents = components.filter(component => component.revision_number === request.current_revision);
  const currentDependencies = dependencies.filter(dependency => dependency.revision_number === request.current_revision);
  const byId = new Map(currentComponents.map(component => [component.id, component]));
  const editable = isOwner && canWrite && request.status === "draft";
  const reviewable = canReview && ["pending_review", "partially_approved"].includes(request.status);
  const publishable = canReview && ["approved", "partially_approved"].includes(request.status);

  return (
    <Shell current={shellCurrent} title={`${request.request_number} — ${request.title}`}
      context={<><span className={`badge ccr-status ccr-status--${request.status}`}>{label(request.status)}</span><span className="t-caption">Revision {request.current_revision} · Correlation <bdi>{request.correlation_id}</bdi></span></>}>
      <p className="t-caption"><Link className="sq-link" href={fromQueue ? "/admin/compliance-approvals" : "/admin/compliance-requests"}>← {fromQueue ? "Awaiting Approval" : "Request list"}</Link></p>

      {request.return_reason ? <div className="alert alert-warning" role="alert"><strong>Return or rejection reason:</strong> {request.return_reason}</div> : null}
      {!isOwner && !canReview ? <div className="alert" role="note"><strong>Read-only.</strong> Your role can view this request but cannot change or decide it.</div> : null}

      <section className="panel ccr-summary" aria-labelledby="ccr-summary-heading">
        <div><h3 id="ccr-summary-heading">Request</h3><p>{request.description || "No description supplied."}</p></div>
        <dl className="ccr-facts"><div><dt>Type</dt><dd>{label(request.request_type)}</dd></div><div><dt>Owner</dt><dd><bdi>{request.owner_id}</bdi>{isOwner ? " · You" : ""}</dd></div><div><dt>Created</dt><dd className="numeric">{new Date(request.created_at).toISOString()}</dd></div><div><dt>Submitted</dt><dd className="numeric">{request.submitted_at ? new Date(request.submitted_at).toISOString() : "Not submitted"}</dd></div><div><dt>Current revision</dt><dd>R{request.current_revision}</dd></div><div><dt>Publication audit</dt><dd>{request.publication_audit_reference ?? "Not published"}</dd></div></dl>
      </section>

      {editable ? <section className="panel ccr-form-card" aria-labelledby="ccr-draft-heading"><h3 id="ccr-draft-heading">Draft details</h3><ActionForm action={updateComplianceRequestDraft} className="ccr-form"><input type="hidden" name="request_id" value={request.id}/><label className="sq-field"><span className="sq-field__label">Title</span><input className="input" name="title" required defaultValue={request.title}/></label><label className="sq-field ccr-span"><span className="sq-field__label">Description</span><textarea className="input" name="description" rows={3} defaultValue={request.description ?? ""}/></label><label className="sq-field ccr-span"><span className="sq-field__label">Comments</span><textarea className="input" name="comments" rows={2} defaultValue={request.comments ?? ""}/></label><div className="ccr-span"><button className="btn btn-secondary btn-touch">Save Draft</button></div></ActionForm></section> : null}

      <section className="ccr-grid" aria-label="Request components and dependencies">
        <div className="stack">
          <div className="ccr-section-heading"><div><h3>Components</h3><p className="t-caption">Current and proposed values can&apos;t be changed after submission.</p></div><span className="badge">{currentComponents.length} in R{request.current_revision}</span></div>
          {currentComponents.length === 0 ? <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">◇</span><h4>No components in this revision</h4><p className="t-caption">Add a Regulation, Inspection Item, Violation, or Penalty component before submission.</p></div></div> : currentComponents.map((component, index) => {
            const parents = currentDependencies.filter(d => d.child_component_id === component.id).map(d => byId.get(d.parent_component_id)).filter(Boolean) as Component[];
            const publication = publications.find(item => item.component_id === component.id);
            return <article className="panel ccr-component" key={component.id} id={`component-${component.id}`}><header><div><span className="sq-overline">{index + 1} · {label(component.entity_kind)}</span><h4>{String(component.proposed_value_snapshot.title ?? component.proposed_value_snapshot.code ?? component.id.slice(0, 8))}</h4></div><span className={`badge ccr-status ccr-status--${component.component_status}`}>{label(component.component_status)}</span></header>{component.target_entity_id ? <p className="t-caption">Legacy/stable target: <bdi>{component.target_entity_id}</bdi></p> : <p className="t-caption">New stable identity will be assigned transactionally.</p>}{parents.length ? <p className="t-caption">Depends on: {parents.map(parent => `${label(parent.entity_kind)} ${String(parent.proposed_value_snapshot.code ?? parent.id.slice(0, 8))}`).join(" · ")}</p> : null}<div className="ccr-compare"><div><h5>Current value</h5><pre>{json(component.current_value_snapshot)}</pre></div><div><h5>Proposed value</h5><pre>{json(component.proposed_value_snapshot)}</pre></div></div>{component.component_comments ? <p className="t-caption"><strong>Maker comment:</strong> {component.component_comments}</p> : null}{component.decision_comments ? <p className="t-caption"><strong>Decision:</strong> {component.decision_comments}</p> : null}{publication ? <p className="t-caption ccr-success">Published final version <bdi>{publication.version_id}</bdi> at {new Date(publication.published_at).toISOString()}</p> : null}{reviewable && component.component_status === "pending_review" ? <ActionForm action={decideComplianceRequestComponent} className="ccr-review-controls"><input type="hidden" name="request_id" value={request.id}/><input type="hidden" name="component_id" value={component.id}/><label className="sq-field"><span className="sq-field__label">Decision comment</span><input className="input" name="comments" placeholder="Required for Reject"/></label><div className="ccr-actions"><button className="btn btn-primary btn-lg btn-touch" name="decision" value="approve">Approve component</button><button className="btn btn-danger btn-touch" name="decision" value="reject">Reject component</button></div></ActionForm> : null}</article>;
          })}
        </div>

        <aside className="stack">
          <section className="panel ccr-form-card"><h3>Dependency tree</h3>{currentDependencies.length === 0 ? <p className="t-caption">No component dependencies recorded.</p> : <ol className="ccr-tree">{currentDependencies.map(dependency => <li key={dependency.id}><a className="sq-link" href={`#component-${dependency.parent_component_id}`}>{label(byId.get(dependency.parent_component_id)?.entity_kind ?? "parent")}</a><span aria-hidden="true"> → </span><a className="sq-link" href={`#component-${dependency.child_component_id}`}>{label(byId.get(dependency.child_component_id)?.entity_kind ?? "child")}</a></li>)}</ol>}
          {editable && currentComponents.length >= 2 ? <ActionForm action={addComplianceRequestDependency} className="ccr-form"><input type="hidden" name="request_id" value={request.id}/><label className="sq-field"><span className="sq-field__label">Parent</span><select className="select" name="parent_component_id" required>{currentComponents.map(c => <option key={c.id} value={c.id}>{label(c.entity_kind)} · {String(c.proposed_value_snapshot.code ?? c.id.slice(0,8))}</option>)}</select></label><label className="sq-field"><span className="sq-field__label">Child</span><select className="select" name="child_component_id" required>{currentComponents.map(c => <option key={c.id} value={c.id}>{label(c.entity_kind)} · {String(c.proposed_value_snapshot.code ?? c.id.slice(0,8))}</option>)}</select></label><div className="ccr-span"><button className="btn btn-secondary btn-touch">Add dependency</button></div></ActionForm> : null}</section>

          <section className="panel ccr-form-card"><h3>Revision history</h3><ol className="ccr-history">{revisions.map(revision => <li key={revision.id}><strong>Revision {revision.revision_number}</strong><span>{revision.submitted_at ? `Submitted ${new Date(revision.submitted_at).toISOString()}` : "Draft"}</span><span>{components.filter(c => c.revision_number === revision.revision_number).length} components · {decisions.filter(d => d.revision_number === revision.revision_number).length} decisions</span></li>)}</ol></section>
        </aside>
      </section>

      {editable ? <section className="panel ccr-form-card" aria-labelledby="ccr-add-heading"><h3 id="ccr-add-heading">Add component</h3><p className="t-caption">Snapshots are JSON objects. For a child-only modification, include its existing parent version key: <code>regulation_version_id</code>, <code>inspection_item_version_id</code>, or <code>violation_version_id</code>.</p><ActionForm action={addComplianceRequestComponent} className="ccr-form"><input type="hidden" name="request_id" value={request.id}/><label className="sq-field"><span className="sq-field__label">Component type</span><select className="select" name="entity_kind" required><option value="regulation">Regulation</option><option value="inspection_item">Inspection Item</option><option value="violation">Violation</option><option value="penalty">Penalty</option></select></label><label className="sq-field"><span className="sq-field__label">Existing target UUID</span><input className="input" name="target_entity_id" placeholder={request.request_type === "modify" ? "Required for Modify" : "Optional"}/></label><label className="sq-field"><span className="sq-field__label">Current-value snapshot</span><textarea className="input ccr-json" name="current_snapshot" rows={8} defaultValue="{}"/></label><label className="sq-field"><span className="sq-field__label">Proposed-value snapshot</span><textarea className="input ccr-json" name="proposed_snapshot" rows={8} required defaultValue={'{\n  "code": "",\n  "title": ""\n}'}/></label><label className="sq-field ccr-span"><span className="sq-field__label">Component comments</span><textarea className="input" name="component_comments" rows={2}/></label><div className="ccr-span"><button className="btn btn-secondary btn-touch">Add component</button></div></ActionForm></section> : null}

      <section className="panel ccr-action-zone" aria-labelledby="ccr-actions-heading"><div><h3 id="ccr-actions-heading">Actions</h3><p className="t-caption">Every action here is checked by role and database rules, needs a second approver, and is logged.</p></div><div className="ccr-action-list">
        {editable ? <><ActionForm action={submitComplianceRequest}><input type="hidden" name="request_id" value={request.id}/><button className="btn btn-primary btn-lg btn-touch">Submit for review</button></ActionForm><ActionForm action={cancelComplianceRequest}><input type="hidden" name="request_id" value={request.id}/><input type="hidden" name="comments" value="Cancelled by request owner"/><button className="btn btn-ghost btn-touch">Cancel request</button></ActionForm></> : null}
        {isOwner && canWrite && request.status === "returned" ? <ActionForm action={reviseComplianceRequest} className="ccr-inline-form"><input type="hidden" name="request_id" value={request.id}/><input className="input" name="comments" placeholder="Revision summary"/><button className="btn btn-primary btn-lg btn-touch">Create revision {request.current_revision + 1}</button></ActionForm> : null}
        {reviewable ? <><ActionForm action={returnComplianceRequest} className="ccr-inline-form"><input type="hidden" name="request_id" value={request.id}/><input className="input" name="comments" required placeholder="Return reason (required)"/><button className="btn btn-secondary btn-touch">Return request</button></ActionForm><ActionForm action={rejectComplianceRequest} className="ccr-inline-form"><input type="hidden" name="request_id" value={request.id}/><input className="input" name="comments" required placeholder="Rejection reason (required)"/><button className="btn btn-danger btn-touch">Reject request</button></ActionForm></> : null}
        {publishable ? <ActionForm action={publishComplianceRequest}><input type="hidden" name="request_id" value={request.id}/><button className="btn btn-primary btn-lg btn-touch">Publish approved branches transactionally</button></ActionForm> : null}
      </div></section>

      <section className="panel ccr-form-card"><h3>Decisions and publication</h3>{decisions.length === 0 ? <p className="t-caption">No decisions recorded.</p> : <div className="table-wrap"><table className="table"><thead><tr><th scope="col">Revision</th><th scope="col">Decision</th><th scope="col">Component</th><th scope="col">Comment</th><th scope="col">At</th></tr></thead><tbody>{decisions.map(decision => <tr key={decision.id}><td>R{decision.revision_number}</td><td>{label(decision.decision)}</td><td><bdi>{decision.component_id?.slice(0,8) ?? "Request"}</bdi></td><td>{decision.comments ?? "—"}</td><td className="numeric">{new Date(decision.decided_at).toISOString()}</td></tr>)}</tbody></table></div>}</section>
    </Shell>
  );
}
