import ApprovalsSkeleton from "@/components/sections/approvals/queue/approvals-skeleton/approvals-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function ApprovalsLoading() {
  const { approvals } = getMessages(await getLocale());
  return <ApprovalsSkeleton label={approvals.loading} />;
}
