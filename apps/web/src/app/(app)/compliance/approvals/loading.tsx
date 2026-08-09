import ApprovalsSkeleton from "@/components/sections/approvals/queue/approvals-skeleton/approvals-skeleton";
import Shell from "@/components/Shell";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function ApprovalsLoading() {
  const { approvals } = getMessages(await getLocale());
  return (
    <Shell current="/compliance/approvals" title={approvals.title}>
      <ApprovalsSkeleton label={approvals.loading} />
    </Shell>
  );
}
