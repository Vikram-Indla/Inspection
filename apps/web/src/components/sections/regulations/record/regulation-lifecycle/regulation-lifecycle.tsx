"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import {
  activateRegulation, deactivateRegulation, type RegulationLifecycleResult,
} from "@/app/(app)/admin/regulations/actions";
import { fill } from "@/i18n/messages";
import styles from "./regulation-lifecycle.module.css";

export type RegulationLifecycleStrings = {
  readonly activationReason: string;
  readonly deactivationReason: string;
  readonly reasonHint: string;
  readonly applying: string;
  readonly activate: string;
  readonly deactivate: string;
  readonly alreadyMatched: string;
  readonly changedTo: string;
  readonly cascaded: string;
  readonly childrenNotReactivated: string;
  readonly missingReference: string;
  readonly reasonRequired: string;
  readonly denied: string;
  readonly notFound: string;
  readonly providerError: string;
};

const EMPTY: RegulationLifecycleResult = {};

/**
 * The only write on this screen. A draft was never activated, so deactivation
 * is not a transition that applies to it — the control does not exist rather
 * than existing and refusing.
 */
export default function RegulationLifecycle({ entityId, operationalStatus, strings }: {
  entityId: string;
  operationalStatus: string;
  strings: RegulationLifecycleStrings;
}) {
  const activating = operationalStatus === "deactivated";
  const [state, formAction, pending] = useActionState<RegulationLifecycleResult, FormData>(
    activating ? activateRegulation : deactivateRegulation, EMPTY,
  );

  const errorMessage = state.errorCode === "missing_reference" ? strings.missingReference
    : state.errorCode === "reason_required" ? strings.reasonRequired
      : state.errorCode === "denied" ? strings.denied
        : state.errorCode === "not_found" ? strings.notFound
          : state.errorCode === "provider" ? strings.providerError
            : state.error;

  if (operationalStatus === "draft") return null;

  return (
    <form className={styles.root} action={formAction}>
      <input type="hidden" name="entity_id" value={entityId} />
      <Field
        label={activating ? strings.activationReason : strings.deactivationReason}
        htmlFor="regulation-lifecycle-reason"
        hint={strings.reasonHint}
      >
        <textarea className={styles.reason} id="regulation-lifecycle-reason" name="reason" rows={3} required />
      </Field>

      <Button type="submit" variant={activating ? "primary" : "secondary"} disabled={pending}
        label={activating ? strings.activate : strings.deactivate}>
        {pending ? strings.applying : activating ? strings.activate : strings.deactivate}
      </Button>

      {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}

      {state.ok ? (
        <p className={styles.result} role="status">
          <StatusPill tone="success">
            {state.idempotent ? strings.alreadyMatched : fill(strings.changedTo, { status: state.operationalStatus ?? "" })}
          </StatusPill>
          {state.cascaded && !activating ? (
            <span className={styles.detail}>
              {fill(strings.cascaded, {
                items: state.cascaded.inspection_items,
                violations: state.cascaded.violations,
                penalties: state.cascaded.penalties,
              })}
            </span>
          ) : null}
          {activating ? <span className={styles.detail}>{strings.childrenNotReactivated}</span> : null}
        </p>
      ) : null}
    </form>
  );
}
