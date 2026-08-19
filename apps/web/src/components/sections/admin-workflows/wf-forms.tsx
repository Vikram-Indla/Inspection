"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import {
  approvePublishWorkflow,
  proposeWorkflowDraft,
  saveWorkflowDraft,
  type WfResult,
} from "@/app/(app)/admin/workflows/actions";
import type { AdminWorkflowsMessages } from "@/features/admin-workflows/strings";
import styles from "./workflows.module.css";

function WfError({ state }: { state: WfResult }) {
  if (!state.error) return null;
  return <Text role="label" tone="danger" live="alert">{state.error}</Text>;
}

export function WfProposeForm({ baseVersionId, baseLabel, strings }: {
  baseVersionId: string;
  baseLabel: string;
  strings: AdminWorkflowsMessages;
}) {
  const [state, action, pending] = useActionState<WfResult, FormData>(proposeWorkflowDraft, {});
  const id = `wf-propose-${baseVersionId}`;
  return (
    <form action={action} className={styles.formRow}>
      <input type="hidden" name="base_version_id" value={baseVersionId} />
      <div className={styles.grow}>
        <Field label={strings.propose.label} htmlFor={id}>
          <TextInput id={id} name="version_label" required placeholder={`${baseLabel}${strings.propose.placeholderSuffix}`} />
        </Field>
      </div>
      <Button type="submit" variant="primary" disabled={pending}>{pending ? strings.propose.proposing : strings.propose.button}</Button>
      <WfError state={state} />
      {state.ok ? <StatusPill tone="success">{strings.propose.created}</StatusPill> : null}
    </form>
  );
}

export function WfEditorForm({ versionId, payload, strings }: {
  versionId: string;
  payload: unknown;
  strings: AdminWorkflowsMessages;
}) {
  const [state, action, pending] = useActionState<WfResult, FormData>(saveWorkflowDraft, {});
  const id = `wf-editor-${versionId}`;
  return (
    <form action={action} className={styles.formStack}>
      <input type="hidden" name="version_id" value={versionId} />
      <Field label={strings.editor.payloadLabel} htmlFor={id}>
        <Textarea id={id} name="payload" rows={14} defaultValue={JSON.stringify(payload, null, 2)} />
      </Field>
      <WfError state={state} />
      <div className={styles.formRow}>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? strings.editor.saving : strings.editor.save}</Button>
        {state.ok ? <StatusPill tone="success">{strings.editor.saved}</StatusPill> : null}
      </div>
    </form>
  );
}

export function WfPublishForm({ versionId, strings }: {
  versionId: string;
  strings: AdminWorkflowsMessages;
}) {
  const [state, action, pending] = useActionState<WfResult, FormData>(approvePublishWorkflow, {});
  return (
    <form action={action} className={styles.headActions}>
      <input type="hidden" name="version_id" value={versionId} />
      <Button type="submit" variant="primary" disabled={pending}>{pending ? strings.publish.publishing : strings.publish.approve}</Button>
      <WfError state={state} />
    </form>
  );
}
