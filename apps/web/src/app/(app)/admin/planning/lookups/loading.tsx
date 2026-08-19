import LookupsSkeleton from "@/components/sections/admin-planning-lookups/lookups-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function PlanningLookupsLoading() {
  const locale = await getLocale();
  return <LookupsSkeleton label={getMessages(locale).adminPlanningLookups.loading} />;
}
