import { Suspense } from "react";
import Shell from "@/components/Shell";
import LibrarySections from "@/components/compliance/library-sections/library-sections";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { readLibraryScope, type SearchParamsInput } from "@/features/compliance/scope";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ComplianceLibraryPage({ searchParams }: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const scope = readLibraryScope(params);
  const messages = getMessages(locale).compliance.library;

  return (
    <Shell current={scope.routeBase} title={messages.title}>
      <Suspense fallback={<EmptyState title={messages.loading} busy />}>
        <LibrarySections locale={locale} scope={scope} />
      </Suspense>
    </Shell>
  );
}
