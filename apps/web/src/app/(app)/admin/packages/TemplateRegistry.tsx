"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextArea from "@/components/saqeel/textarea/textarea";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Mono, Text } from "@/components/saqeel/type";
import {
  createTemplateVersion,
  deactivateTemplateVersion,
  publishTemplateVersion,
  updateTemplateDraft,
  type TemplateResult,
} from "../templates/actions";
import styles from "./template-registry.module.css";

export type TemplateRow = {
  id: string; template_key: string; template_type: string; version_label: string;
  title_en: string; title_ar: string; schema: unknown; status: string; effective_from: string | null;
};

export type TemplateStrings = {
  heading: string; intro: string; key: string; type: string; version: string;
  effectiveFrom: string; titleEn: string; titleAr: string; schema: string;
  create: string; creating: string; save: string; saving: string;
  publish: string; publishing: string; effectiveTo: string; reason: string;
  deactivate: string; deactivating: string; historical: string; saved: string;
  typeForm: string; typeReport: string; typeActionForm: string; typePenalty: string;
};

function Feedback({ state, saved }: { state: TemplateResult; saved: string }) {
  if (state.error) return <Text live="alert" role="label" tone="danger">{state.error}</Text>;
  if (state.ok) return <StatusPill tone="success">{saved}</StatusPill>;
  return null;
}

function ArabicField({ label, name, defaultValue }: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <Field htmlFor={`tpl-${name}`} label={label}>
      <span className={styles.arabic} dir="rtl" lang="ar">
        <TextInput defaultValue={defaultValue} id={`tpl-${name}`} name={name} required />
      </span>
    </Field>
  );
}

export default function TemplateRegistry({ templates, strings: s }: {
  templates: readonly TemplateRow[];
  strings: TemplateStrings;
}) {
  const [createState, createAction, creating] = useActionState<TemplateResult, FormData>(createTemplateVersion, {});

  return (
    <div className={styles.body}>
      <Text tone="secondary">{s.intro}</Text>

      <form action={createAction} className={styles.grid}>
        <Field htmlFor="tpl-key" label={s.key}>
          <TextInput id="tpl-key" name="template_key" required />
        </Field>
        <Field htmlFor="tpl-type" label={s.type}>
          <SaqeelSelect
            defaultValue="action_form"
            id="tpl-type"
            label={s.type}
            name="template_type"
            options={[
              { value: "form", label: s.typeForm },
              { value: "report", label: s.typeReport },
              { value: "action_form", label: s.typeActionForm },
              { value: "penalty", label: s.typePenalty },
            ]}
            required
          />
        </Field>
        <Field htmlFor="tpl-version" label={s.version}>
          <TextInput id="tpl-version" name="version_label" placeholder="v1" required />
        </Field>
        <Field htmlFor="tpl-from" label={s.effectiveFrom}>
          <TextInput id="tpl-from" name="effective_from" required type="date" />
        </Field>
        <Field htmlFor="tpl-title-en" label={s.titleEn}>
          <TextInput id="tpl-title-en" name="title_en" required />
        </Field>
        <ArabicField label={s.titleAr} name="title_ar" />
        <div className={styles.wide}>
          <Field htmlFor="tpl-schema" label={s.schema}>
            <TextArea defaultValue={'{"fields":[]}'} id="tpl-schema" name="schema" required rows={4} />
          </Field>
        </div>
        <div className={styles.actions}>
          <Button busy={creating} disabled={creating} type="submit" variant="primary">
            {creating ? s.creating : s.create}
          </Button>
          <Feedback saved={s.saved} state={createState} />
        </div>
      </form>

      <div className={styles.cards}>
        {templates.map(template => (
          <TemplateCard key={template.id} strings={s} template={template} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, strings: s }: { template: TemplateRow; strings: TemplateStrings }) {
  const [editState, editAction, editing] = useActionState<TemplateResult, FormData>(updateTemplateDraft, {});
  const [publishState, publishAction, publishing] = useActionState<TemplateResult, FormData>(publishTemplateVersion, {});
  const [offState, offAction, deactivating] = useActionState<TemplateResult, FormData>(deactivateTemplateVersion, {});
  const live = ["published", "locked"].includes(template.status);

  return (
    <details className={styles.card}>
      <summary className={styles.summary}>
        <span className={styles.cardHead}>
          <Mono>{`${template.template_key} · ${template.version_label}`}</Mono>
          <Text as="span" role="bodyStrong">{template.title_en}</Text>
          <StatusPill ping={false} tone={template.status === "draft" ? "warning" : "success"}>
            {template.status}
          </StatusPill>
        </span>
      </summary>

      <div className={styles.body}>
        {template.status === "draft" ? (
          <>
            <form action={editAction} className={styles.grid}>
              <input name="template_id" type="hidden" value={template.id} />
              <Field htmlFor={`tpl-en-${template.id}`} label={s.titleEn}>
                <TextInput defaultValue={template.title_en} id={`tpl-en-${template.id}`} name="title_en" required />
              </Field>
              <ArabicField defaultValue={template.title_ar} label={s.titleAr} name="title_ar" />
              <div className={styles.wide}>
                <Field htmlFor={`tpl-schema-${template.id}`} label={s.schema}>
                  <TextArea
                    defaultValue={JSON.stringify(template.schema, null, 2)}
                    id={`tpl-schema-${template.id}`}
                    name="schema"
                    required
                    rows={6}
                  />
                </Field>
              </div>
              <div className={styles.actions}>
                <Button busy={editing} disabled={editing} type="submit" variant="primary">
                  {editing ? s.saving : s.save}
                </Button>
                <Feedback saved={s.saved} state={editState} />
              </div>
            </form>

            <form action={publishAction} className={styles.actions}>
              <input name="template_id" type="hidden" value={template.id} />
              <Button busy={publishing} disabled={publishing} type="submit" variant="primary">
                {publishing ? s.publishing : s.publish}
              </Button>
              <Feedback saved={s.saved} state={publishState} />
            </form>
          </>
        ) : live ? (
          <form action={offAction} className={styles.grid}>
            <input name="template_id" type="hidden" value={template.id} />
            <Field htmlFor={`tpl-to-${template.id}`} label={s.effectiveTo}>
              <TextInput id={`tpl-to-${template.id}`} name="effective_to" required type="date" />
            </Field>
            <Field htmlFor={`tpl-reason-${template.id}`} label={s.reason}>
              <TextInput id={`tpl-reason-${template.id}`} name="deactivation_reason" required />
            </Field>
            <div className={styles.actions}>
              <Button busy={deactivating} disabled={deactivating} type="submit" variant="danger">
                {deactivating ? s.deactivating : s.deactivate}
              </Button>
              <Feedback saved={s.saved} state={offState} />
            </div>
          </form>
        ) : (
          <Text tone="muted">{s.historical}</Text>
        )}
      </div>
    </details>
  );
}
