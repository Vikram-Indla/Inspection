import SpatialScreen from "@/components/sections/admin-gis-spatial/spatial-screen";
import { loadSpatial } from "@/features/admin-gis-spatial/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SpatialPage() {
  const [locale, data] = await Promise.all([getLocale(), loadSpatial()]);

  return <SpatialScreen data={data} locale={locale} />;
}
