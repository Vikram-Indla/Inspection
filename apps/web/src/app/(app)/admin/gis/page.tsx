import GisScreen from "@/components/sections/admin-gis/gis-screen";
import { loadGis } from "@/features/admin-gis/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function GisStudioPage() {
  const [locale, data] = await Promise.all([getLocale(), loadGis()]);

  return <GisScreen data={data} locale={locale} />;
}
