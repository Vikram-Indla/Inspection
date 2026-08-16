"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { markReviewed, saveTranslation, type L10nResult } from "@/app/(app)/admin/localization/actions";
import Button from "@/components/saqeel/button/button";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Mono, Text } from "@/components/saqeel/type";
import { missingPlaceholders } from "@/features/admin-localization/placeholders";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import { stateOf, type StringState, type UiString } from "@/features/admin-localization/view";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import LocalizationHistory from "../localization-history/localization-history";
import PlaceholderText from "./placeholder-text";
import styles from "./localization-row.module.css";

const TONE: Readonly<Record<StringState, StatusTone>> = {
  missing: "danger",
  draft: "warning",
  reviewed: "success",
  orphaned: "neutral",
};

export default function LocalizationRow({ row, strings, locale }: {
  row: UiString;
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const [arabic, setArabic] = useState(row.ar ?? "");
  const [saveState, saveAction, savePending] = useActionState<L10nResult, FormData>(
    async (_previous, data) => {
      const result = await saveTranslation(_previous, data);
      if (result.ok) router.refresh();
      return result;
    },
    {},
  );
  const [reviewState, reviewAction, reviewPending] = useActionState<L10nResult, FormData>(
    async (_previous, data) => {
      const result = await markReviewed(_previous, data);
      if (result.ok) router.refresh();
      return result;
    },
    {},
  );

  const missing = missingPlaceholders(row.en, arabic);
  const errorTokens = new Set(missing);
  const runsLong = arabic.trim() !== "" && row.en.trim() !== "" && arabic.length > row.en.length * 1.3;
  const state = stateOf(row);
  const canReview = !row.orphaned && row.status !== "reviewed" && arabic.trim() !== "" && missing.length === 0;

  return (
    <article className={styles.row} data-orphaned={row.orphaned ? "" : undefined}>
      <div className={styles.source} dir="ltr">
        <Mono tone="muted">{row.key}</Mono>
        <Text as="span"><PlaceholderText errorTokens={errorTokens} text={row.en} /></Text>
        {row.context ? <Text role="label" tone="muted">{row.context}</Text> : null}
        {row.orphaned ? <Text role="label" tone="muted">{strings.row.orphanNote}</Text> : null}
      </div>

      <div className={styles.translation}>
        <form action={saveAction} className={styles.form}>
          <input name="key" type="hidden" value={row.key} />
          <input name="expected_updated_at" type="hidden" value={row.updated_at} />
          <input name="locale" type="hidden" value={locale} />
          <span className={styles.arabic} dir="rtl" lang="ar">
            <TextInput
              label={fill(strings.row.arabicFor, { key: row.key })}
              name="ar"
              onChange={setArabic}
              value={arabic}
            />
          </span>
          <Button busy={savePending} disabled={savePending || missing.length > 0} type="submit" variant="primary">
            {savePending ? strings.row.saving : strings.row.save}
          </Button>
        </form>
        {missing.length > 0 ? (
          <Text live="alert" role="label" tone="danger">
            {fill(strings.row.placeholderError, { token: `{{${missing[0]}}}` })}
          </Text>
        ) : null}
        {runsLong ? <Text role="label" tone="warning">{strings.row.riskLong}</Text> : null}
        {saveState.error ? <Text live="alert" role="label" tone="danger">{saveState.error}</Text> : null}
        {saveState.ok && !savePending ? (
          <Text live="status" role="label" tone="success">{strings.row.saved}</Text>
        ) : null}
      </div>

      <div className={styles.state}>
        <StatusPill ping={false} tone={TONE[state]}>{strings.states[state]}</StatusPill>
        {canReview ? (
          <form action={reviewAction}>
            <input name="key" type="hidden" value={row.key} />
            <input name="expected_updated_at" type="hidden" value={row.updated_at} />
            <input name="locale" type="hidden" value={locale} />
            <Button busy={reviewPending} disabled={reviewPending} size="sm" type="submit" variant="secondary">
              {reviewPending ? strings.row.marking : strings.row.markReviewed}
            </Button>
          </form>
        ) : null}
        <LocalizationHistory locale={locale} row={row} strings={strings} />
        {reviewState.error ? <Text live="alert" role="label" tone="danger">{reviewState.error}</Text> : null}
      </div>
    </article>
  );
}
