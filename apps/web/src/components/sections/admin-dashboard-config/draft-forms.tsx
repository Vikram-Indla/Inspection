"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Select from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import {
  createConfigDraft, publishConfigDraft, returnConfigDraft, submitConfigDraft,
  type DashConfigActionResult,
} from "@/app/admin/dashboard-config/actions";
import { CONFIG_DOMAINS } from "@/features/admin-dashboard-config/types";
import type { Messages } from "@/i18n/messages";
import styles from "./dashboard-config.module.css";

type Strings = Messages["adminDashboardConfig"]["drafts"];

export function CreateDraftForm({ strings }: { strings: Strings }) {
  const [state, action, pending] = useActionState<DashConfigActionResult, FormData>(createConfigDraft, {});
  return (
    <form action={action} className={styles.createForm}>
      <Select label={strings.domain} name="config_key" required defaultValue="kpi_parameters"
        options={CONFIG_DOMAINS.map(key => ({ value: key, label: key }))} />
      <TextInput label={strings.titleField} name="title" required placeholder={strings.titlePlaceholder} />
      <Button type="submit" variant="primary" size="sm" disabled={pending} label={strings.create}>{strings.create}</Button>
      {state.error ? <StatusPill tone="danger">{state.error}</StatusPill> : null}
    </form>
  );
}

export function SubmitDraftForm({ id, strings }: { id: string; strings: Strings }) {
  const [state, action, pending] = useActionState<DashConfigActionResult, FormData>(submitConfigDraft, {});
  return (
    <form action={action} className={styles.rowForm}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending} label={strings.submit}>{strings.submit}</Button>
      {state.error ? <StatusPill tone="danger">{state.error}</StatusPill> : null}
    </form>
  );
}

export function ReviewDraftForms({ id, strings }: { id: string; strings: Strings }) {
  const [publishState, publishAction, publishing] = useActionState<DashConfigActionResult, FormData>(publishConfigDraft, {});
  const [returnState, returnAction, returning] = useActionState<DashConfigActionResult, FormData>(returnConfigDraft, {});
  return (
    <div className={styles.reviewForms}>
      <form action={publishAction} className={styles.rowForm}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="primary" size="sm" disabled={publishing} label={strings.publish}>{strings.publish}</Button>
        {publishState.error ? <StatusPill tone="danger">{publishState.error}</StatusPill> : null}
      </form>
      <form action={returnAction} className={styles.rowForm}>
        <input type="hidden" name="id" value={id} />
        <TextInput name="reason" required placeholder={strings.returnReason} label={strings.returnReason} />
        <Button type="submit" variant="tertiary" size="sm" disabled={returning} label={strings.return}>{strings.return}</Button>
        {returnState.error ? <StatusPill tone="danger">{returnState.error}</StatusPill> : null}
      </form>
    </div>
  );
}
