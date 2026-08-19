import EnforcementRecsScreen from "@/components/sections/admin-enforcement-recommendations/enforcement-recs-screen";
import { loadEnforcementRecommendations } from "@/features/admin-enforcement-recommendations/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EnforcementRecommendationsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadEnforcementRecommendations()]);
  return <EnforcementRecsScreen data={data} locale={locale} />;
}
