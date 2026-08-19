import EnforcementRecsSkeleton from "@/components/sections/admin-enforcement-recommendations/enforcement-recs-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingEnforcementRecommendations() {
  const locale = await getLocale();
  return <EnforcementRecsSkeleton label={getMessages(locale).adminEnforcementRecommendations.loading} />;
}
