"use client";

import { useSyncExternalStore } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Mono } from "@/components/saqeel/type";
import { adminAccessMessages } from "@/features/admin-access/strings";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

const NEVER_CHANGES = () => () => undefined;
const readDocumentLocale = (): Locale => document.documentElement.lang === "ar" ? "ar" : "en";
const serverLocale = (): Locale => "en";

export default function AccessError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(NEVER_CHANGES, readDocumentLocale, serverLocale);
  const strings = adminAccessMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
    >
      <EmptyState
        action={
          <>
            {error.digest ? <Mono>{fill(strings.error.reference, { id: error.digest })}</Mono> : null}
            <Button onClick={reset} variant="secondary">{strings.error.retry}</Button>
          </>
        }
        description={strings.error.body}
        icon="risk"
        title={strings.error.title}
        tone="danger"
      />
    </ShellPageFrame>
  );
}
