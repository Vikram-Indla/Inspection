"use client";

import { useSyncExternalStore } from "react";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { fill } from "@/i18n/messages";
import { buildErrorStrings } from "@/features/execution/strings";
import type { Locale } from "@/lib/i18n";

const NEVER_CHANGES = () => () => undefined;
const readDocumentLocale = (): Locale => document.documentElement.lang === "ar" ? "ar" : "en";
const serverLocale = (): Locale => "en";

export default function ExecutionError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(NEVER_CHANGES, readDocumentLocale, serverLocale);
  const strings = buildErrorStrings(locale);
  const description = error.digest
    ? `${strings.body} ${fill(strings.reference, { digest: error.digest })}`
    : strings.body;

  return (
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
  );
}
