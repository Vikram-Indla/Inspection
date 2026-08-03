"use client";

import { useActionState, useState } from "react";
import { decideSupervision, type SupervisionDecisionResult } from "./actions";

type Inspector = { user_id: string; full_name: string };
export type PendingSupervision = {
  id: string; visitId: string; reference: string | null; factoryName: string; visitType: string;
  windowStart: string; windowEnd: string; submittedAt: string; proposedInspectorId: string | null;
};
export type SupervisionStrings = {
  empty: string; requestLabel: string; awaiting: string; newVisit: string; pending: string;
  factory: string; visitType: string; window: string; submitted: string; finalInspector: string;
  selectInspector: string; noteOptional: string; noteRequired: string; approve: string; releasing: string;
  returnToPlanner: string; reject: string;
};

export default function SupervisionQueue({ requests, inspectorsByVisit, strings, locale }: { requests: PendingSupervision[]; inspectorsByVisit: Record<string, Inspector[]>; strings: SupervisionStrings; locale: "en" | "ar" }) {
  return <div className="sq-stack">
    {requests.length === 0 ? <div className="sq-banner sq-banner--info">{strings.empty}</div> : requests.map(request =>
      <SupervisionCard key={request.id} request={request} inspectors={inspectorsByVisit[request.visitId] ?? []} strings={strings} locale={locale} />
    )}
  </div>;
}

function SupervisionCard({ request, inspectors, strings: s, locale }: { request: PendingSupervision; inspectors: Inspector[]; strings: SupervisionStrings; locale: "en" | "ar" }) {
  const [state, action, pending] = useActionState<SupervisionDecisionResult, FormData>(decideSupervision, {});
  const [decision, setDecision] = useState<"approve" | "return" | "reject">("approve");
  const format = (value: string) => new Date(value).toLocaleString(locale === "ar" ? "ar-SA" : "en", { dateStyle: "medium", timeStyle: "short" });
  const ref = request.reference ?? request.visitId;
  return <section className="sq-card" aria-label={s.requestLabel.replace("{ref}", ref)}>
    <div className="sq-card__header"><div><p className="sq-eyebrow">{s.awaiting}</p><h2>{request.reference ?? s.newVisit}</h2></div><span className="sq-lozenge sq-lozenge--warning">{s.pending}</span></div>
    <dl className="sq-detail-grid">
      <div><dt>{s.factory}</dt><dd>{request.factoryName}</dd></div><div><dt>{s.visitType}</dt><dd>{request.visitType}</dd></div>
      <div><dt>{s.window}</dt><dd>{format(request.windowStart)} – {format(request.windowEnd)}</dd></div><div><dt>{s.submitted}</dt><dd>{format(request.submittedAt)}</dd></div>
    </dl>
    <form action={action} className="sq-stack" style={{ marginTop: "var(--space-4)" }}>
      <input type="hidden" name="visit_id" value={request.visitId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="field"><label htmlFor={`inspector-${request.id}`}>{s.finalInspector}</label>
        <select className="select" id={`inspector-${request.id}`} name="inspector_id" defaultValue={request.proposedInspectorId ?? ""} disabled={decision !== "approve"}>
          <option value="">{s.selectInspector}</option>{inspectors.map(inspector => <option key={inspector.user_id} value={inspector.user_id}>{inspector.full_name}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor={`reason-${request.id}`}>{decision === "approve" ? s.noteOptional : s.noteRequired}</label>
        <textarea className="input" id={`reason-${request.id}`} name="reason" rows={2} disabled={pending} /></div>
      {state.error && <p className="sq-banner sq-banner--critical" role="alert">{state.error}</p>}
      {state.done && <p className="sq-banner sq-banner--success" role="status">{state.done}</p>}
      <div className="sq-actions">
        <button type="submit" className="btn btn-primary" disabled={pending} onClick={() => setDecision("approve")}>{pending && decision === "approve" ? s.releasing : s.approve}</button>
        <button type="submit" className="btn btn-secondary" disabled={pending} onClick={() => setDecision("return")}>{s.returnToPlanner}</button>
        <button type="submit" className="btn btn-danger" disabled={pending} onClick={() => setDecision("reject")}>{s.reject}</button>
      </div>
    </form>
  </section>;
}
