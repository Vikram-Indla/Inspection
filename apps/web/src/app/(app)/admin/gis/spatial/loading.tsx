import SpatialSkeleton from "@/components/sections/admin-gis-spatial/spatial-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingSpatial() {
  const locale = await getLocale();
  return <SpatialSkeleton label={getMessages(locale).adminGis.spatial.loading} />;
}
