"use client";

import { useActionState, useState } from "react";
import Button from "@/components/saqeel/button/button";
import Select from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { Switch } from "@/components/saqeel/inputs/Choice";
import { createItem, toggleItemActive, updateItem, type ItemResult } from "@/app/(app)/admin/items/actions";
import type { ClauseOption } from "@/features/admin-items/types";
import type { Messages } from "@/i18n/messages";
import styles from "./admin-items.module.css";

type Strings = Messages["adminItems"];

export function NewItemForm({ clauses, clauseUnavailable, strings }: {
  clauses: readonly ClauseOption[];
  clauseUnavailable: boolean;
  strings: Strings;
}) {
  const [state, action, pending] = useActionState<ItemResult, FormData>(createItem, {});
  const [scoring, setScoring] = useState(true);
  const f = strings.form;
  const e = strings.enum;

  return (
    <form action={action} className={styles.createForm}>
      <TextInput label={f.code} name="code" placeholder="FS-110" required />
      <TextInput label={f.title} name="title" placeholder={f.titlePlaceholder} required />
      <Select label={f.clause} name="clause_id" required disabled={clauseUnavailable}
        placeholder={clauseUnavailable ? f.clauseUnavailable : f.selectClause}
        options={clauses.map(clause => ({ value: clause.id, label: clause.label }))} />
      <TextInput label={f.weight} name="score_weight" placeholder="5" disabled={!scoring} />
      <Select label={f.responseModel} name="response_preset" required defaultValue="tri_state"
        options={[
          { value: "tri_state", label: `${e.compliant} / ${e.non_compliant} / ${e.na}` },
          { value: "binary", label: `${e.compliant} / ${e.non_compliant}` },
          { value: "value_date", label: e.value_date },
        ]} />
      <span className={styles.fieldWithHint}>
        <Select label={f.evidenceRule} name="evidence_preset" required defaultValue="none"
          options={[
            { value: "none", label: f.evidenceNone },
            { value: "photo_nc_mandatory", label: f.evidencePhotoNc },
            { value: "video_nc_mandatory", label: f.evidenceVideoNc },
            { value: "document_nc_mandatory", label: f.evidenceDocumentNc },
            { value: "comment_nc_mandatory", label: f.evidenceCommentNc },
          ]} />
        <Text as="span" role="label" tone="muted">{f.evidenceSource}</Text>
      </span>
      <span className={styles.switchField}>
        <input type="hidden" name="scoring_enabled" value={scoring ? "true" : "false"} />
        <Switch checked={scoring} onChange={event => setScoring(event.target.checked)}
          label={scoring ? f.scoringEnabled : f.scoringDisabled} />
      </span>
      <TextInput label={f.guidance} name="guidance_en" placeholder={f.guidancePlaceholder} />
      <Button type="submit" variant="primary" disabled={pending || clauseUnavailable}
        label={pending ? f.creating : f.create}>{pending ? f.creating : f.create}</Button>
      {state.error ? <StatusPill tone="danger">{state.error}</StatusPill> : null}
      {state.ok ? <StatusPill tone="success">{f.created}</StatusPill> : null}
    </form>
  );
}

export function EditItemForm({ item, clauses, strings }: {
  item: { id: string; title: string; clauseId: string; guidance: string | null; version: number };
  clauses: readonly ClauseOption[];
  strings: Strings;
}) {
  const [state, action, pending] = useActionState<ItemResult, FormData>(updateItem, {});
  const f = strings.form;
  return (
    <details className={styles.editDisclosure}>
      <summary className={styles.editSummary}>{f.edit} · v{item.version}</summary>
      <form action={action} className={styles.editForm}>
        <input type="hidden" name="item_id" value={item.id} />
        <TextInput label={f.title} name="title" defaultValue={item.title} required />
        <Select label={f.clause} name="clause_id" required defaultValue={item.clauseId}
          options={clauses.map(clause => ({ value: clause.id, label: clause.label }))} />
        <Textarea label={f.guidance} name="guidance_en" defaultValue={item.guidance ?? ""} />
        <Button type="submit" variant="primary" size="sm" disabled={pending}
          label={pending ? f.saving : f.saveDraft}>{pending ? f.saving : f.saveDraft}</Button>
        {state.error ? <StatusPill tone="danger">{state.error}</StatusPill> : null}
        {state.ok ? <StatusPill tone="success">{f.draftSaved}</StatusPill> : null}
      </form>
    </details>
  );
}

export function ToggleActive({ itemId, active, strings }: { itemId: string; active: boolean; strings: Strings }) {
  const [state, action, pending] = useActionState<ItemResult, FormData>(toggleItemActive, {});
  const f = strings.form;
  return (
    <form action={action} className={styles.toggleForm}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="next_active" value={active ? "false" : "true"} />
      {active ? <TextInput label={f.deactivationReason} name="deactivation_reason" required /> : null}
      <Button type="submit" variant={active ? "danger" : "secondary"} size="sm" disabled={pending} title={f.reasonNote}
        label={pending ? f.saving : active ? f.deactivate : f.reactivate}>
        {pending ? f.saving : active ? f.deactivate : f.reactivate}
      </Button>
      {state.error ? <StatusPill tone="danger">{state.error}</StatusPill> : null}
    </form>
  );
}
