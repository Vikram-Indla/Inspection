"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createRuleVersion, updateRule, type ExpiryResult } from "@/app/(app)/admin/planning/expiry/actions";
import type { ExpiryRuleRow } from "@/app/(app)/admin/planning/expiry/types";
import { Button, Checkbox, Field, NumberInput, Notice, Select, Text, TextInput } from "@/components/experimental/linear";
import { fill } from "@/i18n/messages";
import type { ExpiryCopy } from "./expiry-copy";
import styles from "./expiry-rule-editor.module.css";

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
        <Field id={`offset-${key}`} label={copy.field.offset} hint={copy.field.offsetHint}>
          <NumberInput
            id={`offset-${key}`}
            name="offset_minutes"
            min={0}
            max={525600}
            required
            defaultValue={row?.offset_minutes ?? 0}
            describedBy={`offset-${key}-hint`}
          />
        </Field>
        <Field id={`visit-type-${key}`} label={copy.field.visitType}>
          <Select
            id={`visit-type-${key}`}
            name="scope_visit_type"
            defaultValue={scope.visit_type ?? "any"}
            options={scopeOptions(VISIT_TYPES, copy.visitType)}
          />
        </Field>
        <Field id={`execution-mode-${key}`} label={copy.field.executionMode}>
          <Select
            id={`execution-mode-${key}`}
            name="scope_execution_mode"
            defaultValue={scope.execution_mode ?? "any"}
            options={scopeOptions(EXECUTION_MODES, copy.executionMode)}
          />
        </Field>
        <Field id={`priority-${key}`} label={copy.field.priority}>
          <Select
            id={`priority-${key}`}
            name="scope_priority"
            defaultValue={scope.priority ?? "any"}
            options={scopeOptions(PRIORITIES, copy.priority)}
          />
        </Field>
      </div>

      <div className={styles.reason}>
        <Field id={`reason-${key}`} label={copy.field.reason}>
          <TextInput id={`reason-${key}`} name="reason" required maxLength={500} defaultValue={row?.reason ?? ""} />
        </Field>
      </div>

      <div className={styles.checks}>
        <Checkbox
          id={`notify-creator-${key}`}
          name="notify_plan_creator"
          label={copy.notify.planCreator}
          defaultChecked={row?.notify_plan_creator ?? true}
        />
        <Checkbox
          id={`notify-inspector-${key}`}
          name="notify_inspector"
          label={copy.notify.inspector}
          defaultChecked={row?.notify_inspector ?? false}
        />
      </div>

      {feedback.error ? (
        <Notice tone="danger" live="alert">
          <Text role="caption">{feedback.error}</Text>
        </Notice>
      ) : null}

      <div className={styles.footer}>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? copy.action.working : row ? copy.action.save : copy.action.createVersion}
        </Button>
        <Button type="button" variant="quiet" disabled={pending} onClick={onClose}>
          {copy.action.cancel}
        </Button>
        <span className={styles.spacer} />
      </div>
    </form>
  );
}
