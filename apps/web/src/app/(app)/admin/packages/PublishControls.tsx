"use client";

import { useActionState, useEffect, useRef } from "react";
import Button from "@/components/saqeel/button/button";
import DatePickerField, { type DatePickerFieldStrings } from "@/components/saqeel/date-picker-field/date-picker-field";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { Locale } from "@/lib/i18n";
import {
  approveAndPublish,
  createDraftVersion,
  createPackage,
  deactivatePackageVersion,
  type PkgResult,
} from "./actions";
import styles from "./publish-controls.module.css";

export type NewPackageStrings = {
  heading: string;
  codeLabel: string; codePlaceholder: string;
  titleLabel: string; titlePlaceholder: string;
  scopeLabel: string; scopePlaceholder: string;
  create: string; creating: string; created: string;
};

export type PublishStrings = {
  datePicker: DatePickerFieldStrings;
  newDraftLabel: string;
  creating: string;
  createDraft: string;
  draftCreated: string;
  versionPlaceholder: string;
  effectiveFrom: string;
  publishing: string;
  approvePublish: string;
  published: string;
  publishHint: string;
  effectiveTo: string; deactivationReason: string; deactivationReasonPlaceholder: string; deactivate: string; deactivating: string; deactivated: string;
};

function useFeedbackFocus(state: PkgResult) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error || state.ok) ref.current?.focus();
  }, [state]);
  return ref;
}

function Feedback({ state, done, innerRef }: {
  state: PkgResult;
  done: string;
  innerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={styles.feedback} ref={innerRef} tabIndex={-1}>
      {state.error ? <Text live="alert" role="label" tone="danger">{state.error}</Text> : null}
      {state.ok ? <StatusPill tone="success">{done}</StatusPill> : null}
    </div>
  );
}

export function NewPackageForm({ strings: s }: { strings: NewPackageStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(createPackage, {});
  const feedbackRef = useFeedbackFocus(state);

  return (
    <form action={formAction} aria-busy={pending} className={styles.row}>
      <Field htmlFor="new-package-code" label={s.codeLabel}>
        <TextInput autoComplete="off" id="new-package-code" name="code" placeholder={s.codePlaceholder} required />
      </Field>
      <Field htmlFor="new-package-title" label={s.titleLabel}>
        <TextInput autoComplete="off" id="new-package-title" name="title" placeholder={s.titlePlaceholder} required />
      </Field>
      <Field htmlFor="new-package-scope" label={s.scopeLabel}>
        <TextInput autoComplete="off" id="new-package-scope" name="scope" placeholder={s.scopePlaceholder} />
      </Field>
      <Button busy={pending} disabled={pending} type="submit" variant="primary">
        {pending ? s.creating : s.create}
      </Button>
      <Feedback done={s.created} innerRef={feedbackRef} state={state} />
    </form>
  );
}

export function NewDraftForm({ packageId, strings: s, locale }: { packageId: string; strings: PublishStrings; locale: Locale }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(createDraftVersion, {});
  const feedbackRef = useFeedbackFocus(state);

  return (
    <form action={formAction} aria-busy={pending} className={styles.row}>
      <input name="package_id" type="hidden" value={packageId} />
      <Field htmlFor={`version-label-${packageId}`} label={s.newDraftLabel}>
        <TextInput
          autoComplete="off"
          id={`version-label-${packageId}`}
          name="version_label"
          placeholder={s.versionPlaceholder}
          required
        />
      </Field>
      <Field htmlFor={`effective-from-${packageId}`} label={s.effectiveFrom}>
        <DatePickerField id={`effective-from-${packageId}`} name="effective_from" label={s.effectiveFrom} locale={locale} strings={s.datePicker} />
      </Field>
      <Button busy={pending} disabled={pending} type="submit" variant="primary">
        {pending ? s.creating : s.createDraft}
      </Button>
      <Feedback done={s.draftCreated} innerRef={feedbackRef} state={state} />
    </form>
  );
}

export function DeactivatePackage({ versionId, strings: s, locale }: { versionId: string; strings: PublishStrings; locale: Locale }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(deactivatePackageVersion, {});
  const feedbackRef = useFeedbackFocus(state);

  return (
    <form action={formAction} aria-busy={pending} className={styles.row}>
      <input name="version_id" type="hidden" value={versionId} />
      <Field htmlFor={`effective-to-${versionId}`} label={s.effectiveTo}>
        <DatePickerField id={`effective-to-${versionId}`} name="effective_to" label={s.effectiveTo} locale={locale} strings={s.datePicker} />
      </Field>
      <Field htmlFor={`deactivation-reason-${versionId}`} label={s.deactivationReason}>
        <TextInput id={`deactivation-reason-${versionId}`} name="deactivation_reason" placeholder={s.deactivationReasonPlaceholder} required />
      </Field>
      <Button busy={pending} disabled={pending} type="submit" variant="danger">
        {pending ? s.deactivating : s.deactivate}
      </Button>
      <Feedback done={s.deactivated} innerRef={feedbackRef} state={state} />
    </form>
  );
}

export function ApprovePublish({ versionId, strings: s }: { versionId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(approveAndPublish, {});
  const feedbackRef = useFeedbackFocus(state);

  return (
    <form action={formAction} aria-busy={pending} className={styles.publish}>
      <input name="version_id" type="hidden" value={versionId} />
      <Text role="label" tone="muted">{s.publishHint}</Text>
      <Button busy={pending} disabled={pending} type="submit" variant="primary">
        {pending ? s.publishing : s.approvePublish}
      </Button>
      <div className={styles.feedback} ref={feedbackRef} tabIndex={-1}>
        {state.error ? (
          <span className={styles.multiline}><Text live="alert" role="label" tone="danger">{state.error}</Text></span>
        ) : null}
        {state.ok ? <StatusPill tone="success">{s.published}</StatusPill> : null}
      </div>
    </form>
  );
}
