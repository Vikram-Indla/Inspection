import FactoryDataSkeleton from "@/components/sections/admin-factory-data/factory-data-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingFactoryData() {
  const locale = await getLocale();
  return <FactoryDataSkeleton label={getMessages(locale).adminFactoryData.loading} />;
}
