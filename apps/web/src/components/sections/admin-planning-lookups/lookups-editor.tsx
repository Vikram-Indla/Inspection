"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveLookup, type LookupResult } from "@/app/(app)/admin/planning/lookups/actions";
import { KNOWN_METADATA_FLAGS } from "@/app/(app)/admin/planning/lookups/constants";
import Button from "@/components/saqeel/button/button";
import Choice from "@/components/saqeel/choice/choice";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import Textarea from "@/components/saqeel/textarea/textarea";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Mono, Text } from "@/components/saqeel/type";
import type { LookupRow } from "@/features/admin-planning-lookups/queries";
import type { LookupsCopy } from "./lookups-manager";
import styles from "./lookups-screen.module.css";

export default function LookupsEditor({ row, kind, kinds, copy, kindLabel, onDone }: {
  row?: LookupRow;
  kind: string;
  kinds: readonly string[];
  locale: "en" | "ar";
  copy: LookupsCopy;
  kindLabel: (value: string) => string;
  onDone: () => void;
}) {
  const c = copy.editor;
  const [feedback, setFeedback] = useState<LookupResult>({});
  const [pending, startTransition] = useTransition();
  const idFor = (field: string): string => (row ? `lk-${field}-${row.id}` : `lk-${field}`);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (row) {
      form.set("lookup_id", row.id);
      form.set("kind", row.kind);
      form.set("key", row.key);
    }
    setFeedback({});
    startTransition(async () => {
      const result = await saveLookup(form);
      setFeedback(result);
      if (result.ok) onDone();
    });
  };

  return (
    <form className={styles.editor} onSubmit={submit} aria-label={row ? c.editTitle : c.addTitle}>
      <Text role="label" tone="secondary">{row ? c.editTitle : c.addTitle}</Text>

      <div className={styles.grid}>
        {row ? (
          <Field label={`${c.kind} · ${c.key}`}>
            <bdi><Mono>{`${kindLabel(row.kind)} · ${row.key}`}</Mono></bdi>
          </Field>
        ) : (
          <>
            <Field label={c.kind} htmlFor={idFor("kind")}>
              <SaqeelSelect
                id={idFor("kind")}
                name="kind"
                label={c.kind}
                defaultValue={kind}
                required
                options={kinds.map(value => ({ value, label: kindLabel(value) }))}
              />
            </Field>
            <Field label={c.key} htmlFor={idFor("key")}>
              <TextInput id={idFor("key")} name="key" placeholder={c.keyPlaceholder} required />
            </Field>
          </>
        )}
        <Field label={c.labelEn} htmlFor={idFor("en")}>
          <TextInput id={idFor("en")} name="label_en" placeholder={c.labelEnPlaceholder} required defaultValue={row?.label_en ?? ""} />
        </Field>
        <Field label={c.labelAr} htmlFor={idFor("ar")}>
          <TextInput id={idFor("ar")} name="label_ar" placeholder={c.labelArPlaceholder} defaultValue={row?.label_ar ?? ""} />
        </Field>
        <Field label={c.sortOrder} htmlFor={idFor("sort")}>
          <TextInput id={idFor("sort")} name="sort_order" type="number" placeholder={c.sortOrderPlaceholder} defaultValue={String(row?.sort_order ?? 0)} />
        </Field>
      </div>

      <fieldset className={styles.flags}>
        <legend className={styles.legend}>
          <Text role="label" tone="secondary" as="span">{c.flagsTitle}</Text>
        </legend>
        <div className={styles.flagGrid}>
          {KNOWN_METADATA_FLAGS.map(flag => (
            <Choice
              key={flag}
              kind="checkbox"
              id={idFor(`flag-${flag}`)}
              name={`flag_${flag}`}
              value="1"
              label={copy.flags[flag]}
              defaultChecked={row?.metadata?.[flag] === true}
            />
          ))}
        </div>
      </fieldset>

      <details className={styles.advanced}>
        <summary className={styles.summary}>{c.advanced}</summary>
        <div className={styles.advancedBody}>
          <Field label={c.rawJson} htmlFor={idFor("json")} hint={c.rawJsonHint}>
            <Textarea id={idFor("json")} name="metadata_json" placeholder={c.rawJsonPlaceholder} rows={3} />
          </Field>
        </div>
      </details>

      {feedback.error ? <Text tone="danger" live="alert">{feedback.error}</Text> : null}

      <div className={styles.footer}>
        <Button type="submit" variant="primary" size="sm" disabled={pending} icon={row ? undefined : "create"}>
          {pending ? c.working : row ? c.save : c.add}
        </Button>
        {row ? (
          <Button type="button" variant="tertiary" size="sm" disabled={pending} onClick={onDone}>
            {c.cancel}
          </Button>
        ) : null}
        {feedback.ok && !pending ? <Text tone="success" live="status">{feedback.ok}</Text> : null}
      </div>
    </form>
  );
}
