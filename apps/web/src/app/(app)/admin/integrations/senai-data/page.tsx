import SenaiDataScreen from "@/components/sections/admin-senai-data/senai-data-screen";
import { loadSenaiData } from "@/features/admin-senai-data/queries";
import { resolveSenaiTab } from "@/features/admin-senai-data/strings";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SenaiDataPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [locale, data, params] = await Promise.all([getLocale(), loadSenaiData(), searchParams]);

  return <SenaiDataScreen tab={resolveSenaiTab(params.tab)} data={data} locale={locale} />;
}
