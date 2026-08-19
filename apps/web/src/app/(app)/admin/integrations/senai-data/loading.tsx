import SenaiDataSkeleton from "@/components/sections/admin-senai-data/senai-data-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingSenaiData() {
  const locale = await getLocale();
  return <SenaiDataSkeleton label={getMessages(locale).adminSenaiData.loading} />;
}
