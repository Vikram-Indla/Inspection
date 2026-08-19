import RiskModelsSkeleton from "@/components/sections/admin-risk-models/risk-models-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function RiskModelsLoading() {
  const locale = await getLocale();
  return <RiskModelsSkeleton label={getMessages(locale).adminRiskModels.loading} />;
}
