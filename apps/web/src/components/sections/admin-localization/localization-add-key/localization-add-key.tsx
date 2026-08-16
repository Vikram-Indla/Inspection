"use client";

import { useActionState, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { addKey, type L10nResult } from "@/app/(app)/admin/localization/actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Text } from "@/components/saqeel/type";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-add-key.module.css";

export default function LocalizationAddKey({ strings, locale }: {
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const panelId = useId();
  const [open, setOpen] = useState(false);
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
      <Button
        controls={panelId}
        expanded={open}
        onClick={() => setOpen(current => !current)}
        variant="primary"
      >
        {open ? strings.toolbar.closeAdd : strings.toolbar.addKey}
      </Button>

      {open ? (
        <div className={styles.panel} id={panelId}>
          <Card>
            <CardHeader level="h2" title={strings.add.title} />
            <CardBody>
              <form action={formAction} className={styles.form}>
                <input name="locale" type="hidden" value={locale} />
                <TextInput label={strings.add.key} name="key" placeholder={strings.add.keyHint} required />
                <TextInput label={strings.add.en} name="en" required />
                <span className={styles.arabic} dir="rtl" lang="ar">
                  <TextInput label={strings.add.ar} name="ar" placeholder={strings.add.arHint} />
                </span>
                <TextInput label={strings.add.context} name="context" placeholder={strings.add.contextHint} />
                <Button busy={pending} disabled={pending} type="submit" variant="primary">
                  {pending ? strings.add.pending : strings.add.submit}
                </Button>
                {state.error ? <Text live="alert" role="label" tone="danger">{state.error}</Text> : null}
                {state.ok && !pending ? (
                  <Text live="status" role="label" tone="success">{strings.add.done}</Text>
                ) : null}
              </form>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </>
  );
}
