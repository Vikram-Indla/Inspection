import { Suspense } from "react";
import Shell from "@/components/Shell";
import ApprovalQueueScreen from "@/components/sections/approvals/queue/approval-queue-screen/approval-queue-screen";
import ApprovalsSkeleton from "@/components/sections/approvals/queue/approvals-skeleton/approvals-skeleton";
import { readApprovalScope, type ApprovalScopeInput } from "@/features/approvals/params";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ApprovalQueuePage({ searchParams }: {
  searchParams: Promise<ApprovalScopeInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { approvals } = getMessages(locale);
  const scope = readApprovalScope(params);

  return (
    <Shell current={scope.routeBase} title={approvals.title}>
      <Suspense fallback={<ApprovalsSkeleton label={approvals.loading} />}>
        <ApprovalQueueScreen locale={locale} scope={scope} />
      </Suspense>
    </Shell>
  );
}
