import RiskModelsScreen from "@/components/sections/admin-risk-models/risk-models-screen";
import { loadRiskModels } from "@/features/admin-risk-models/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RiskModelsPage() {
  const [locale, data] = await Promise.all([getLocale(), loadRiskModels()]);

  return <RiskModelsScreen data={data} locale={locale} />;
}
