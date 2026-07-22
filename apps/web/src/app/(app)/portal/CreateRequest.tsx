"use client";
import { useActionState } from "react";
import { createExternalRequest, type PortalResult } from "./actions";

export function CreateRequest({ factoryId, strings: s }: { factoryId: string | null; strings: { type: string; subject: string; create: string; creating: string; created: string; noFactory: string } }) {
  const [state, action, pending] = useActionState<PortalResult, FormData>(createExternalRequest, {});
  if (!factoryId) return <p className="t-caption">{s.noFactory}</p>;
  return (
    <form action={action} className="panel" style={{ padding: "var(--space-6)", display: "flex", gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor="portal-request-type">{s.type}</label><input className="ax-input" name="request_type" id="portal-request-type" defaultValue="correction" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="portal-request-subject">{s.subject}</label><input className="ax-input" name="subject" id="portal-request-subject" /></div>
      <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant">{s.created}</span>}
    </form>
  );
}
