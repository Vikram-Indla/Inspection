import WorkflowsSkeleton from "@/components/sections/admin-workflows/workflows-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingWorkflows() {
  const locale = await getLocale();
  return <WorkflowsSkeleton label={getMessages(locale).adminWorkflows.loading} />;
}
