"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { decideComplianceRequestComponent } from "@/app/(app)/admin/compliance-requests/actions";
import type { CcrActionResult } from "@/app/(app)/admin/compliance-requests/actions";
import { fill } from "@/i18n/messages";
import styles from "./approval-decision-form.module.css";

export type ApprovalDecisionStrings = {
  readonly comment: string;
  readonly commentHint: string;
  readonly rejectHint: string;
  readonly approve: string;
  readonly reject: string;
  readonly working: string;
  readonly cascade: string;
  readonly returnNote: string;
  readonly done: string;
};

const EMPTY: CcrActionResult = {};

/**
 * Approve and reject only. `decide_compliance_request_component` rejects any
 * other value, so an object-level Return control could never succeed — the
 * legacy screen rendered it permanently disabled, which reads as a temporary
 * outage rather than a rule. A line states where Return does live instead.
 */
export default function ApprovalDecisionForm({ requestId, componentId, dependents, strings }: {
  requestId: string;
  componentId: string;
  dependents: number;
  strings: ApprovalDecisionStrings;
}) {
  const [state, formAction, pending] = useActionState<CcrActionResult, FormData>(
    decideComplianceRequestComponent, EMPTY,
  );

  return (
    <form className={styles.root} action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="component_id" value={componentId} />

      <Field label={strings.comment} htmlFor={`decision-comment-${componentId}`} hint={strings.commentHint}>
        <textarea className={styles.comment} id={`decision-comment-${componentId}`} name="comments" rows={3} />
      </Field>

      <p className={styles.note}>{strings.rejectHint}</p>
      {dependents > 0 ? (
        <p className={styles.cascade}>{fill(strings.cascade, { count: dependents })}</p>
      ) : null}
      <p className={styles.note}>{strings.returnNote}</p>

      <div className={styles.actions}>
        <Button type="submit" name="decision" value="approve" variant="primary" size="sm"
          disabled={pending} label={strings.approve}>
          {pending ? strings.working : strings.approve}
        </Button>
        <Button type="submit" name="decision" value="reject" variant="danger" size="sm"
          disabled={pending} label={strings.reject}>
          {strings.reject}
        </Button>
      </div>

      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.ok ? <StatusPill tone="success">{strings.done}</StatusPill> : null}
    </form>
  );
}
