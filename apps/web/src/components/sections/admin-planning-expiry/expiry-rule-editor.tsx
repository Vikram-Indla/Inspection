"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createRuleVersion, updateRule, type ExpiryResult } from "@/app/(app)/admin/planning/expiry/actions";
import type { ExpiryRuleRow } from "@/app/(app)/admin/planning/expiry/types";
import Button from "@/components/saqeel/button/button";
import Choice from "@/components/saqeel/choice/choice";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { ExpiryCopy } from "./expiry-copy";
import styles from "./expiry-screen.module.css";

const VISIT_TYPES = ["periodic", "follow_up", "complaint"] as const;
const EXECUTION_MODES = ["physical", "virtual", "administrative"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export default function ExpiryRuleEditor({ row, ruleType, ruleName, copy, onClose }: {
  row?: ExpiryRuleRow;
  ruleType: string;
  ruleName: string;
  copy: ExpiryCopy;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<ExpiryResult>({});
  const [pending, startTransition] = useTransition();

  const scope = row?.scope ?? {};
  const key = row ? row.id : `new-${ruleType}`;
  const legend = row
    ? fill(copy.a11y.editorFor, { rule: ruleName, version: row.version })
    : fill(copy.a11y.newVersionFor, { rule: ruleName });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("rule_type", ruleType);
    if (row) form.set("rule_id", row.id);
    setFeedback({});
    startTransition(async () => {
      const result = row ? await updateRule(form) : await createRuleVersion(form);
      setFeedback(result);
      if (result.ok) onClose();
    });
  };

  const scopeOptions = (values: readonly string[], labels: Readonly<Record<string, string>>) => [
    { value: "any", label: copy.scope.any },
    ...values.map(value => ({ value, label: labels[value] ?? value })),
  ];

  return (
    <form className={styles.editor} onSubmit={submit} aria-label={legend}>
      <div className={styles.grid}>
        <Field label={copy.field.offset} htmlFor={`offset-${key}`} hint={copy.field.offsetHint}>
          <TextInput
            id={`offset-${key}`}
            name="offset_minutes"
            type="number"
            required
            defaultValue={String(row?.offset_minutes ?? 0)}
            label={copy.field.offset}
          />
        </Field>
        <Field label={copy.field.visitType} htmlFor={`visit-type-${key}`}>
          <SaqeelSelect
            id={`visit-type-${key}`}
            name="scope_visit_type"
            label={copy.field.visitType}
            defaultValue={scope.visit_type ?? "any"}
            options={scopeOptions(VISIT_TYPES, copy.visitType)}
          />
        </Field>
        <Field label={copy.field.executionMode} htmlFor={`execution-mode-${key}`}>
          <SaqeelSelect
            id={`execution-mode-${key}`}
            name="scope_execution_mode"
            label={copy.field.executionMode}
            defaultValue={scope.execution_mode ?? "any"}
            options={scopeOptions(EXECUTION_MODES, copy.executionMode)}
          />
        </Field>
        <Field label={copy.field.priority} htmlFor={`priority-${key}`}>
          <SaqeelSelect
            id={`priority-${key}`}
            name="scope_priority"
            label={copy.field.priority}
            defaultValue={scope.priority ?? "any"}
            options={scopeOptions(PRIORITIES, copy.priority)}
          />
        </Field>
      </div>

      <Field label={copy.field.reason} htmlFor={`reason-${key}`}>
        <TextInput
          id={`reason-${key}`}
          name="reason"
          required
          maxLength={500}
          defaultValue={row?.reason ?? ""}
          label={copy.field.reason}
        />
      </Field>

      <div className={styles.checks}>
        <Choice
          kind="checkbox"
          id={`notify-creator-${key}`}
          name="notify_plan_creator"
          value="1"
          label={copy.notify.planCreator}
          defaultChecked={row?.notify_plan_creator ?? true}
        />
        <Choice
          kind="checkbox"
          id={`notify-inspector-${key}`}
          name="notify_inspector"
          value="1"
          label={copy.notify.inspector}
          defaultChecked={row?.notify_inspector ?? false}
        />
      </div>

      {feedback.error ? <Text tone="danger" live="alert">{feedback.error}</Text> : null}

      <div className={styles.footer}>
        <Button type="submit" variant="primary" size="sm" disabled={pending} label={row ? copy.action.save : copy.action.createVersion}>
          {pending ? copy.action.working : row ? copy.action.save : copy.action.createVersion}
        </Button>
        <Button type="button" variant="tertiary" size="sm" disabled={pending} label={copy.action.cancel} onClick={onClose}>
          {copy.action.cancel}
        </Button>
      </div>
    </form>
  );
}
