import ExpirySkeleton from "@/components/sections/admin-planning-expiry/expiry-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function PlanningExpiryLoading() {
  const locale = await getLocale();
  return <ExpirySkeleton label={getMessages(locale).adminPlanningExpiry.loading} />;
}
