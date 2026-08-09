import { Suspense } from "react";
import Shell from "@/components/Shell";
import ApprovalsSections from "@/components/compliance/approvals-sections/approvals-sections";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { readApprovalsScope, type SearchParamsInput } from "@/features/compliance/scope";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ApprovalQueuePage({ searchParams }: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const scope = readApprovalsScope(params);
  const messages = getMessages(locale).compliance.approvals;

  return (
    <Shell current={scope.routeBase} title={messages.title}>
      <Suspense fallback={<EmptyState title={messages.loading} busy />}>
        <ApprovalsSections locale={locale} scope={scope} />
      </Suspense>
    </Shell>
  );
}
