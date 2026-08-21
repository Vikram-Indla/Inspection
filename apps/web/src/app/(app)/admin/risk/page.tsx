import RiskStudioScreen from "@/components/sections/admin-risk/risk-studio-screen";
import { loadRiskSettings } from "@/features/admin-risk/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RiskStudioPage() {
  const locale = await getLocale();
  const data = await loadRiskSettings(locale);

  return <RiskStudioScreen data={data} locale={locale} />;
}
