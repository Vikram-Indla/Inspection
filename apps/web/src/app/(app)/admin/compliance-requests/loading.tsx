import ComplianceRequestsSkeleton from "@/components/sections/admin-compliance-requests/compliance-requests-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function ComplianceRequestsLoading() {
  const locale = await getLocale();
  return <ComplianceRequestsSkeleton label={getMessages(locale).adminComplianceRequests.loading} />;
}
