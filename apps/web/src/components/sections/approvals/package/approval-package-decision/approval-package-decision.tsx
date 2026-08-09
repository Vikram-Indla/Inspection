"use client";
import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import {
  publishComplianceRequest, rejectComplianceRequest, returnComplianceRequest,
  type CcrActionResult,
} from "@/app/(app)/admin/compliance-requests/actions";
import styles from "./approval-package-decision.module.css";

export type ApprovalPackageStrings = {
  readonly heading: string;
  readonly readOnly: string;
  readonly ready: string;
  readonly blocked: string;
  readonly gate: string;
  readonly publish: string;
  readonly returnReason: string;
  readonly returnAction: string;
  readonly rejectReason: string;
  readonly rejectAction: string;
  readonly reasonHint: string;
  readonly working: string;
  readonly done: string;
};

const EMPTY: CcrActionResult = {};

function ReasonedAction({ action, requestId, label, reasonLabel, hint, variant, disabled, strings }: {
  action: typeof returnComplianceRequest;
  requestId: string;
  label: string;
  reasonLabel: string;
  hint: string;
  variant: "secondary" | "danger";
  disabled: boolean;
  strings: ApprovalPackageStrings;
}) {
  const [state, formAction, pending] = useActionState<CcrActionResult, FormData>(action, EMPTY);
  const fieldId = `package-${variant}-${requestId}`;

  return (
    <form className={styles.form} action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      <Field label={reasonLabel} htmlFor={fieldId} hint={hint}>
        <textarea className={styles.reason} id={fieldId} name="comments" rows={3} required />
      </Field>
      <Button type="submit" variant={variant} size="sm" disabled={disabled || pending} label={label}>
        {pending ? strings.working : label}
      </Button>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.ok ? <StatusPill tone="success">{strings.done}</StatusPill> : null}
    </form>
  );
}

/**
 * Publication is gated on every object carrying a terminal decision. The
 * database rechecks that gate, so the disabled state here is a courtesy, not
 * the control — which is why the reason is stated rather than left implicit.
 */
export default function ApprovalPackageDecision({ requestId, canReview, allDecided, publishable, reviewable, strings }: {
  requestId: string;
  canReview: boolean;
  allDecided: boolean;
  publishable: boolean;
  reviewable: boolean;
  strings: ApprovalPackageStrings;
}) {
  const [publishState, publishAction, publishing] = useActionState<CcrActionResult, FormData>(
    publishComplianceRequest, EMPTY,
  );

  return (
    <Card as="section" labelledBy="approval-package-decision">
      <CardHeader
        level="h2"
        titleId="approval-package-decision"
        title={strings.heading}
        trailing={<StatusPill tone={allDecided ? "success" : "warning"}>{allDecided ? strings.ready : strings.blocked}</StatusPill>}
      />
      <CardBody gap="tight">
        {!canReview ? (
          <p className={styles.note}>{strings.readOnly}</p>
        ) : (
          <>
            <p className={styles.note}>{strings.gate}</p>

            <form className={styles.form} action={publishAction}>
              <input type="hidden" name="request_id" value={requestId} />
              <Button type="submit" variant="primary" size="sm" disabled={!publishable || publishing} label={strings.publish}>
                {publishing ? strings.working : strings.publish}
              </Button>
              {publishState.error ? <p className={styles.error} role="alert">{publishState.error}</p> : null}
              {publishState.ok ? <StatusPill tone="success">{strings.done}</StatusPill> : null}
            </form>

            <ReasonedAction
              action={returnComplianceRequest}
              requestId={requestId}
              label={strings.returnAction}
              reasonLabel={strings.returnReason}
              hint={strings.reasonHint}
              variant="secondary"
              disabled={!reviewable}
              strings={strings}
            />

            <ReasonedAction
              action={rejectComplianceRequest}
              requestId={requestId}
              label={strings.rejectAction}
              reasonLabel={strings.rejectReason}
              hint={strings.reasonHint}
              variant="danger"
              disabled={!reviewable}
              strings={strings}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}
