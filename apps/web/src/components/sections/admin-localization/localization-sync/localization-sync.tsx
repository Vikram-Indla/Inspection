"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { syncFromCode, type SyncResult } from "@/app/(app)/admin/localization/actions";
import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import { fill } from "@/i18n/messages";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-sync.module.css";

export default function LocalizationSync({ strings, locale }: {
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SyncResult, FormData>(
    async (previous, data) => {
      const result = await syncFromCode(previous, data);
      if (result.report) router.refresh();
      return result;
    },
    {},
  );
  const count = (value: number) => formatCount(value, locale);

  return (
    <form action={formAction} className={styles.sync}>
      <input name="locale" type="hidden" value={locale} />
      <Button busy={pending} disabled={pending} type="submit" variant="secondary">
        {pending ? strings.toolbar.syncing : strings.toolbar.sync}
      </Button>
      {state.report && !pending ? (
        <Text live="status" role="label" tone="secondary">
          {fill(strings.toolbar.syncReport, {
            added: count(state.report.added.length),
            enChanged: count(state.report.enChanged.length),
            arChanged: count(state.report.arChanged.length),
            orphaned: count(state.report.orphaned.length),
            revived: count(state.report.revived.length),
          })}
        </Text>
      ) : null}
      {state.error ? <Text live="alert" role="label" tone="danger">{state.error}</Text> : null}
    </form>
  );
}
