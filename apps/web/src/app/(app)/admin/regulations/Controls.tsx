/* @retiring 2026-08-09 · replaced-by components/sections/regulations/regulation-dossier (T-037 rebuild) · pending lifecycle control on SAQEEL primitives · delete-when 0-imports */
"use client";
import { useActionState } from "react";
import {
  activateRegulation,
  deactivateRegulation,
  type RegulationLifecycleResult,
} from "./actions";

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(String(value)), template);

export function RegulationLifecycleControl({
  entityId,
  operationalStatus,
  labels,
}: {
  entityId: string;
  operationalStatus: string;
  labels: {
    activationReason: string;
    deactivationReason: string;
    applying: string;
    activate: string;
    deactivate: string;
    alreadyMatched: string;
    changedTo: string;
    cascaded: string;
    childrenNotReactivated: string;
    missingReference: string;
    reasonRequired: string;
    denied: string;
    notFound: string;
    providerError: string;
  };
}) {
  const activating = operationalStatus === "deactivated";
  const action = activating ? activateRegulation : deactivateRegulation;
  const [state, formAction, pending] = useActionState<RegulationLifecycleResult, FormData>(action, {});
  const cascaded = state.cascaded;
  const errorMessage = state.errorCode === "missing_reference" ? labels.missingReference
    : state.errorCode === "reason_required" ? labels.reasonRequired
      : state.errorCode === "denied" ? labels.denied
        : state.errorCode === "not_found" ? labels.notFound
          : state.errorCode === "provider" ? labels.providerError
            : state.error;

  if (operationalStatus === "draft") return null;
  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="entity_id" value={entityId} />
      <label className="sq-field">
        <span className="sq-field__label">{activating ? labels.activationReason : labels.deactivationReason}</span>
        <textarea className="sq-input" name="reason" required />
      </label>
      <button className={activating ? "btn btn-primary btn-touch" : "btn btn-secondary btn-touch"} disabled={pending}>
        {pending ? labels.applying : activating ? labels.activate : labels.deactivate}
      </button>
      {errorMessage ? <span className="t-caption" role="alert">{errorMessage}</span> : null}
      {state.ok ? (
        <span className="badge badge-compliant" role="status">
          {state.idempotent ? labels.alreadyMatched : fill(labels.changedTo, { status: state.operationalStatus ?? "" })}
          {cascaded && !activating
            ? ` ${fill(labels.cascaded, { items: cascaded.inspection_items, violations: cascaded.violations, penalties: cascaded.penalties })}`
            : ""}
          {activating ? ` ${labels.childrenNotReactivated}` : ""}
        </span>
      ) : null}
    </form>
  );
}
