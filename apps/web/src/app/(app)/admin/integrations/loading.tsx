import IntegrationsSkeleton from "@/components/sections/admin-integrations/integrations-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function LoadingIntegrations() {
  const locale = await getLocale();
  return <IntegrationsSkeleton label={getMessages(locale).adminIntegrations.loading} />;
}
