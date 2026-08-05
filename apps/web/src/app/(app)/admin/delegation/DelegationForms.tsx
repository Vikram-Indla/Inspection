"use client";
import { useActionState } from "react";
import { createDelegation, revokeDelegation, type DelegationResult } from "./actions";

export type DelegationStrings = {
  delegator: string; delegate: string; delegateHelp: string; scope: string; reason: string;
  startsAt: string; endsAt: string; create: string; creating: string; created: string;
  revoke: string; revoking: string; revoked: string; revokeReason: string; cancel: string;
};

export function CreateDelegationForm({
  delegatorName, availableScopes, strings: s,
}: { delegatorName: string; availableScopes: { key: string; title: string }[]; strings: DelegationStrings }) {
  const [state, action, pending] = useActionState<DelegationResult, FormData>(createDelegation, {});
  return (
    <form action={action} className="panel dg-composer">
      <div className="panel-body stack">
      <div className="sq-field"><label className="sq-field__label" htmlFor="dg-delegator">{s.delegator}</label>
        <input className="sq-input" id="dg-delegator" value={delegatorName} readOnly disabled /></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="dg-to">{s.delegate}</label>
        <input className="sq-input" id="dg-to" name="delegate_email" type="email" required />
        <p className="t-caption">{s.delegateHelp}</p></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="dg-scope">{s.scope}</label>
        <select className="sq-input" id="dg-scope" name="scope" required defaultValue="">
          <option value="" disabled>{s.scope}</option>
          {availableScopes.map(role => <option key={role.key} value={role.key}>{role.title}</option>)}
        </select></div>
      <div className="row" style={{ gap: "var(--space-3)" }}>
        <div className="sq-field"><label className="sq-field__label" htmlFor="dg-starts">{s.startsAt}</label>
          <input className="sq-input numeric" id="dg-starts" name="starts_at" type="date" required /></div>
        <div className="sq-field"><label className="sq-field__label" htmlFor="dg-ends">{s.endsAt}</label>
          <input className="sq-input numeric" id="dg-ends" name="ends_at" type="date" required /></div>
      </div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="dg-reason">{s.reason}</label>
        <textarea className="sq-input" id="dg-reason" name="reason" required rows={3} /></div>
      <div className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? s.creating : s.create}</button>
        {state.error && <span className="t-caption" role="alert" style={{ color: "var(--status-critical)" }}>{state.error}</span>}
        {state.ok && <span className="badge badge-compliant">{s.created}</span>}
      </div>
      </div>
    </form>
  );
}

export function RevokeDelegationForm({ delegationId, strings: s }: { delegationId: string; strings: DelegationStrings }) {
  const [state, action, pending] = useActionState<DelegationResult, FormData>(revokeDelegation, {});
  return (
    <form action={action} className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="delegation_id" value={delegationId} />
      <div className="sq-field"><label className="sq-field__label" htmlFor={`dg-revoke-reason-${delegationId}`}>{s.revokeReason}</label>
        <input className="sq-input" id={`dg-revoke-reason-${delegationId}`} name="revoke_reason" required /></div>
      <button className="btn btn-secondary btn-touch" disabled={pending}>{pending ? s.revoking : s.revoke}</button>
      {state.error && <span className="t-caption" role="alert" style={{ color: "var(--status-critical)" }}>{state.error}</span>}
      {state.ok && <span className="badge badge-info">{s.revoked}</span>}
    </form>
  );
}
