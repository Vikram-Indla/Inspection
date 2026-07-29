"use client";

import { useActionState, useState } from "react";
import { decideSupervision, type SupervisionDecisionResult } from "./actions";

type Inspector = { user_id: string; full_name: string };
export type PendingSupervision = {
  id: string; visitId: string; reference: string | null; factoryName: string; visitType: string;
  windowStart: string; windowEnd: string; submittedAt: string; proposedInspectorId: string | null;
};

export default function SupervisionQueue({ requests, inspectors }: { requests: PendingSupervision[]; inspectors: Inspector[] }) {
  return <div className="sq-stack">
    {requests.length === 0 ? <div className="sq-banner sq-banner--info">No visit is awaiting supervision.</div> : requests.map(request =>
      <SupervisionCard key={request.id} request={request} inspectors={inspectors} />
    )}
  </div>;
}

function SupervisionCard({ request, inspectors }: { request: PendingSupervision; inspectors: Inspector[] }) {
  const [state, action, pending] = useActionState<SupervisionDecisionResult, FormData>(decideSupervision, {});
  const [decision, setDecision] = useState<"approve" | "return" | "reject">("approve");
  const format = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return <section className="sq-card" aria-label={`Supervision request ${request.reference ?? request.visitId}`}>
    <div className="sq-card__header"><div><p className="sq-eyebrow">Awaiting Supervisor</p><h2>{request.reference ?? "New visit"}</h2></div><span className="sq-lozenge sq-lozenge--warning">Pending supervision</span></div>
    <dl className="sq-detail-grid">
      <div><dt>Factory</dt><dd>{request.factoryName}</dd></div><div><dt>Visit type</dt><dd>{request.visitType}</dd></div>
      <div><dt>Window</dt><dd>{format(request.windowStart)} – {format(request.windowEnd)}</dd></div><div><dt>Submitted</dt><dd>{format(request.submittedAt)}</dd></div>
    </dl>
    <form action={action} className="sq-stack" style={{ marginTop: "var(--space-4)" }}>
      <input type="hidden" name="visit_id" value={request.visitId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="field"><label htmlFor={`inspector-${request.id}`}>Final Inspector</label>
        <select className="select" id={`inspector-${request.id}`} name="inspector_id" defaultValue={request.proposedInspectorId ?? ""} disabled={decision !== "approve"}>
          <option value="">— select Inspector</option>{inspectors.map(inspector => <option key={inspector.user_id} value={inspector.user_id}>{inspector.full_name}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor={`reason-${request.id}`}>Decision note {decision === "approve" ? "(optional)" : "(required)"}</label>
        <textarea className="input" id={`reason-${request.id}`} name="reason" rows={2} disabled={pending} /></div>
      {state.error && <p className="sq-banner sq-banner--critical" role="alert">{state.error}</p>}
      {state.done && <p className="sq-banner sq-banner--success" role="status">{state.done}</p>}
      <div className="sq-actions">
        <button type="submit" className="btn btn-primary" disabled={pending} onClick={() => setDecision("approve")}>{pending && decision === "approve" ? "Releasing…" : "Approve & release"}</button>
        <button type="submit" className="btn btn-secondary" disabled={pending} onClick={() => setDecision("return")}>Return to Planner</button>
        <button type="submit" className="btn btn-danger" disabled={pending} onClick={() => setDecision("reject")}>Reject</button>
      </div>
    </form>
  </section>;
}
