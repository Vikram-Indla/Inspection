import GisSkeleton from "@/components/sections/admin-gis/gis-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingGis() {
  const locale = await getLocale();
  return <GisSkeleton label={getMessages(locale).adminGis.loading} />;
}
