"use client";

import { useActionState, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getHistory,
  restoreRevision,
  type L10nResult,
  type Revision,
} from "@/app/(app)/admin/localization/actions";
import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import type { UiString } from "@/features/admin-localization/view";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-history.module.css";

export default function LocalizationHistory({ row, strings, locale }: {
  row: UiString;
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<readonly Revision[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setReadError(null);
    const result = await getHistory(row.key, locale);
    setLoading(false);
    if (result.error) {
      setReadError(result.error);
      return;
    }
    setRevisions(result.revisions ?? []);
  };

  const [restoreState, restoreAction, restorePending] = useActionState<L10nResult, FormData>(
    async (_previous, data) => {
      const result = await restoreRevision(_previous, data);
      if (result.ok) {
        router.refresh();
        await load();
      }
      return result;
    },
    {},
  );

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && revisions === null && !loading) await load();
  };

  const sourceLabel = (revision: Revision) => revision.change_source === "sync"
    ? strings.row.sourceSync
    : revision.change_source === "restore"
      ? strings.row.sourceRestore
      : strings.row.sourcePanel;

  return (
    <div className={styles.history}>
      <Button
        controls={panelId}
        expanded={open}
        label={fill(strings.row.historyFor, { key: row.key })}
        onClick={toggle}
        size="sm"
        variant="link"
      >
        {strings.row.history}
      </Button>

      {open ? (
        <div className={styles.panel} id={panelId}>
          {loading ? <Text role="label" tone="muted">{strings.row.historyLoading}</Text> : null}
          {readError ? <Text live="alert" role="label" tone="danger">{readError}</Text> : null}
          {revisions !== null && revisions.length === 0 ? (
            <Text role="label" tone="muted">{strings.row.historyEmpty}</Text>
          ) : null}

          {(revisions ?? []).map(revision => (
            <div className={styles.revision} key={revision.id}>
              <Text role="label" tone="muted">
                {formatDateTime(revision.changed_at, locale)} · {sourceLabel(revision)}
              </Text>
              <Text role="label" tone="muted">
                {fill(strings.row.changedBy, {
                  actor: revision.changed_by ? revision.changed_by.slice(0, 8) : strings.row.systemActor,
                })}
              </Text>
              <span dir="rtl" lang="ar"><Text as="span">{revision.ar ?? strings.notConfigured}</Text></span>
              <form action={restoreAction}>
                <input name="key" type="hidden" value={row.key} />
                <input name="revision_id" type="hidden" value={revision.id} />
                <input name="expected_updated_at" type="hidden" value={row.updated_at} />
                <input name="locale" type="hidden" value={locale} />
                <Button busy={restorePending} disabled={restorePending} size="sm" type="submit" variant="tertiary">
                  {restorePending ? strings.row.restoring : strings.row.restore}
                </Button>
              </form>
            </div>
          ))}

          {restoreState.ok ? (
            <Text live="status" role="label" tone="success">{strings.row.restored}</Text>
          ) : null}
          {restoreState.error ? (
            <Text live="alert" role="label" tone="danger">{restoreState.error}</Text>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
