"use client";

import { useSyncExternalStore } from "react";
import RouteError from "@/components/saqeel/route-error/route-error";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

const NEVER_CHANGES = () => () => undefined;
const readDocumentLocale = (): Locale => document.documentElement.lang === "ar" ? "ar" : "en";
const serverLocale = (): Locale => "en";

export default function ComplianceRequestsError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(NEVER_CHANGES, readDocumentLocale, serverLocale);
  const copy = getMessages(locale).adminComplianceRequests;

  return (
    <RouteError
      title={copy.errorTitle}
      body={copy.errorBody}
      retryLabel={copy.retry}
      referenceLabel={copy.reference}
      reference={error.digest}
      onRetry={reset}
    />
  );
}
