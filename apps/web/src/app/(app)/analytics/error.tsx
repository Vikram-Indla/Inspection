"use client";

import { useSyncExternalStore } from "react";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { analyticsMessages } from "@/features/analytics/strings";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-error.module.css";

const NEVER_CHANGES = () => () => undefined;
const readDocumentLocale = (): Locale => document.documentElement.lang === "ar" ? "ar" : "en";
const serverLocale = (): Locale => "en";

export default function AnalyticsError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(NEVER_CHANGES, readDocumentLocale, serverLocale);
  const strings = analyticsMessages(locale).error;
  const description = error.digest
    ? `${strings.body} ${fill(strings.reference, { id: error.digest })}`
    : strings.body;

  return (
    <div className={styles.frame}>
      <EmptyState
        icon="risk"
        tone="danger"
        title={strings.title}
        description={description}
        action={
          <Button variant="secondary" size="sm" onClick={reset} label={strings.retry}>
            {strings.retry}
          </Button>
        }
      />
    </div>
  );
}
