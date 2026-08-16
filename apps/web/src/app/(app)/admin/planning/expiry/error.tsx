"use client";

import { useSyncExternalStore } from "react";
import { Button, Card, Heading, Text, linearTheme } from "@/components/experimental/linear";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "@/components/experimental/planning-expiry/expiry-screen.module.css";

const NEVER_CHANGES = () => () => undefined;
const readDocumentLocale = (): Locale => document.documentElement.lang === "ar" ? "ar" : "en";
const serverLocale = (): Locale => "en";

export default function PlanningExpiryError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(NEVER_CHANGES, readDocumentLocale, serverLocale);
  const copy = getMessages(locale).adminPlanningExpiry;

  return (
    <div className={linearTheme.root}>
      <div className={styles.page}>
        <Card as="section">
          <div className={styles.band}>
            <div className={styles.noticeBody} role="alert">
              <Heading level={1} role="bodyLg">{copy.error.heading}</Heading>
              <Text role="body" tone="muted">{copy.error.body}</Text>
              {error.digest ? (
                <Text role="mono" tone="muted">{`${copy.error.reference} ${error.digest}`}</Text>
              ) : null}
            </div>
            <div>
              <Button variant="primary" onClick={reset}>{copy.error.retry}</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
