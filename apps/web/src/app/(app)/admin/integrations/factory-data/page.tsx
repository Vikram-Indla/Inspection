import FactoryDataScreen from "@/components/sections/admin-factory-data/factory-data-screen";
import { loadFactoryData } from "@/features/admin-factory-data/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function FactoryDataPage({ searchParams }: { searchParams: Promise<{ factory?: string }> }) {
  const params = await searchParams;
  const [locale, data] = await Promise.all([getLocale(), loadFactoryData(params.factory ?? "")]);

  return <FactoryDataScreen data={data} locale={locale} />;
}
