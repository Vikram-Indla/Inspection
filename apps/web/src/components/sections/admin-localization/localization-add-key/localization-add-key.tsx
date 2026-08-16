"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addKey, type L10nResult } from "@/app/(app)/admin/localization/actions";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading, Text } from "@/components/saqeel/type";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-add-key.module.css";

function useBackdropDismiss(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    const dismiss = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", dismiss);
    return () => dialog.removeEventListener("click", dismiss);
  }, [open]);

  return ref;
}

export default function LocalizationAddKey({ strings, locale }: {
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const dialogRef = useBackdropDismiss(open);
  const [state, formAction, pending] = useActionState<L10nResult, FormData>(
    async (_previous, data) => {
      const result = await addKey(_previous, data);
      if (result.ok) router.refresh();
      return result;
    },
    {},
  );

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary">
        {strings.toolbar.addKey}
      </Button>

      {open ? (
        <dialog
          aria-labelledby={titleId}
          className={styles.dialog}
          onClose={() => setOpen(false)}
          ref={dialogRef}
        >
          <Heading id={titleId} level={2}>{strings.add.title}</Heading>

          <form action={formAction} className={styles.form}>
            <input name="locale" type="hidden" value={locale} />

            <Field htmlFor="l10n-key" label={strings.add.key}>
              <TextInput id="l10n-key" name="key" placeholder={strings.add.keyHint} required />
            </Field>

            <Field htmlFor="l10n-en" label={strings.add.en}>
              <TextInput id="l10n-en" name="en" required />
            </Field>

            <Field hint={strings.add.arHint} htmlFor="l10n-ar" label={strings.add.ar}>
              <span className={styles.arabic} dir="rtl" lang="ar">
                <TextInput id="l10n-ar" name="ar" />
              </span>
            </Field>

            <Field hint={strings.add.contextHint} htmlFor="l10n-context" label={strings.add.context}>
              <TextInput id="l10n-context" name="context" />
            </Field>

            <div className={styles.actions}>
              <Button busy={pending} disabled={pending} type="submit" variant="primary">
                {pending ? strings.add.pending : strings.add.submit}
              </Button>
              {state.error ? <Text live="alert" role="label" tone="danger">{state.error}</Text> : null}
              {state.ok && !pending ? (
                <Text live="status" role="label" tone="success">{strings.add.done}</Text>
              ) : null}
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  );
}
