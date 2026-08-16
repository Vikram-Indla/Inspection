"use client";

import Button from "@/components/saqeel/button/button";
import Choice from "@/components/saqeel/choice/choice";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { ActionForm, DraftEditorStrings, ItemRule, SelectChoice } from "./designer-types";
import styles from "../packages.module.css";

export function ArabicField({ label, id, value, onChange }: {
  label: string; id: string; value: string; onChange: (next: string) => void;
}) {
  return (
    <Field htmlFor={id} label={label}>
      <span className={styles.arabic} dir="rtl" lang="ar">
        <TextInput id={id} onChange={onChange} value={value} />
      </span>
    </Field>
  );
}

export function ItemRulePanel({ code, rule, versionId, forms, violations, strings: s, onPatch }: {
  code: string;
  rule: ItemRule;
  versionId: string;
  forms: readonly ActionForm[];
  violations: readonly SelectChoice[];
  strings: DraftEditorStrings;
  onPatch: (patch: Partial<ItemRule>) => void;
}) {
  const mapNonCompliant = (patch: { violation?: string; action_form?: string }) => onPatch({
    response_mapping: {
      ...(rule.response_mapping ?? {}),
      non_compliant: { ...(rule.response_mapping?.non_compliant ?? {}), result: "non_compliant", ...patch },
    },
  });

  return (
    <fieldset className={styles.rulePanel}>
      <legend><Text as="span" role="bodyStrong">{s.relationship}: {code}</Text></legend>

      <SaqeelSelect
        label={s.requirement}
        onChange={next => onPatch({
          requirement: next as ItemRule["requirement"],
          conditional: next === "conditional" ? (rule.conditional ?? {}) : undefined,
        })}
        options={[
          { value: "required", label: s.required },
          { value: "optional", label: s.optional },
          { value: "conditional", label: s.conditional },
        ]}
        value={rule.requirement ?? "required"}
      />

      {rule.requirement === "conditional" ? (
        <>
          <Field htmlFor={`visible-when-${versionId}`} label={s.visibleWhen}>
            <TextInput
              id={`visible-when-${versionId}`}
              onChange={next => onPatch({ conditional: { ...(rule.conditional ?? {}), visible_when: next } })}
              value={rule.conditional?.visible_when ?? ""}
            />
          </Field>
          <Choice
            checked={!!rule.conditional?.mandatory_when_visible}
            kind="checkbox"
            label={s.mandatoryWhenVisible}
            name={`mandatory-visible-${versionId}`}
            onChange={next => onPatch({ conditional: { ...(rule.conditional ?? {}), mandatory_when_visible: next } })}
            value="1"
          />
        </>
      ) : null}

      <SaqeelSelect
        label={s.evidence}
        onChange={next => onPatch({
          evidence_rule: next === "inherit" ? undefined
            : next === "none" ? null
              : { on: "non_compliant", type: next, min: 1, mandatory: true },
        })}
        options={[
          { value: "inherit", label: s.inheritEvidence },
          { value: "none", label: s.none },
          { value: "photo", label: s.evidencePhoto },
          { value: "video", label: s.evidenceVideo },
          { value: "document", label: s.evidenceDocument },
          { value: "comment", label: s.evidenceComment },
        ]}
        value={rule.evidence_rule === undefined ? "inherit" : rule.evidence_rule?.type ?? "none"}
      />

      <Choice
        checked={rule.scoring_enabled !== false}
        kind="checkbox"
        label={s.scoring}
        name={`scoring-${versionId}`}
        onChange={next => onPatch({ scoring_enabled: next })}
        value="1"
      />

      {rule.scoring_enabled !== false ? (
        <Field htmlFor={`score-weight-${versionId}`} label={s.scoreWeight}>
          <TextInput
            id={`score-weight-${versionId}`}
            onChange={next => onPatch({ score_weight: next === "" ? null : Number(next) })}
            type="number"
            value={rule.score_weight === null || rule.score_weight === undefined ? "" : String(rule.score_weight)}
          />
        </Field>
      ) : null}

      <SaqeelSelect
        label={s.violation}
        onChange={next => mapNonCompliant({ violation: next || undefined })}
        options={[{ value: "", label: s.none }, ...violations.map(item => ({ value: item.id, label: item.label }))]}
        value={rule.response_mapping?.non_compliant?.violation ?? ""}
      />

      <SaqeelSelect
        label={s.actionForm}
        onChange={next => mapNonCompliant({ action_form: next || undefined })}
        options={[
          { value: "", label: s.none },
          ...forms.map(form => ({ value: form.key, label: `${form.key} — ${form.title}` })),
        ]}
        value={rule.response_mapping?.non_compliant?.action_form ?? ""}
      />
    </fieldset>
  );
}

export function ActionFormsPane({ forms, templates, versionId, strings: s, onAdd, onPatch, onRemove }: {
  forms: readonly ActionForm[];
  templates: readonly SelectChoice[];
  versionId: string;
  strings: DraftEditorStrings;
  onAdd: () => void;
  onPatch: (index: number, patch: Partial<ActionForm>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className={styles.formsPane}>
      <div className={styles.paneActions}>
        <Text role="bodyStrong">{s.forms}</Text>
        <Button onClick={onAdd} type="button">{s.addForm}</Button>
      </div>

      {forms.map((form, index) => (
        <fieldset className={styles.rulePanel} key={`${form.key}-${index}`}>
          <Field htmlFor={`form-key-${versionId}-${index}`} label={s.formKey}>
            <TextInput
              id={`form-key-${versionId}-${index}`}
              onChange={next => onPatch(index, { key: next })}
              value={form.key}
            />
          </Field>
          <Field htmlFor={`form-title-${versionId}-${index}`} label={s.formTitle}>
            <TextInput
              id={`form-title-${versionId}-${index}`}
              onChange={next => onPatch(index, { title: next })}
              value={form.title}
            />
          </Field>
          <Choice
            checked={!!form.blocking}
            kind="checkbox"
            label={s.blocking}
            name={`blocking-${versionId}-${index}`}
            onChange={next => onPatch(index, { blocking: next })}
            value="1"
          />
          <SaqeelSelect
            label={s.template}
            onChange={next => onPatch(index, { template_version_id: next || undefined })}
            options={[{ value: "", label: s.none }, ...templates.map(item => ({ value: item.id, label: item.label }))]}
            value={form.template_version_id ?? ""}
          />
          <Button onClick={() => onRemove(index)} type="button" variant="danger">{s.removeForm}</Button>
        </fieldset>
      ))}
    </section>
  );
}
