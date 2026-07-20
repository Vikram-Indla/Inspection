"use client";
import { useActionState } from "react";
import { createExternalRequest, type PortalResult } from "./actions";

export function CreateRequest({ factoryId, strings: s }: { factoryId: string | null; strings: { type: string; subject: string; create: string; creating: string; created: string; noFactory: string } }) {
  const [state, action, pending] = useActionState<PortalResult, FormData>(createExternalRequest, {});
  if (!factoryId) return <p className="t-caption">{s.noFactory}</p>;
  return (
    <form action={action} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor="portal-request-type">{s.type}</label><input className="ax-input" name="request_type" id="portal-request-type" defaultValue="correction" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="portal-request-subject">{s.subject}</label><input className="ax-input" name="subject" id="portal-request-subject" /></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
    </form>
  );
}
