"use client";
import { useActionState } from "react";
import { createExternalRequest, type PortalResult } from "./actions";

export function CreateRequest({ factoryId, requestType, strings: s }: { factoryId: string | null; requestType: "visit" | "correction" | "objection"; strings: { type: string; subject: string; create: string; creating: string; created: string; noFactory: string } }) {
  const [state, action, pending] = useActionState<PortalResult, FormData>(createExternalRequest, {});
  if (!factoryId) return <p className="t-caption">{s.noFactory}</p>;
  return (
    <form action={action} className="panel">
      <div className="panel-body stack">
        <input type="hidden" name="factory_id" value={factoryId} />
        <input type="hidden" name="request_type" value={requestType} />
        <div className="field"><span>{s.type}</span><span className="badge badge-info">{requestType}</span></div>
        <div className="field"><label htmlFor="portal-request-subject">{s.subject}</label><input className="input" name="subject" id="portal-request-subject" required /></div>
        <div className="row">
          <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.creating : s.create}</button>
          {state.error && <span className="field-error" role="alert">{state.error}</span>}
          {state.ok && <span className="badge badge-compliant">{s.created}</span>}
        </div>
      </div>
    </form>
  );
}
